import * as v from "valibot";

export const EstimateOptionsSchema = v.optional(
    v.object({
        includeShipping: v.optional(v.boolean(), false),
        includeTax: v.optional(v.boolean(), false),
        discountCode: v.optional(v.string()),
    }),
);

export const EstimateBodySchema = v.object({
    quantity: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(10000)),
    currency: v.optional(v.picklist(["USD", "EUR", "JPY"] as const), "USD"),
    options: EstimateOptionsSchema,
});
export type EstimateBody = v.InferOutput<typeof EstimateBodySchema>;

export const BreakdownItemSchema = v.object({
    label: v.string(),
    amount: v.number(),
});

export const EstimateResponseSchema = v.object({
    productId: v.string(),
    quantity: v.number(),
    unitPrice: v.number(),
    subtotal: v.number(),
    shipping: v.optional(v.number()),
    tax: v.optional(v.number()),
    discount: v.optional(v.number()),
    total: v.number(),
    currency: v.string(),
    breakdown: v.array(BreakdownItemSchema),
});
export type EstimateResponse = v.InferOutput<typeof EstimateResponseSchema>;
