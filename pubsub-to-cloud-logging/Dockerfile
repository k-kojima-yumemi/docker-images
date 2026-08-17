FROM golang:1.26.1 AS build
WORKDIR /src
COPY go.mod ./
COPY *.go ./
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /app

FROM gcr.io/distroless/static-debian13:nonroot
COPY --from=build /app /app
USER nonroot
ENTRYPOINT ["/app"]
