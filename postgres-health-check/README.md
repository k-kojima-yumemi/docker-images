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
| `DATABASE_URL` | — | Connection string. Use this or the `DB_*` / `POSTGRES_*` variables below. |
| `DB_HOST` / `POSTGRES_HOST` | — | Database host. |
| `DB_PORT` / `POSTGRES_PORT` | `5432` | Database port. |
| `DB_NAME` / `POSTGRES_DB` | — | Database name. (`DB_DATABASE` is also accepted as an alias for `DB_NAME`.) |
| `DB_USER` / `POSTGRES_USER` | — | Database user. |
| `DB_PASSWORD` / `POSTGRES_PASSWORD` | — | Database password (optional). |

Both `POSTGRES_*` and `DB_*` can be used. If both are set for the same option, `POSTGRES_*` takes precedence.

## How to run

```bash
docker run --rm -p 8080:8080 \
  -e PORT=8080 \
  -e DB_HOST=your-db-host \
  -e DB_NAME=your-db \
  -e DB_USER=your-user \
  ghcr.io/k-kojima-yumemi/postgres-health-check:latest
```

Example using `POSTGRES_*`:

```bash
docker run --rm -p 8080:8080 \
  -e PORT=8080 \
  -e POSTGRES_HOST=10.1.0.2 \
  -e POSTGRES_DB=dev_h2o_db \
  -e POSTGRES_PORT=5432 \
  -e POSTGRES_USER=dev_h2o_db_user \
  -e POSTGRES_PASSWORD=your-password \
  ghcr.io/k-kojima-yumemi/postgres-health-check:latest
```
