import { describe, expect, it } from "vitest";
import { HealthCheckApp } from "./healthCheck";

describe("HealthCheck Route", () => {
    it("should return status ok", async () => {
        // Create a mock request to the health-check endpoint
        const res = await HealthCheckApp.request("/health-check");

        // Check status code
        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).include("application/json");

        // Check response body
        const data = await res.json();
        expect(data).toEqual({ status: "ok" });
    });
});
