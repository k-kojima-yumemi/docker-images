// Package main implements a Pub/Sub push endpoint that writes received
// messages to stdout as structured logs for Cloud Logging.
package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

type pushRequest struct {
	Message struct {
		Data        []byte            `json:"data"` // base64 is decoded automatically
		Attributes  map[string]string `json:"attributes"`
		MessageID   string            `json:"messageId"`
		PublishTime time.Time         `json:"publishTime"`
	} `json:"message"`
	Subscription    string `json:"subscription"`
	DeliveryAttempt int    `json:"deliveryAttempt"`
}

var validSeverity = map[string]bool{
	"DEFAULT": true, "DEBUG": true, "INFO": true, "NOTICE": true, "WARNING": true,
	"ERROR": true, "CRITICAL": true, "ALERT": true, "EMERGENCY": true,
}

type config struct {
	labels       map[string]string
	severity     string
	severityAttr string
	payloadKey   string
	maxBytes     int
}

func loadConfig() config {
	c := config{
		labels:       parseLabels(os.Getenv("LOG_LABELS")),
		severity:     envOr("SEVERITY", "INFO"),
		severityAttr: os.Getenv("SEVERITY_ATTRIBUTE"),
		payloadKey:   envOr("PAYLOAD_KEY", "data"),
		maxBytes:     envInt("MAX_ENTRY_BYTES", 200_000),
	}
	if !validSeverity[c.severity] {
		log.Fatalf("invalid SEVERITY: %q", c.severity)
	}
	return c
}

// parseLabels parses "k=v,k2=v2" into a map.
func parseLabels(s string) map[string]string {
	m := map[string]string{}
	for _, pair := range strings.Split(s, ",") {
		if k, v, ok := strings.Cut(strings.TrimSpace(pair), "="); ok {
			m[k] = v
		}
	}
	return m
}

func envOr(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func envInt(k string, def int) int {
	if n, err := strconv.Atoi(os.Getenv(k)); err == nil && n > 0 {
		return n
	}
	return def
}

type handler struct {
	cfg config
	out io.Writer
	mu  sync.Mutex
}

// responseRecorder captures the HTTP status code set by a handler.
type responseRecorder struct {
	http.ResponseWriter
	status int
	wrote  bool
}

func (r *responseRecorder) WriteHeader(code int) {
	if !r.wrote {
		r.status = code
		r.wrote = true
	}
	r.ResponseWriter.WriteHeader(code)
}

func (r *responseRecorder) Write(b []byte) (int, error) {
	if !r.wrote {
		r.WriteHeader(http.StatusOK)
	}
	return r.ResponseWriter.Write(b)
}

func (r *responseRecorder) statusCode() int {
	if r.status == 0 {
		return http.StatusOK
	}
	return r.status
}

func logMiddleware(logger *log.Logger, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		rec := &responseRecorder{ResponseWriter: w}
		next.ServeHTTP(rec, r)
		logger.Printf("method=%s path=%s status=%d remote=%s", r.Method, r.URL.Path, rec.statusCode(), r.RemoteAddr)
	})
}

func notFoundHandler(logger *log.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(io.LimitReader(r.Body, 1024))
		logger.Printf("unhandled method=%s path=%s contentType=%q bodySnippet=%q remote=%s",
			r.Method, r.URL.Path, r.Header.Get("Content-Type"), string(body), r.RemoteAddr)
		http.NotFound(w, r)
	}
}

func (h *handler) severityFor(attrs map[string]string) string {
	if h.cfg.severityAttr == "" {
		return h.cfg.severity
	}
	if s := strings.ToUpper(attrs[h.cfg.severityAttr]); validSeverity[s] {
		return s
	}
	return h.cfg.severity
}

func (h *handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	var push pushRequest
	if err := json.NewDecoder(r.Body).Decode(&push); err != nil {
		// Not recoverable, so return 204 to avoid retrying
		w.WriteHeader(http.StatusNoContent)
		return
	}
	m := push.Message

	// JSON or string payload
	var payload any
	if json.Valid(m.Data) {
		payload = json.RawMessage(m.Data)
	} else {
		payload = string(m.Data)
	}

	entry := map[string]any{
		"severity":                      h.severityFor(m.Attributes),
		"logging.googleapis.com/labels": h.cfg.labels,
		h.cfg.payloadKey:                payload,
		"pubsub": map[string]any{
			"messageId":       m.MessageID,
			"publishTime":     m.PublishTime,
			"subscription":    push.Subscription,
			"attributes":      m.Attributes,
			"deliveryAttempt": push.DeliveryAttempt,
		},
	}

	out, err := json.Marshal(entry)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	if len(out) > h.cfg.maxBytes {
		// Truncate the payload to avoid exceeding the max entry size.
		entry[h.cfg.payloadKey] = string(m.Data[:min(len(m.Data), 1024)])
		entry["truncated"] = true
		entry["originalBytes"] = len(m.Data)
		if out, err = json.Marshal(entry); err != nil {
			w.WriteHeader(http.StatusNoContent)
			return
		}
	}

	h.mu.Lock()
	_, err = h.out.Write(append(out, '\n'))
	h.mu.Unlock()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func main() {
	h := &handler{cfg: loadConfig(), out: os.Stdout}
	logger := log.New(os.Stderr, "", log.LstdFlags)
	mux := http.NewServeMux()
	mux.Handle("POST /", h)
	mux.HandleFunc("GET /health-check", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "no-store")
		w.WriteHeader(http.StatusOK)
		io.WriteString(w, `{"status":"ok"}`)
	})
	mux.HandleFunc("/", notFoundHandler(logger))
	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "8080"), logMiddleware(logger, mux)))
}
