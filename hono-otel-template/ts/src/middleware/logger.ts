import { structuredLogger } from "@hono/structured-logger";
import { trace } from "@opentelemetry/api";
import * as winston from "winston";

const baseLogger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
    ),
    transports: [new winston.transports.Console()],
});

export const loggerMiddleware = structuredLogger({
    createLogger: (c) => {
        // traceMiddleware has already created and activated the request span,
        // so the span context is available here for correlation.
        const spanContext = trace.getActiveSpan()?.spanContext();
        return baseLogger.child({
            traceId: spanContext?.traceId,
            spanId: spanContext?.spanId,
            // x-request-id is a de-facto standard supported by AWS ALB,
            // GCP Load Balancer, Nginx, and most reverse proxies.
            requestId: c.req.header("x-request-id"),
        });
    },
    onResponse: (logger, c, elapsedMs) => {
        logger.info({
            message: `${c.req.method} ${c.req.url} - ${Math.round(elapsedMs)}ms ${c.res.status}`,
            requestHeader: c.req.header(),
            responseHeader: Object.fromEntries(c.res.headers.entries()),
        });
    },
    onError: (logger, err, c, elapsedMs) => {
        logger.error({
            message: `${c.req.method} ${c.req.url} - ${Math.round(elapsedMs)}ms`,
            err,
            requestHeader: c.req.header(),
        });
    },
});
