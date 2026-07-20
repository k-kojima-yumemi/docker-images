import * as v from "valibot";

export const CategorySchema = v.pipe(
    v.picklist(["electronics", "clothing", "food"] as const),
    v.metadata({ ref: "Category" }),
);
export type Category = v.InferOutput<typeof CategorySchema>;

export const CurrencySchema = v.pipe(
    v.picklist(["USD", "EUR", "JPY"] as const),
    v.metadata({ ref: "Currency" }),
);
export type Currency = v.InferOutput<typeof CurrencySchema>;

export const ProductSchema = v.pipe(
    v.object({
        id: v.string(),
        name: v.string(),
        category: CategorySchema,
        basePrice: v.number(),
        description: v.string(),
        weightKg: v.number(),
    }),
    v.metadata({ ref: "Product" }),
);
export type Product = v.InferOutput<typeof ProductSchema>;

export const ProductsQuerySchema = v.object({
    category: v.optional(CategorySchema),
    minPrice: v.optional(v.pipe(v.string(), v.transform(Number), v.number())),
    maxPrice: v.optional(v.pipe(v.string(), v.transform(Number), v.number())),
    limit: v.optional(
        v.pipe(
            v.string(),
            v.transform(Number),
            v.integer(),
            v.minValue(1),
            v.maxValue(100),
        ),
    ),
    offset: v.optional(
        v.pipe(v.string(), v.transform(Number), v.integer(), v.minValue(0)),
    ),
    currency: v.optional(CurrencySchema),
});
export type ProductsQuery = v.InferOutput<typeof ProductsQuerySchema>;

export const ProductParamSchema = v.object({ id: v.string() });

export const ProductCurrencyQuerySchema = v.object({
    currency: v.optional(CurrencySchema),
});

export const ProductWithPriceSchema = v.pipe(
    v.object({
        id: v.string(),
        name: v.string(),
        category: CategorySchema,
        basePrice: v.number(),
        description: v.string(),
        weightKg: v.number(),
        price: v.number(),
        currency: v.string(),
    }),
    v.metadata({ ref: "ProductWithPrice" }),
);
export type ProductWithPrice = v.InferOutput<typeof ProductWithPriceSchema>;

export const ProductsResponseSchema = v.pipe(
    v.object({
        items: v.array(ProductWithPriceSchema),
        total: v.number(),
        limit: v.number(),
        offset: v.number(),
    }),
    v.metadata({ ref: "ProductsResponse" }),
);
export type ProductsResponse = v.InferOutput<typeof ProductsResponseSchema>;
