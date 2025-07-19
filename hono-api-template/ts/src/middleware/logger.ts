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
    await next();
    logger.info({
        message: `${c.req.method} ${c.req.url} - ${Date.now() - start}ms ${c.res.status}`,
        requestHeader: c.req.header(),
        responseHeader: Object.fromEntries(c.res.headers.entries()),
    });
});
