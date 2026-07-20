import * as v from "valibot";

export const HealthResponseSchema = v.pipe(
    v.object({
        status: v.literal("ok"),
    }),
    v.metadata({ ref: "HealthResponse" }),
);

export type HealthResponse = v.InferOutput<typeof HealthResponseSchema>;
