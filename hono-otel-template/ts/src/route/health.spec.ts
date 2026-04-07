import { describe, expect, it } from "vitest";
import { healthApp } from "./health";

describe("Health Route", () => {
    it("returns status ok", async () => {
        const res = await healthApp.request("/health");
        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).toContain("application/json");
        const data = await res.json();
        expect(data).toEqual({ status: "ok" });
    });
});
