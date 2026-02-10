import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import type { EnvConfig } from "./envConfig";
import { dbHealthCheckApp } from "./route/dbHealthCheck";
import { healthCheckApp } from "./route/healthCheck";

type HonoEnv = { config: EnvConfig };

// biome-ignore lint/style/useNamingConvention: Hono
export type HonoContext = { Variables: HonoEnv };

export function createApp(config: EnvConfig) {
    const app = new Hono<HonoContext>();
    app.use(
        createMiddleware(async (c, next) => {
            c.set("config", config);
            await next();
        }),
    );
    app.route("/", healthCheckApp);
    app.route("/", dbHealthCheckApp);
    app.notFound((c) => c.json({ message: "not found" }, 404));
    return app;
}
