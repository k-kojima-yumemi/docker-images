import { describe, expect, it } from "vitest";
import { createApp } from "../app";
import type { EnvConfig } from "../envConfig";
import { parseEnvConfig } from "../envConfig";

const configWithoutDb: EnvConfig = { port: 3000, dbConnection: undefined };
const hasDbConnection = !!parseEnvConfig().dbConnection;

describe("db-health-check", () => {
    it("GET /db-health-check without dbConnection returns 503 and status ng", async () => {
        const app = createApp(configWithoutDb);
        const res = await app.request("/db-health-check");
        expect(res.status).toBe(503);
        expect(await res.json()).toEqual({ status: "ng" });
    });

    it.skipIf(!hasDbConnection)(
        "GET /db-health-check with real database returns 200 and currentTime",
        async () => {
            const config = parseEnvConfig();
            const app = createApp(config);
            const res = await app.request("/db-health-check");
            expect(res.status).toBe(200);
            const body = (await res.json()) as {
                status: string;
                currentTime: string;
            };
            expect(body.status).toBe("ok");
            expect(body.currentTime).toMatch(
                /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
            );
        },
    );

    it("GET /db-health-check when connection fails returns 503 and status ng", async () => {
        const configWithInvalidHost: EnvConfig = {
            port: 3000,
            dbConnection: {
                type: "params",
                host: "never-found-host.internal",
                port: 1,
                database: "postgres",
                user: "postgres",
                password: "ROOT_PASSWORD",
            },
        };
        const app = createApp(configWithInvalidHost);
        const res = await app.request("/db-health-check");
        expect(res.status).toBe(503);
        expect(await res.json()).toEqual({ status: "ng" });
    });
});
