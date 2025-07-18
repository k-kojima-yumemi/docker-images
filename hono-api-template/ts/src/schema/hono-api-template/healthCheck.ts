import { createRoute, z } from "@hono/zod-openapi";

const HealthCheckSchema = z
    .object({
        status: z.literal("ok"),
    })
    .openapi("HealthCheck");

export const healthCheckRoute = createRoute({
    method: "get",
    path: "health-check",
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: HealthCheckSchema,
                },
            },
            description: "Health Check",
        },
    },
});

export const healthRoute = createRoute({
    method: "get",
    path: "health",
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: HealthCheckSchema,
                },
            },
            description: "Health Check",
        },
    },
});
