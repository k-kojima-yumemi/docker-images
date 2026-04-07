import { Hono } from "hono";
import { describeRoute, resolver } from "hono-openapi";
import type { HonoContext } from "../app";
import { HealthResponseSchema } from "../schema/health";

export const healthApp = new Hono<HonoContext>();

healthApp.get(
    "/health",
    describeRoute({
        description: "Liveness probe — returns ok when the service is running",
        tags: ["Health"],
        responses: {
            200: {
                description: "Service is running",
                content: {
                    "application/json": {
                        schema: resolver(HealthResponseSchema),
                    },
                },
            },
        },
    }),
    (c) => {
        return c.json({ status: "ok" as const });
    },
);
