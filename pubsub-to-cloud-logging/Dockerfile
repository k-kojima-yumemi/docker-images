FROM --platform=$BUILDPLATFORM golang:1.26.1 AS build
ARG TARGETOS TARGETARCH
WORKDIR /src
COPY go.mod ./
COPY *.go ./
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build \
    -trimpath -ldflags="-s -w" -o /app

FROM gcr.io/distroless/static-debian13:nonroot
COPY --from=build /app /app
USER nonroot
LABEL org.opencontainers.image.source="https://github.com/k-kojima-yumemi/docker-images"
LABEL org.opencontainers.image.title="pubsub-to-cloud-logging"
LABEL org.opencontainers.image.description="An image to export Pub/Sub messages to Cloud Logging"
ENTRYPOINT ["/app"]
