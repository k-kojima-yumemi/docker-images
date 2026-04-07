import * as v from "valibot";

export const Environment = {
    development: "development",
    production: "production",
    test: "test",
} as const;

export type Environment = (typeof Environment)[keyof typeof Environment];

const portSchema = v.pipe(
    v.optional(v.string(), "3000"),
    v.transform(Number),
    v.number(),
);

export const EnvConfigSchema = v.object({
    port: portSchema,
    env: v.optional(
        v.picklist([
            Environment.development,
            Environment.production,
            Environment.test,
        ]),
        Environment.development,
    ),
    logLevel: v.optional(
        v.picklist(["debug", "info", "warn", "error"] as const),
        "info",
    ),
});

export type EnvConfig = v.InferOutput<typeof EnvConfigSchema>;

export function parseEnvConfig(): EnvConfig {
    return v.parse(EnvConfigSchema, {
        port: process.env.PORT,
        env: process.env.NODE_ENV,
        logLevel: process.env.LOG_LEVEL,
    });
}
