import { OpenAPIHono } from "@hono/zod-openapi";
import { describe, expect, it } from "vitest";
import type { HonoContext } from "../app";
import { defineOpenApiDocRoutes } from "./doc";

const DocApp = new OpenAPIHono<HonoContext>();
defineOpenApiDocRoutes(DocApp);

describe("Doc Route", () => {
    it("should return valid OpenAPI JSON", async () => {
        // Create a mock request to the OpenAPI JSON endpoint
        const res = await DocApp.request("/openapi.json");

        // Check status code
        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).include("application/json");

        // Check that the response is valid JSON
        const data = await res.json();

        // Verify it has a basic OpenAPI structure
        expect(data).toHaveProperty("openapi");
        expect(data).toHaveProperty("info");
        expect(data).toHaveProperty("servers");

        // Verify specific values from the OpenAPI spec
        expect(data.openapi).toBe("3.0.3");
        expect(data.info.title).toBe("Sample");
        expect(data.info.version).toBe("1.0");
    });

    it("should return openapi.html with successful response code", async () => {
        // Create a mock request to the OpenAPI HTML endpoint
        const res = await DocApp.request("/openapi.html");

        // Check status code
        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).include("text/html");
    });
});
