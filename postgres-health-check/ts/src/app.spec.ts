import { describe, expect, it } from "vitest";
import { createApp } from "./app";
import type { EnvConfig } from "./envConfig";

const config: EnvConfig = { port: 3000, dbConnection: undefined };

describe("createApp", () => {
    it("GET unknown path returns 404", async () => {
        const app = createApp(config);
        const res = await app.request("/unknown");
        expect(res.status).toBe(404);
        expect(await res.json()).toEqual({ message: "not found" });
    });
});
