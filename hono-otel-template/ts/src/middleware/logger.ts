import { trace } from "@opentelemetry/api";
import { createMiddleware } from "hono/factory";
import * as winston from "winston";

const baseLogger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
    ),
    transports: [new winston.transports.Console()],
});

export const loggerMiddleware = createMiddleware(async (c, next) => {
    const start = Date.now();

    // traceMiddleware has already created and activated the request span,
    // so the span context is available here for correlation.
    const spanContext = trace.getActiveSpan()?.spanContext();
    const requestLogger = baseLogger.child({
        traceId: spanContext?.traceId,
        spanId: spanContext?.spanId,
        // x-request-id is a de-facto standard supported by AWS ALB,
        // GCP Load Balancer, Nginx, and most reverse proxies.
        requestId: c.req.header("x-request-id"),
    });
    c.set("logger", requestLogger);

    await next();

    requestLogger.info({
        message: `${c.req.method} ${c.req.url} - ${Date.now() - start}ms ${c.res.status}`,
        requestHeader: c.req.header(),
        responseHeader: Object.fromEntries(c.res.headers.entries()),
    });
});
