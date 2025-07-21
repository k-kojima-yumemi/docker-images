import type { HonoRequest } from "hono";
import { createMiddleware } from "hono/factory";
import * as winston from "winston";

const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
    ),
    transports: [new winston.transports.Console()],
});

export const loggerMiddleware = createMiddleware(async (c, next) => {
    const start = Date.now();
    const trace = getTrace(c.req);
    c.set("trace", trace);
    c.set("logger", logger);
    await next();
    logger.info({
        message: `${c.req.method} ${c.req.url} - ${Date.now() - start}ms ${c.res.status}`,
        requestHeader: c.req.header(),
        responseHeader: Object.fromEntries(c.res.headers.entries()),
        trace,
    });
});

function getTrace(req: HonoRequest) {
    const traceId = req.header("x-amzn-trace-id");
    const lambdaContext = req.header("x-amzn-lambda-context");
    const requestContext = req.header("x-amzn-request-context");

    let awsRequestId: string | undefined;
    if (lambdaContext) {
        try {
            const lambdaContextJson = JSON.parse(lambdaContext);
            awsRequestId = lambdaContextJson.awsRequestId;
        } catch (_e) {}
    }

    let functionUrlRequestId: string | undefined;
    if (requestContext) {
        try {
            const requestContextJson = JSON.parse(requestContext);
            functionUrlRequestId = requestContextJson.requestId;
        } catch (_e) {}
    }

    return {
        traceId,
        awsRequestId,
        functionUrlRequestId,
    };
}
