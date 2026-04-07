import { SpanStatusCode } from "@opentelemetry/api";
import { createMiddleware } from "hono/factory";
import { tracer } from "../tracer";

export const traceMiddleware = createMiddleware(async (c, next) => {
    return tracer.startActiveSpan(
        `${c.req.method} ${c.req.path}`,
        async (span) => {
            span.setAttributes({
                "http.method": c.req.method,
                "http.url": c.req.url,
                "http.target": c.req.path,
            });

            try {
                await next();

                span.setAttribute("http.status_code", c.res.status);
                span.setStatus({
                    code:
                        c.res.status >= 500
                            ? SpanStatusCode.ERROR
                            : SpanStatusCode.OK,
                });
            } catch (err) {
                span.recordException(err as Error);
                span.setStatus({ code: SpanStatusCode.ERROR });
                throw err;
            } finally {
                span.end();
            }
        },
    );
});
