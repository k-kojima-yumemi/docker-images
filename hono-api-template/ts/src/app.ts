import { OpenAPIHono } from "@hono/zod-openapi";
import { createMiddleware } from "hono/factory";
import type { Logger } from "winston";
import type { EnvConfig } from "./envConfig";
import { loggerMiddleware } from "./middleware/logger";
import { renderer } from "./middleware/renderer";
import type { AwsTrace } from "./middleware/trace";
import { traceMiddleware } from "./middleware/trace";
import { defineOpenApiDocRoutes } from "./route/doc";
import { HealthCheckApp } from "./route/healthCheck";

type HonoEnv = {
    config: EnvConfig;
    logger: Logger;
    trace: AwsTrace;
};

// biome-ignore lint/style/useNamingConvention: Hono
export type HonoContext = { Variables: HonoEnv };

export function createApp(config: EnvConfig) {
    const app = new OpenAPIHono<HonoContext>();
    app.use(traceMiddleware, loggerMiddleware, renderer);
    app.use(
        createMiddleware(async (c, next) => {
            c.set("config", config);
            await next();
        }),
    );
    app.route("/", HealthCheckApp);

    app.notFound((c) => {
        return c.json({ message: "not found" }, 404);
    });
    defineOpenApiDocRoutes(app);

    return app;
}
