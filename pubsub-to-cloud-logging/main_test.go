package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

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
