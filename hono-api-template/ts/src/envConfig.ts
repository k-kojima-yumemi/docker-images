import { z } from "zod";

export const Environment = {
    development: "development",
    production: "production",
    test: "test",
} as const;

export type Environment = (typeof Environment)[keyof typeof Environment];

export const EnvConfigSchema = z.object({
    port: z.coerce.number().default(3000),
    env: z
        .enum([
            Environment.development,
            Environment.production,
            Environment.test,
        ])
        .default(Environment.development),
    logLevel: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type EnvConfig = z.infer<typeof EnvConfigSchema>;

export function parseEnvConfig(): EnvConfig {
    return EnvConfigSchema.parse({
        port: process.env.PORT,
        env: process.env.NODE_ENV,
        logLevel: process.env.LOG_LEVEL,
    });
}
