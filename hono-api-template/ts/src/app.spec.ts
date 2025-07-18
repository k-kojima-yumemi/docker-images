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
    it("create app", async () => {
        const app = create();
        expect(app).toBeTruthy();
    });
    it("health check route", async () => {
        const app = create();
        const paths = app.routes.map((route) => route.path);
        expect(paths).toContain("/health-check");
        expect(paths).toContain("/health");
    });
    it("open api contains routes", async () => {
        const app = create();
        const response = await app.request("/openapi.json");
        expect(response.status).toBe(200);
        const data = await response.json();
        const paths = data.paths;
        expect(paths).toHaveProperty("/health-check");
        expect(paths).toHaveProperty("/health");
    });
});
