import * as v from "valibot";

export const CategorySchema = v.picklist([
    "electronics",
    "clothing",
    "food",
] as const);
export type Category = v.InferOutput<typeof CategorySchema>;

export const CurrencySchema = v.picklist(["USD", "EUR", "JPY"] as const);
export type Currency = v.InferOutput<typeof CurrencySchema>;

export const ProductSchema = v.object({
    id: v.string(),
    name: v.string(),
    category: CategorySchema,
    basePrice: v.number(),
    description: v.string(),
    weightKg: v.number(),
});
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

export const ProductWithPriceSchema = v.object({
    id: v.string(),
    name: v.string(),
    category: CategorySchema,
    basePrice: v.number(),
    description: v.string(),
    weightKg: v.number(),
    price: v.number(),
    currency: v.string(),
});
export type ProductWithPrice = v.InferOutput<typeof ProductWithPriceSchema>;

export const ProductsResponseSchema = v.object({
    items: v.array(ProductWithPriceSchema),
    total: v.number(),
    limit: v.number(),
    offset: v.number(),
});
export type ProductsResponse = v.InferOutput<typeof ProductsResponseSchema>;
