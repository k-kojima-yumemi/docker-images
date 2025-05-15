import type { OpenAPIHono } from "@hono/zod-openapi";
import type { HonoContext } from "../app";

const openApiPath = "/openapi.json";

export function defineOpenApiDocRoutes(app: OpenAPIHono<HonoContext>) {
    app.doc(openApiPath, (c) => ({
        openapi: "3.0.3",
        info: {
            title: "Sample",
            version: "1.0",
        },
        servers: [
            {
                url: new URL(c.req.url).origin,
                description: "Current environment",
            },
        ],
    }));
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
