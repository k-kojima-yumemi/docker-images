# ecs-initial-image
Initial Image for ALB + ECS

## Docker Image

This project provides a Docker image designed for AWS ECS environments.

## How to Run

### Docker Execution
```bash
# Basic startup
docker run --init --it --rm -p 8080:8080 ghcr.io/k-kojima-yumemi/ecs-initial-image:latest

# Startup with environment variables
docker run --init --it --rm -p 8080:8080 \
  -e RESPONSE_CONTENT="Custom Response" \
  -e RESPONSE_STATUS=201 \
  -e RESPONSE_CONTENT_TYPE="application/json" \
  ghcr.io/k-kojima-yumemi/ecs-initial-image:latest
```

## Environment Variables Configuration

### Application Settings

| Environment Variable | Default Value | Description |
|---------------------|---------------|-------------|
| `PORT` | `8080` (Docker) | Server listening port |
| `RESPONSE_CONTENT` | `"Hello World"` | Response body content |
| `RESPONSE_STATUS` | `200` | HTTP status code |
| `RESPONSE_CONTENT_TYPE` | `"text/plain"` | Response Content-Type |

### Configuration Examples

#### Basic Text Response
```bash
docker run --init --it --rm -p 8080:8080 \
  -e RESPONSE_CONTENT="Hello, ECS!" \
  ghcr.io/k-kojima-yumemi/ecs-initial-image:latest
```
**Response:**
```
HTTP/1.1 200 OK
Content-Type: text/plain

Hello, ECS!
```

#### JSON Response
```bash
docker run --init --it --rm -p 8080:8080 \
  -e RESPONSE_CONTENT='{"message": "Hello, World!", "status": "ok"}' \
  -e RESPONSE_CONTENT_TYPE="application/json" \
  ghcr.io/k-kojima-yumemi/ecs-initial-image:latest
```
**Response:**
```
HTTP/1.1 200 OK
Content-Type: application/json

{"message": "Hello, World!", "status": "ok"}
```

#### Custom Status Code
```bash
docker run --init --it --rm -p 8080:8080 \
  -e RESPONSE_CONTENT="Not Found" \
  -e RESPONSE_STATUS=404 \
  ghcr.io/k-kojima-yumemi/ecs-initial-image:latest
```
**Response:**
```
HTTP/1.1 404 Not Found
Content-Type: text/plain

Not Found
```

## Health Check

To verify application status:
```bash
curl http://localhost:8080
```
**Response:**
```
HTTP/1.1 200 OK
Content-Type: text/plain

Hello World
```

All endpoints return the same response.
