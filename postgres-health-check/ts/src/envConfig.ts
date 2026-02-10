import { z } from "zod";

const DEFAULT_DB_PORT = 5432;

const DbConnectionUrlSchema = z.object({
    type: z.literal("url"),
    connectionString: z.string(),
});
const DbConnectionParamsSchema = z.object({
    type: z.literal("params"),
    host: z.string(),
    port: z.coerce.number().default(DEFAULT_DB_PORT),
    database: z.string(),
    user: z.string(),
    password: z.string().optional(),
});
const DbConnectionSchema = z.discriminatedUnion("type", [
    DbConnectionUrlSchema,
    DbConnectionParamsSchema,
]);
export type DbConnection = z.infer<typeof DbConnectionSchema>;

export const EnvConfigSchema = z.object({
    port: z.coerce.number().default(3000),
    dbConnection: DbConnectionSchema.optional(),
});

export type EnvConfig = z.infer<typeof EnvConfigSchema>;

function parseDbConnection(): DbConnection | undefined {
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl && databaseUrl.length > 0) {
        return { type: "url", connectionString: databaseUrl };
    }
    const host = process.env.DB_HOST;
    if (!host) return undefined;
    const user = process.env.DB_USER ?? "";
    const database = process.env.DB_NAME ?? process.env.DB_DATABASE ?? "";
    if (!database) return undefined;
    const portRaw = process.env.DB_PORT;
    const port = portRaw ? Number(portRaw) : DEFAULT_DB_PORT;
    return {
        type: "params",
        host,
        port: Number.isNaN(port) ? DEFAULT_DB_PORT : port,
        database,
        user,
        password: process.env.DB_PASSWORD,
    };
}

export function parseEnvConfig(): EnvConfig {
    return EnvConfigSchema.parse({
        port: process.env.PORT,
        dbConnection: parseDbConnection(),
    });
}
