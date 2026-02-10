import { Hono } from "hono";

export const healthCheckApp = new Hono();
healthCheckApp.get("/health-check", (c) => c.json({ status: "ok" } as const));
