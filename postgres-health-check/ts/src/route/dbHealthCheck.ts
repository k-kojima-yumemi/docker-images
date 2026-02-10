import { Hono } from "hono";
import { Pool } from "pg";
import type { HonoContext } from "../app";

export const dbHealthCheckApp = new Hono<HonoContext>();
dbHealthCheckApp.get("/db-health-check", async (c) => {
    const config = c.var.config;
    if (!config.dbConnection) {
        console.error(
            "db-health-check: set DATABASE_URL or DB_HOST/DB_USER/DB_NAME",
        );
        return c.json({ status: "ng" } as const, 503);
    }
    const pool =
        config.dbConnection.type === "url"
            ? new Pool({
                  connectionString: config.dbConnection.connectionString,
              })
            : new Pool({
                  host: config.dbConnection.host,
                  port: config.dbConnection.port,
                  database: config.dbConnection.database,
                  user: config.dbConnection.user,
                  password: String(config.dbConnection.password ?? ""),
              });
    try {
        const result = await pool.query<{ now: Date }>("SELECT NOW() AS now");
        const row = result.rows[0];
        const currentTime =
            row?.now instanceof Date
                ? row.now.toISOString()
                : String(row?.now ?? "");
        return c.json({
            status: "ok",
            currentTime,
        } as const);
    } catch (err) {
        console.error("db-health-check error:", err);
        return c.json({ status: "ng" } as const, 503);
    } finally {
        await pool.end();
    }
});
