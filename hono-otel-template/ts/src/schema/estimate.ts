import * as v from "valibot";

const EstimateOptionsObject = v.pipe(
    v.object({
        includeShipping: v.optional(v.boolean(), false),
        includeTax: v.optional(v.boolean(), false),
        discountCode: v.optional(v.string()),
    }),
    v.metadata({ ref: "EstimateOptions" }),
);

export const EstimateOptionsSchema = v.optional(EstimateOptionsObject);

export const EstimateBodySchema = v.pipe(
    v.object({
        quantity: v.pipe(
            v.number(),
            v.integer(),
            v.minValue(1),
            v.maxValue(10000),
        ),
        currency: v.optional(v.picklist(["USD", "EUR", "JPY"] as const), "USD"),
        options: EstimateOptionsSchema,
    }),
    v.metadata({ ref: "EstimateBody" }),
);
export type EstimateBody = v.InferOutput<typeof EstimateBodySchema>;

export const BreakdownItemSchema = v.pipe(
    v.object({
        label: v.string(),
        amount: v.number(),
    }),
    v.metadata({ ref: "BreakdownItem" }),
);

export const EstimateResponseSchema = v.pipe(
    v.object({
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
    }),
    v.metadata({ ref: "EstimateResponse" }),
);
export type EstimateResponse = v.InferOutput<typeof EstimateResponseSchema>;
