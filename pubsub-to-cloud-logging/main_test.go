package main

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func newTestLogger(buf *bytes.Buffer) *log.Logger {
	return log.New(buf, "", 0)
}

func TestLogMiddleware(t *testing.T) {
	tests := []struct {
		name      string
		method    string
		path      string
		innerCode int
		wantInLog []string
	}{
		{
			name:      "logs method path status",
			method:    "POST",
			path:      "/push",
			innerCode: http.StatusNoContent,
			wantInLog: []string{"POST", "/push", "204"},
		},
		{
			name:      "implicit 200 when WriteHeader not called",
			method:    "GET",
			path:      "/healthz",
			innerCode: 0,
			wantInLog: []string{"GET", "/healthz", "200"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var logBuf bytes.Buffer
			logger := newTestLogger(&logBuf)
			inner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if tt.innerCode != 0 {
					w.WriteHeader(tt.innerCode)
				}
			})
			rec := httptest.NewRecorder()
			logMiddleware(logger, inner).ServeHTTP(rec, httptest.NewRequest(tt.method, tt.path, nil))
			got := logBuf.String()
			for _, want := range tt.wantInLog {
				if !strings.Contains(got, want) {
					t.Errorf("log %q missing %q", got, want)
				}
			}
		})
	}
}

func TestNotFoundHandler(t *testing.T) {
	tests := []struct {
		name      string
		method    string
		path      string
		wantInLog []string
	}{
		{
			name:      "GET to unknown path",
			method:    "GET",
			path:      "/unknown",
			wantInLog: []string{"GET", "/unknown"},
		},
		{
			name:      "DELETE to root",
			method:    "DELETE",
			path:      "/",
			wantInLog: []string{"DELETE", "/"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var logBuf bytes.Buffer
			logger := newTestLogger(&logBuf)
			h := notFoundHandler(logger)
			rec := httptest.NewRecorder()
			h.ServeHTTP(rec, httptest.NewRequest(tt.method, tt.path, nil))
			if rec.Code != http.StatusNotFound {
				t.Errorf("status = %d, want %d", rec.Code, http.StatusNotFound)
			}
			got := logBuf.String()
			for _, want := range tt.wantInLog {
				if !strings.Contains(got, want) {
					t.Errorf("log %q missing %q", got, want)
				}
			}
		})
	}
}

func TestHandler(t *testing.T) {
	tests := []struct {
		name     string
		body     string
		wantCode int
		wantSev  string
	}{
		{
			name:     "json payload",
			body:     `{"message":{"data":"eyJhIjoxfQ==","messageId":"1"}}`,
			wantCode: http.StatusNoContent,
			wantSev:  "INFO",
		},
		{
			name:     "plain text payload",
			body:     `{"message":{"data":"aGVsbG8=","messageId":"2"}}`,
			wantCode: http.StatusNoContent,
			wantSev:  "INFO",
		},
		{
			name:     "broken envelope is acked",
			body:     `not json`,
			wantCode: http.StatusNoContent,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var buf bytes.Buffer
			h := &handler{
				cfg: config{severity: "INFO", payloadKey: "data", maxBytes: 200_000},
				out: &buf,
			}

			rec := httptest.NewRecorder()
			h.ServeHTTP(rec, httptest.NewRequest("POST", "/", strings.NewReader(tt.body)))

			if rec.Code != tt.wantCode {
				t.Errorf("status = %d, want %d", rec.Code, tt.wantCode)
			}
			if tt.wantSev == "" {
				return
			}
			var got map[string]any
			if err := json.Unmarshal(buf.Bytes(), &got); err != nil {
				t.Fatalf("output is not valid JSON: %v", err)
			}
			if got["severity"] != tt.wantSev {
				t.Errorf("severity = %v, want %v", got["severity"], tt.wantSev)
			}
		})
	}
}
