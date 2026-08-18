# pubsub-to-cloud-logging

Receives Pub/Sub push messages and writes them to stdout as structured logs, so they can be picked up by Cloud Logging and used with log-based alerts, log-based metrics, or log sinks.

Google Cloud has no built-in path from a Pub/Sub topic to Cloud Logging. Services that only publish to Pub/Sub (Security Command Center continuous exports, Cloud Build notifications, Eventarc, third-party webhooks bridged into Pub/Sub) therefore cannot be routed into Cloud Monitoring alerting without a small piece of glue. This is that glue.

The payload is passed through unmodified. This service has no knowledge of the message schema, so it does not need updating when the producer changes its format.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Pub/Sub push endpoint. Writes the message to stdout as one JSON line. |
| GET | `/health-check` | Liveness. Does not depend on anything external. |

### POST /

Expects a [Pub/Sub push request body](https://docs.cloud.google.com/pubsub/docs/push). The response code controls Pub/Sub acknowledgement:

- `204`: message acknowledged. Returned on success, and also when the request body is not a valid push envelope — a malformed message will never succeed on retry, so acknowledging it avoids an infinite redelivery loop.
- `500`: message not acknowledged. Returned only when the write to stdout fails, so Pub/Sub redelivers.

Configure a dead-letter topic on the subscription to catch messages that fail repeatedly.

### GET /health-check

- 200: `{"status": "ok", "version": "<build version>", "uptimeSeconds": <int>}`

Cloud Run does not call this by default; its built-in startup check only waits for the port to open. Set `--liveness-probe httpGet.path=/health-check` if you want it used.

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Server port. |
| `LOG_LABELS` | — | Static labels applied to every entry, as `key=value` pairs separated by commas. Written to `logging.googleapis.com/labels`, which Cloud Logging promotes to the indexed `labels` field of the LogEntry. |
| `SEVERITY` | `INFO` | Severity for every entry. Must be a valid [LogSeverity](https://docs.cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#logseverity) value. Invalid values fail at startup. |
| `SEVERITY_ATTRIBUTE` | — | Name of a Pub/Sub message attribute to read the severity from, per message. Falls back to `SEVERITY` when the attribute is absent or holds an invalid value. |
| `PAYLOAD_KEY` | `data` | Key under which the message payload is nested in the log entry. |
| `MAX_ENTRY_BYTES` | `200000` | Entries larger than this are truncated rather than dropped. Cloud Logging rejects entries over 256 KB; the default leaves headroom for the metadata this service adds. |

## Output format

One JSON object per line on stdout:

```json
{
  "severity": "ERROR",
  "logging.googleapis.com/labels": {
    "event": "scc_finding",
    "component": "security-notify",
    "schema": "v1"
  },
  "scc": {
    "finding": { "category": "PUBLIC_BUCKET_ACL", "severity": "HIGH" }
  },
  "pubsub": {
    "messageId": "12345",
    "publishTime": "2026-08-17T09:30:00Z",
    "subscription": "projects/p/subscriptions/s",
    "attributes": {},
    "deliveryAttempt": 1
  }
}
```

The payload is always nested under `PAYLOAD_KEY` and never merged into the top level. Cloud Logging treats `severity`, `message`, `timestamp`, `httpRequest`, and several `logging.googleapis.com/*` keys as reserved, and a producer that happens to use one of those names would silently corrupt the entry.

JSON payloads are embedded as objects and remain queryable field by field. Non-JSON payloads are embedded as a string.

Truncated entries carry `"truncated": true` and `"originalBytes": <int>`.

## How to run

```bash
docker run --rm --init -p 8080:8080 \
  -e PORT=8080 \
  ghcr.io/k-kojima-yumemi/pubsub-to-cloud-logging:latest
```

Example with labels and a fixed severity:

```bash
docker run --rm --init -p 8080:8080 \
  -e PORT=8080 \
  -e 'LOG_LABELS=event=scc_finding,component=security-notify,schema=v1' \
  -e SEVERITY=ERROR \
  -e PAYLOAD_KEY=scc \
  ghcr.io/k-kojima-yumemi/pubsub-to-cloud-logging:latest
```

Example reading the severity from a message attribute:

```bash
docker run --rm --init -p 8080:8080 \
  -e PORT=8080 \
  -e 'LOG_LABELS=component=build-notify' \
  -e SEVERITY_ATTRIBUTE=level \
  -e SEVERITY=INFO \
  ghcr.io/k-kojima-yumemi/pubsub-to-cloud-logging:latest
```

Send a test message:

```bash
curl -X POST localhost:8080 -H 'Content-Type: application/json' -d '{
  "message": {
    "data": "eyJoZWxsbyI6IndvcmxkIn0=",
    "messageId": "1",
    "attributes": {}
  },
  "subscription": "projects/p/subscriptions/s"
}'
```

## Deploying to Cloud Run

```bash
gcloud run deploy pubsub-to-cloud-logging \
  --image ghcr.io/k-kojima-yumemi/pubsub-to-cloud-logging:latest \
  --region asia-northeast1 \
  --no-allow-unauthenticated \
  --set-env-vars 'LOG_LABELS=event=scc_finding,component=security-notify' \
  --set-env-vars 'SEVERITY=ERROR' \
  --set-env-vars 'PAYLOAD_KEY=scc'
```

Then point a push subscription at it, using OIDC so the endpoint stays private:

```bash
gcloud pubsub subscriptions create scc-findings-push \
  --topic scc-findings \
  --push-endpoint "$(gcloud run services describe pubsub-to-cloud-logging \
      --region asia-northeast1 --format 'value(status.url)')" \
  --push-auth-service-account pubsub-pusher@PROJECT_ID.iam.gserviceaccount.com \
  --dead-letter-topic scc-findings-dlq \
  --max-delivery-attempts 5
```

The service account needs `roles/run.invoker` on the service. Leaving the endpoint public would let anyone inject fabricated log entries, which matters when those entries drive alerting.

## Using the logs

Log-based alert policy that extracts fields into the notification body:

```yaml
conditions:
- displayName: New finding
  conditionMatchedLog:
    filter: |
      labels.event="scc_finding"
      jsonPayload.scc.finding.severity=("HIGH" OR "CRITICAL")
    labelExtractors:
      category: EXTRACT(jsonPayload.scc.finding.category)
      resource: EXTRACT(jsonPayload.scc.finding.resourceName)
alertStrategy:
  notificationRateLimit: {period: 300s}
  autoClose: 1800s
documentation:
  mimeType: text/markdown
  content: |
    **${log.extracted_label.category}**
    Resource: ${log.extracted_label.resource}
```

Field extraction lives in the alert policy rather than in this service, so changing what appears in a notification does not require a redeploy.

Routing to a dedicated log bucket with its own retention:

```bash
gcloud logging sinks create findings-sink \
  logging.googleapis.com/projects/PROJECT_ID/locations/asia-northeast1/buckets/findings \
  --log-filter='labels.event="scc_finding"'
```

Note that log-based alert policies are subject to a limit of 20 notifications per policy per day. Filter aggressively at the source — in the producer's export configuration or in the Pub/Sub subscription filter — rather than relying on the alert condition alone.

## What this does not do

Kept deliberately narrow. The following are out of scope, because each one would require a configuration language and turn a pass-through into a transformation engine:

- Merging the payload into the top level of the log entry
- Filtering messages (use a Pub/Sub subscription filter or a Logging exclusion filter)
- Reshaping, renaming, or enriching payload fields
- Deduplication

## Build

Go, no third-party dependencies.

```bash
go test -race ./...
go build ./...
docker build -t pubsub-to-cloud-logging .
```
