import { describe, expect, it } from "vitest";
import { createApp } from "./app";
import type { EnvConfig, Environment } from "./envConfig";

function create() {
    const environment: Environment = "test";
    const config: EnvConfig = {
        env: environment,
        port: 8000,
        logLevel: "debug",
    };
    return createApp(config);
}

describe("App", () => {
    it("creates app", () => {
        const app = create();
        expect(app).toBeTruthy();
    });

    it("registers expected routes", () => {
        const app = create();
        const paths = app.routes.map((route) => route.path);
        expect(paths).toContain("/health");
        expect(paths).toContain("/products");
        expect(paths).toContain("/products/:id");
        expect(paths).toContain("/products/:id/estimate");
        expect(paths).toContain("/products/summary");
    });

    it("openapi.json returns valid spec", async () => {
        const app = create();
        const response = await app.request("/openapi.json");
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toHaveProperty("openapi", "3.0.3");
        expect(data).toHaveProperty("paths");
        expect(data.paths).toHaveProperty("/health");
        expect(data.paths).toHaveProperty("/products");
        expect(data.paths).toHaveProperty("/products/{id}");
        expect(data.paths).toHaveProperty("/products/{id}/estimate");
        expect(data.paths).toHaveProperty("/products/summary");
    });
});
