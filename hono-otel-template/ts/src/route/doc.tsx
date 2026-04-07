import type { Hono } from "hono";
import { generateSpecs } from "hono-openapi";
import type { HonoContext } from "../app";

const openApiPath = "/openapi.json";

export function defineDocRoutes(app: Hono<HonoContext>) {
    app.get(openApiPath, async (c) => {
        const spec = await generateSpecs(
            app,
            {
                documentation: {
                    openapi: "3.0.3",
                    info: {
                        title: "Product Estimation API",
                        version: "1.0",
                        description:
                            "Sample API demonstrating OpenTelemetry tracing with Hono and Valibot.",
                    },
                    servers: [
                        {
                            url: new URL(c.req.url).origin,
                            description: "Current environment",
                        },
                    ],
                },
            },
            c,
        );
        return c.json(spec);
    });

    app.get("/openapi.html", (c) => {
        return c.render(
            <>
                <title>OpenApi</title>
                <redoc spec-url={openApiPath} />
                <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js" />
            </>,
        );
    });
}
