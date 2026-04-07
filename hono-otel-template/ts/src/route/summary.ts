import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import type { HonoContext } from "../app";
import type { Category, Currency } from "../schema/products";
import { SummaryQuerySchema, SummaryResponseSchema } from "../schema/summary";
import { getProductSummary } from "../service/productService";

export const summaryApp = new Hono<HonoContext>();

summaryApp.get(
    "/products/summary",
    describeRoute({
        description:
            "Aggregate statistics for products. Optionally filter by category and convert prices to requested currency.",
        tags: ["Products"],
        responses: {
            200: {
                description: "Aggregated product statistics",
                content: {
                    "application/json": {
                        schema: resolver(SummaryResponseSchema),
                    },
                },
            },
        },
    }),
    validator("query", SummaryQuerySchema),
    async (c) => {
        const query = c.req.valid("query");
        const currency = (query.currency ?? "USD") as Currency;
        const category = query.category as Category | undefined;
        const result = await getProductSummary({ category, currency });
        return c.json(result);
    },
);
