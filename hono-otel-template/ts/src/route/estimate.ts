import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import * as v from "valibot";
import type { HonoContext } from "../app";
import { EstimateBodySchema, EstimateResponseSchema } from "../schema/estimate";
import { ProductParamSchema } from "../schema/products";
import { calculateEstimate } from "../service/estimateService";

export const estimateApp = new Hono<HonoContext>();

estimateApp.post(
    "/products/:id/estimate",
    describeRoute({
        description:
            "Calculate a price estimate for a product. Supports optional shipping, tax, and discount code. Demonstrates a deep OpenTelemetry trace hierarchy.",
        tags: ["Estimate"],
        responses: {
            200: {
                description: "Detailed price breakdown",
                content: {
                    "application/json": {
                        schema: resolver(EstimateResponseSchema),
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
    validator("json", EstimateBodySchema),
    async (c) => {
        const { id } = c.req.valid("param");
        const body = c.req.valid("json");

        try {
            const result = await calculateEstimate(id, body);
            return c.json(result);
        } catch (err) {
            if (
                err instanceof Error &&
                err.message.startsWith("Product not found")
            ) {
                return c.json({ message: err.message }, 404);
            }
            throw err;
        }
    },
);
