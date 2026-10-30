import { structuredLogger } from "@hono/structured-logger";
import type { Logger } from "winston";
import * as winston from "winston";
import type { AwsTrace } from "./trace";

const baseLogger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
    ),
    transports: [new winston.transports.Console()],
});

type TraceEnv = {
    // biome-ignore lint/style/useNamingConvention: Hono
    Variables: {
        trace: AwsTrace;
    };
};

// Requires traceMiddleware to run first so c.var.trace is available.
export const loggerMiddleware = structuredLogger<TraceEnv, Logger>({
    createLogger: (c) => baseLogger.child({ trace: c.var.trace }),
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
