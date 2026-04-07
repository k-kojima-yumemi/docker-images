import { Hono } from "hono";
import type { Logger } from "winston";
import type { EnvConfig } from "./envConfig";
import { configMiddleware } from "./middleware/config";
import { loggerMiddleware } from "./middleware/logger";
import { renderer } from "./middleware/renderer";
import { traceMiddleware } from "./middleware/trace";
import { defineDocRoutes } from "./route/doc";
import { estimateApp } from "./route/estimate";
import { healthApp } from "./route/health";
import { productsApp } from "./route/products";
import { summaryApp } from "./route/summary";

type HonoEnv = {
    config: EnvConfig;
    logger: Logger;
};

// biome-ignore lint/style/useNamingConvention: Hono
export type HonoContext = { Variables: HonoEnv };

export function createApp(config: EnvConfig) {
    const app = new Hono<HonoContext>();

    app.use(traceMiddleware, loggerMiddleware, renderer);
    app.use(configMiddleware(config));

    // Summary must be registered before /products/:id to avoid route conflict
    app.route("/", summaryApp);
    app.route("/", healthApp);
    app.route("/", productsApp);
    app.route("/", estimateApp);

    defineDocRoutes(app);

    app.notFound((c) => {
        return c.json({ message: "not found" }, 404);
    });

    return app;
}
