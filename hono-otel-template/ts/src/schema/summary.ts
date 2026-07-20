import * as v from "valibot";

export const SummaryQuerySchema = v.object({
    category: v.optional(
        v.picklist(["electronics", "clothing", "food"] as const),
    ),
    currency: v.optional(v.picklist(["USD", "EUR", "JPY"] as const)),
});

const CategoryStatsSchema = v.pipe(
    v.object({
        count: v.number(),
        avgPrice: v.number(),
        minPrice: v.number(),
        maxPrice: v.number(),
    }),
    v.metadata({ ref: "CategoryStats" }),
);

export const SummaryResponseSchema = v.pipe(
    v.object({
        totalProducts: v.number(),
        avgPrice: v.number(),
        minPrice: v.number(),
        maxPrice: v.number(),
        currency: v.string(),
        byCategory: v.record(v.string(), CategoryStatsSchema),
    }),
    v.metadata({ ref: "SummaryResponse" }),
);
export type SummaryResponse = v.InferOutput<typeof SummaryResponseSchema>;
