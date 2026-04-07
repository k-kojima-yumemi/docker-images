import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import type { HonoContext } from "../app";
import {
    type CurrencySchema,
    ProductCurrencyQuerySchema,
    ProductParamSchema,
    ProductsQuerySchema,
    ProductsResponseSchema,
    ProductWithPriceSchema,
} from "../schema/products";
import {
    convertPrice,
    getProductById,
    listProducts,
} from "../service/productService";

export const productsApp = new Hono<HonoContext>();

productsApp.get(
    "/products",
    describeRoute({
        description:
            "List products with optional filters. Supports pagination via limit and offset.",
        tags: ["Products"],
        responses: {
            200: {
                description: "Paginated list of products",
                content: {
                    "application/json": {
                        schema: resolver(ProductsResponseSchema),
                    },
                },
            },
        },
    }),
    validator("query", ProductsQuerySchema),
    async (c) => {
        const query = c.req.valid("query");
        const currency = (query.currency ?? "USD") as v.InferOutput<
            typeof CurrencySchema
        >;
        const { items, total } = await listProducts({
            category: query.category,
            minPrice: query.minPrice,
            maxPrice: query.maxPrice,
            limit: query.limit ?? 10,
            offset: query.offset ?? 0,
            currency,
        });
        return c.json({
            items,
            total,
            limit: query.limit ?? 10,
            offset: query.offset ?? 0,
        });
    },
);

productsApp.get(
    "/products/:id",
    describeRoute({
        description:
            "Get a single product by ID. Optionally convert price to requested currency.",
        tags: ["Products"],
        responses: {
            200: {
                description: "Product details with converted price",
                content: {
                    "application/json": {
                        schema: resolver(ProductWithPriceSchema),
                    },
                },
            },
            404: {
                description: "Product not found",
                content: {
                    "application/json": {
                        schema: resolver(v.object({ message: v.string() })),
                    },
                },
            },
        },
    }),
    validator("param", ProductParamSchema),
    validator("query", ProductCurrencyQuerySchema),
    async (c) => {
        const { id } = c.req.valid("param");
        const { currency: rawCurrency } = c.req.valid("query");
        const currency = (rawCurrency ?? "USD") as v.InferOutput<
            typeof CurrencySchema
        >;

        const product = await getProductById(id);
        if (product === undefined) {
            return c.json({ message: `Product not found: ${id}` }, 404);
        }

        const price = await convertPrice(product.basePrice, currency);
        return c.json({ ...product, price, currency });
    },
);
