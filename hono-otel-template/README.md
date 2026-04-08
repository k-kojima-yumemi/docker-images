# hono-otel-template

A Node.js/TypeScript REST API template demonstrating [Hono](https://hono.dev/) with [OpenTelemetry](https://opentelemetry.io/) distributed tracing, structured logging, and auto-generated OpenAPI documentation.

## Features

- **Hono** — lightweight, modern web framework
- **OpenTelemetry** — distributed tracing with OTLP HTTP export or console fallback
- **Valibot** — runtime schema validation for all inputs
- **Winston** — structured logging with trace/span ID correlation
- **hono-openapi** — auto-generated OpenAPI spec and Redoc UI
- **Docker** — containerized deployment via `Lambda.Dockerfile`

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | Server listening port |
| `NODE_ENV` | No | `development` | Application environment (`development` \| `production` \| `test`) |
| `LOG_LEVEL` | No | `info` | Winston log level (`debug` \| `info` \| `warn` \| `error`) |
| `OTEL_SERVICE_NAME` | No | `hono-otel-template` | OpenTelemetry service name attached to all traces |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | No | _(unset)_ | OTLP HTTP collector endpoint (e.g. `http://localhost:4318`). When unset, traces are printed to console |

## Getting Started

```bash
cd ts
npm ci
```

### Development

```bash
npm run dev
```

The server starts on `http://localhost:${PORT}` (default: `3000`).

### Build

```bash
npm run build
# Output: dist/index.cjs
```

### Test

```bash
npm test
```

### Lint / Format

```bash
npm run format   # auto-fix
npm run ci       # lint + type-check (no writes)
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness probe |
| `GET` | `/products` | List products (supports filtering and pagination) |
| `GET` | `/products/:id` | Get a single product |
| `GET` | `/products/summary` | Aggregate statistics across products |
| `POST` | `/products/:id/estimate` | Calculate a detailed price estimate |
| `GET` | `/openapi.json` | OpenAPI 3.0 specification |
| `GET` | `/openapi.html` | Interactive Redoc documentation UI |

### Example — List products

```
GET /products?category=electronics&minPrice=100&maxPrice=500&currency=USD&limit=10&offset=0
```

### Example — Price estimate

```
POST /products/1/estimate
Content-Type: application/json

{
  "quantity": 3,
  "currency": "USD",
  "options": {
    "includeShipping": true,
    "includeTax": true,
    "discountCode": "SAVE10"
  }
}
```

## OpenTelemetry

`instrumentation.ts` must be imported before any other application code so that Node.js HTTP internals are patched first.

When `OTEL_EXPORTER_OTLP_ENDPOINT` is set, traces are sent to `<endpoint>/v1/traces`. Otherwise they are printed to the console via `ConsoleSpanExporter`.

Each HTTP request creates a root span via `traceMiddleware`. Service-layer functions create child spans so the full call graph is visible in your tracing backend.

## Docker

```bash
docker build -f Lambda.Dockerfile -t hono-otel-template .
```

The image uses a distroless Node.js 24 runtime.
It includes the [AWS Lambda Web Adapter](https://github.com/aws/aws-lambda-web-adapter), which enables deployment on AWS Lambda while remaining compatible with any standard container environment.

Default environment inside the image:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `8080` |
| `LOG_LEVEL` | `info` |
| `OTEL_SERVICE_NAME` | `hono-otel-template` |
