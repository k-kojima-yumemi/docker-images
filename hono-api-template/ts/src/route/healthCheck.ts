import { OpenAPIHono } from "@hono/zod-openapi";
import { healthCheckRoute } from "../schema/hono-api-template/healthCheck";

export const HealthCheckApp = new OpenAPIHono();
HealthCheckApp.openapi(healthCheckRoute, (c) => {
    return c.json({ status: "ok" } as const);
});
