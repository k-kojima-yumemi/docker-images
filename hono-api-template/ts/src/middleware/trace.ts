import type { HonoRequest } from "hono";
import { createMiddleware } from "hono/factory";

export type AwsTrace = {
    traceId: string | undefined;
    awsRequestId: string | undefined;
    functionUrlRequestId: string | undefined;
};

export const traceMiddleware = createMiddleware(async (c, next) => {
    c.set("trace", getTrace(c.req));
    await next();
});

function getTrace(req: HonoRequest): AwsTrace {
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
