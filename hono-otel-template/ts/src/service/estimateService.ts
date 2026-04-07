import { SpanStatusCode } from "@opentelemetry/api";
import type { EstimateBody, EstimateResponse } from "../schema/estimate";
import type { Currency } from "../schema/products";
import { tracer } from "../tracer";
import { convertPrice, getProductById } from "./productService";

const DISCOUNT_CODES = new Map<string, number>([
    ["SAVE10", 0.1],
    ["SAVE20", 0.2],
    ["WELCOME", 0.05],
]);

const SHIPPING_RATE_PER_KG = 4.5;
const BASE_SHIPPING = 5.99;
const TAX_RATE = 0.085;
const QUANTITY_DISCOUNT_THRESHOLD = 5;
const QUANTITY_DISCOUNT_RATE = 0.05;

export async function calculateEstimate(
    productId: string,
    body: EstimateBody,
): Promise<EstimateResponse> {
    return tracer.startActiveSpan(
        "estimateService.calculateEstimate",
        async (span) => {
            span.setAttributes({
                "estimate.productId": productId,
                "estimate.quantity": body.quantity,
                "estimate.currency": body.currency ?? "USD",
                "estimate.includeShipping":
                    body.options?.includeShipping ?? false,
                "estimate.includeTax": body.options?.includeTax ?? false,
                "estimate.hasDiscountCode":
                    body.options?.discountCode !== undefined,
            });
            try {
                const product = await validateProduct(productId);
                const currency = (body.currency ?? "USD") as Currency;

                const { unitPrice, subtotal } = await calculateBasePrice(
                    product.basePrice,
                    body.quantity,
                );

                const breakdown: Array<{ label: string; amount: number }> = [
                    { label: "Unit price", amount: unitPrice },
                    { label: "Subtotal", amount: subtotal },
                ];

                let running = subtotal;
                let shipping: number | undefined;
                let tax: number | undefined;
                let discount: number | undefined;

                if (body.options?.includeShipping === true) {
                    shipping = await calculateShipping(
                        product.weightKg,
                        body.quantity,
                    );
                    breakdown.push({ label: "Shipping", amount: shipping });
                    running += shipping;
                }

                if (body.options?.includeTax === true) {
                    tax = await calculateTax(running);
                    breakdown.push({ label: "Tax (8.5%)", amount: tax });
                    running += tax;
                }

                if (body.options?.discountCode !== undefined) {
                    discount = await applyDiscount(
                        running,
                        body.options.discountCode,
                    );
                    if (discount > 0) {
                        breakdown.push({
                            label: `Discount (${body.options.discountCode})`,
                            amount: -discount,
                        });
                        running -= discount;
                    }
                }

                const totalInCurrency =
                    currency === "USD"
                        ? round(running)
                        : await convertPrice(running, currency);

                const unitPriceInCurrency =
                    currency === "USD"
                        ? unitPrice
                        : await convertPrice(unitPrice, currency);

                const subtotalInCurrency =
                    currency === "USD"
                        ? subtotal
                        : await convertPrice(subtotal, currency);

                span.setAttribute("estimate.total.usd", running);
                span.setStatus({ code: SpanStatusCode.OK });

                return {
                    productId,
                    quantity: body.quantity,
                    unitPrice: unitPriceInCurrency,
                    subtotal: subtotalInCurrency,
                    shipping:
                        shipping !== undefined
                            ? await convertIfNeeded(shipping, currency)
                            : undefined,
                    tax:
                        tax !== undefined
                            ? await convertIfNeeded(tax, currency)
                            : undefined,
                    discount:
                        discount !== undefined && discount > 0
                            ? await convertIfNeeded(discount, currency)
                            : undefined,
                    total: totalInCurrency,
                    currency,
                    breakdown,
                };
            } catch (err) {
                span.recordException(err as Error);
                span.setStatus({ code: SpanStatusCode.ERROR });
                throw err;
            } finally {
                span.end();
            }
        },
    );
}

async function validateProduct(productId: string) {
    return tracer.startActiveSpan(
        "estimateService.validateProduct",
        async (span) => {
            try {
                span.setAttribute("product.id", productId);
                const product = await getProductById(productId);
                if (product === undefined) {
                    throw new Error(`Product not found: ${productId}`);
                }
                span.setAttribute("product.name", product.name);
                span.setStatus({ code: SpanStatusCode.OK });
                return product;
            } catch (err) {
                span.recordException(err as Error);
                span.setStatus({ code: SpanStatusCode.ERROR });
                throw err;
            } finally {
                span.end();
            }
        },
    );
}

async function calculateBasePrice(
    basePrice: number,
    quantity: number,
): Promise<{ unitPrice: number; subtotal: number }> {
    return tracer.startActiveSpan(
        "estimateService.calculateBasePrice",
        async (span) => {
            span.setAttributes({
                "price.base": basePrice,
                "price.quantity": quantity,
            });
            try {
                const priceList = await lookupPriceList(basePrice);
                let unitPrice = priceList;

                if (quantity > QUANTITY_DISCOUNT_THRESHOLD) {
                    unitPrice = await applyQuantityDiscount(
                        priceList,
                        quantity,
                    );
                }

                const subtotal = round(unitPrice * quantity);
                span.setAttributes({
                    "price.unitPrice": unitPrice,
                    "price.subtotal": subtotal,
                });
                span.setStatus({ code: SpanStatusCode.OK });
                return { unitPrice, subtotal };
            } finally {
                span.end();
            }
        },
    );
}

async function lookupPriceList(basePrice: number): Promise<number> {
    return tracer.startActiveSpan(
        "estimateService.lookupPriceList",
        async (span) => {
            try {
                span.setAttribute("price.base", basePrice);
                span.setStatus({ code: SpanStatusCode.OK });
                return basePrice;
            } finally {
                span.end();
            }
        },
    );
}

async function applyQuantityDiscount(
    unitPrice: number,
    quantity: number,
): Promise<number> {
    return tracer.startActiveSpan(
        "estimateService.applyQuantityDiscount",
        async (span) => {
            try {
                span.setAttributes({
                    "discount.quantity": quantity,
                    "discount.rate": QUANTITY_DISCOUNT_RATE,
                });
                const discounted = round(
                    unitPrice * (1 - QUANTITY_DISCOUNT_RATE),
                );
                span.setAttribute("price.discounted", discounted);
                span.setStatus({ code: SpanStatusCode.OK });
                return discounted;
            } finally {
                span.end();
            }
        },
    );
}

async function calculateShipping(
    weightKg: number,
    quantity: number,
): Promise<number> {
    return tracer.startActiveSpan(
        "estimateService.calculateShipping",
        async (span) => {
            span.setAttributes({
                "shipping.weightKg": weightKg,
                "shipping.quantity": quantity,
            });
            try {
                const totalWeight = await estimateWeight(weightKg, quantity);
                const shippingCost = await lookupShippingRates(totalWeight);
                span.setAttribute("shipping.cost", shippingCost);
                span.setStatus({ code: SpanStatusCode.OK });
                return shippingCost;
            } finally {
                span.end();
            }
        },
    );
}

async function estimateWeight(
    unitWeightKg: number,
    quantity: number,
): Promise<number> {
    return tracer.startActiveSpan(
        "estimateService.estimateWeight",
        async (span) => {
            try {
                const totalWeight = round(unitWeightKg * quantity);
                span.setAttribute("weight.total", totalWeight);
                span.setStatus({ code: SpanStatusCode.OK });
                return totalWeight;
            } finally {
                span.end();
            }
        },
    );
}

async function lookupShippingRates(totalWeightKg: number): Promise<number> {
    return tracer.startActiveSpan(
        "estimateService.lookupShippingRates",
        async (span) => {
            try {
                span.setAttribute("shipping.totalWeightKg", totalWeightKg);
                const cost = round(
                    BASE_SHIPPING + totalWeightKg * SHIPPING_RATE_PER_KG,
                );
                span.setAttribute("shipping.cost", cost);
                span.setStatus({ code: SpanStatusCode.OK });
                return cost;
            } finally {
                span.end();
            }
        },
    );
}

async function calculateTax(amount: number): Promise<number> {
    return tracer.startActiveSpan(
        "estimateService.calculateTax",
        async (span) => {
            span.setAttribute("tax.base", amount);
            try {
                const taxAmount = await lookupTaxRate(amount);
                span.setAttribute("tax.amount", taxAmount);
                span.setStatus({ code: SpanStatusCode.OK });
                return taxAmount;
            } finally {
                span.end();
            }
        },
    );
}

async function lookupTaxRate(amount: number): Promise<number> {
    return tracer.startActiveSpan(
        "estimateService.lookupTaxRate",
        async (span) => {
            try {
                span.setAttribute("tax.rate", TAX_RATE);
                const tax = round(amount * TAX_RATE);
                span.setStatus({ code: SpanStatusCode.OK });
                return tax;
            } finally {
                span.end();
            }
        },
    );
}

async function applyDiscount(amount: number, code: string): Promise<number> {
    return tracer.startActiveSpan(
        "estimateService.applyDiscount",
        async (span) => {
            try {
                span.setAttributes({
                    "discount.code": code,
                    "discount.base": amount,
                });
                const rate = DISCOUNT_CODES.get(code.toUpperCase());
                if (rate === undefined) {
                    span.setAttribute("discount.valid", false);
                    span.setStatus({ code: SpanStatusCode.OK });
                    return 0;
                }
                const discount = round(amount * rate);
                span.setAttributes({
                    "discount.rate": rate,
                    "discount.amount": discount,
                    "discount.valid": true,
                });
                span.setStatus({ code: SpanStatusCode.OK });
                return discount;
            } finally {
                span.end();
            }
        },
    );
}

async function convertIfNeeded(
    amount: number,
    currency: Currency,
): Promise<number> {
    if (currency === "USD") {
        return amount;
    }
    return convertPrice(amount, currency);
}

function round(n: number): number {
    return Math.round(n * 100) / 100;
}
