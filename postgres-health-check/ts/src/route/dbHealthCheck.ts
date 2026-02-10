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
    const connectionConfig =
        config.dbConnection.type === "url"
            ? { connectionString: config.dbConnection.connectionString }
            : {
                  host: config.dbConnection.host,
                  port: config.dbConnection.port,
                  database: config.dbConnection.database,
                  user: config.dbConnection.user,
                  password: config.dbConnection.password,
              };
    console.log("connectionConfig:", connectionConfig);
    const pool = new Pool(connectionConfig);
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
