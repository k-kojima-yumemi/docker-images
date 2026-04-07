import { createMiddleware } from "hono/factory";
import type { HonoContext } from "../app";
import type { EnvConfig } from "../envConfig";

export function configMiddleware(config: EnvConfig) {
    return createMiddleware<HonoContext>(async (c, next) => {
        c.set("config", config);
        await next();
    });
}
