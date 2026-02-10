import { describe, expect, it } from "vitest";
import { createApp } from "../app";
import type { EnvConfig } from "../envConfig";

const config: EnvConfig = { port: 3000, dbConnection: undefined };

describe("health-check", () => {
    it("GET /health-check returns 200 and status ok", async () => {
        const app = createApp(config);
        const res = await app.request("/health-check");
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ status: "ok" });
    });
});
