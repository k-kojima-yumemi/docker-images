# postgres-health-check

HTTP API that checks PostgreSQL connectivity.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health-check` | Liveness. Does not use the database. |
| GET | `/db-health-check` | Connects to PostgreSQL, runs `SELECT NOW()`, returns the result. |

GET /health-check

- 200: `{"status": "ok"}`

GET /db-health-check

- 200: `{"status": "ok", "currentTime": "<ISO8601>"}`
- 503: `{"status": "ng"}` when connection is missing, misconfigured, or the query fails. Error details are logged only.

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port. |
| `DATABASE_URL` | — | Connection string. Use this or the `DB_*` variables below. |
| `DB_HOST` | — | Database host. |
| `DB_PORT` | `5432` | Database port. |
| `DB_NAME` | — | Database name. |
| `DB_USER` | — | Database user. |
| `DB_PASSWORD` | — | Database password (optional). |

## How to run

```bash
docker run --rm -p 8080:8080 \
  -e PORT=8080 \
  -e DB_HOST=your-db-host \
  -e DB_NAME=your-db \
  -e DB_USER=your-user \
  ghcr.io/k-kojima-yumemi/postgres-health-check:latest
```
