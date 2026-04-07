import { SpanStatusCode } from "@opentelemetry/api";
import type {
    Category,
    Currency,
    Product,
    ProductWithPrice,
} from "../schema/products";
import { tracer } from "../tracer";

const EXCHANGE_RATES = new Map<Currency, number>([
    ["USD", 1.0],
    ["EUR", 0.92],
    ["JPY", 149.5],
]);

const PRODUCTS: Product[] = [
    {
        id: "p001",
        name: 'Laptop Pro 16"',
        category: "electronics",
        basePrice: 1299.99,
        description: "High-performance laptop with M-series chip",
        weightKg: 2.1,
    },
    {
        id: "p002",
        name: "Wireless Headphones",
        category: "electronics",
        basePrice: 249.99,
        description: "Noise-cancelling over-ear headphones",
        weightKg: 0.35,
    },
    {
        id: "p003",
        name: "USB-C Hub",
        category: "electronics",
        basePrice: 59.99,
        description: "7-in-1 USB-C multiport hub",
        weightKg: 0.15,
    },
    {
        id: "p004",
        name: "Mechanical Keyboard",
        category: "electronics",
        basePrice: 179.99,
        description: "Tenkeyless mechanical keyboard with brown switches",
        weightKg: 1.2,
    },
    {
        id: "p005",
        name: "Cotton T-Shirt",
        category: "clothing",
        basePrice: 29.99,
        description: "100% organic cotton crew-neck tee",
        weightKg: 0.25,
    },
    {
        id: "p006",
        name: "Running Shoes",
        category: "clothing",
        basePrice: 119.99,
        description: "Lightweight road running shoes",
        weightKg: 0.8,
    },
    {
        id: "p007",
        name: "Denim Jacket",
        category: "clothing",
        basePrice: 89.99,
        description: "Classic indigo denim jacket",
        weightKg: 0.95,
    },
    {
        id: "p008",
        name: "Merino Wool Socks",
        category: "clothing",
        basePrice: 19.99,
        description: "Fine-knit merino wool ankle socks",
        weightKg: 0.1,
    },
    {
        id: "p009",
        name: "Organic Coffee Beans 1kg",
        category: "food",
        basePrice: 24.99,
        description: "Single-origin Ethiopian Yirgacheffe, medium roast",
        weightKg: 1.05,
    },
    {
        id: "p010",
        name: "Dark Chocolate Bar",
        category: "food",
        basePrice: 8.99,
        description: "72% cacao dark chocolate, single-origin",
        weightKg: 0.1,
    },
    {
        id: "p011",
        name: "Olive Oil 750ml",
        category: "food",
        basePrice: 18.99,
        description: "Extra-virgin cold-pressed olive oil",
        weightKg: 0.95,
    },
    {
        id: "p012",
        name: "Spice Collection Set",
        category: "food",
        basePrice: 39.99,
        description: "Curated set of 12 premium spices",
        weightKg: 0.6,
    },
];

export async function listProducts(filters: {
    category?: Category;
    minPrice?: number;
    maxPrice?: number;
    limit: number;
    offset: number;
    currency: Currency;
}): Promise<{ items: ProductWithPrice[]; total: number }> {
    return tracer.startActiveSpan(
        "productService.listProducts",
        async (span) => {
            span.setAttributes({
                "products.filter.category": filters.category ?? "all",
                "products.filter.limit": filters.limit,
                "products.filter.offset": filters.offset,
                "products.filter.currency": filters.currency,
            });
            try {
                const filtered = await filterProducts({
                    category: filters.category,
                    minPrice: filters.minPrice,
                    maxPrice: filters.maxPrice,
                });
                const total = filtered.length;
                const page = filtered.slice(
                    filters.offset,
                    filters.offset + filters.limit,
                );
                const items = await convertProductPrices(
                    page,
                    filters.currency,
                );
                span.setAttribute("products.result.count", items.length);
                span.setStatus({ code: SpanStatusCode.OK });
                return { items, total };
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

async function filterProducts(filters: {
    category?: Category;
    minPrice?: number;
    maxPrice?: number;
}): Promise<Product[]> {
    return tracer.startActiveSpan(
        "productService.filterProducts",
        async (span) => {
            try {
                let results = [...PRODUCTS];
                if (filters.category !== undefined) {
                    results = results.filter(
                        (p) => p.category === filters.category,
                    );
                }
                if (filters.minPrice !== undefined) {
                    results = results.filter(
                        (p) => p.basePrice >= (filters.minPrice ?? 0),
                    );
                }
                if (filters.maxPrice !== undefined) {
                    results = results.filter(
                        (p) =>
                            p.basePrice <=
                            (filters.maxPrice ?? Number.POSITIVE_INFINITY),
                    );
                }
                span.setAttribute("products.filtered.count", results.length);
                span.setStatus({ code: SpanStatusCode.OK });
                return results;
            } finally {
                span.end();
            }
        },
    );
}

async function convertProductPrices(
    products: Product[],
    currency: Currency,
): Promise<ProductWithPrice[]> {
    return tracer.startActiveSpan(
        "productService.convertProductPrices",
        async (span) => {
            try {
                span.setAttributes({
                    "currency.to": currency,
                    "products.count": products.length,
                });
                const rate = EXCHANGE_RATES.get(currency) ?? 1.0;
                const items = products.map((p) => ({
                    ...p,
                    price: round(p.basePrice * rate),
                    currency,
                }));
                span.setStatus({ code: SpanStatusCode.OK });
                return items;
            } finally {
                span.end();
            }
        },
    );
}

export async function getProductById(id: string): Promise<Product | undefined> {
    return tracer.startActiveSpan(
        "productService.getProductById",
        async (span) => {
            try {
                span.setAttribute("product.id", id);
                const product = PRODUCTS.find((p) => p.id === id);
                span.setAttribute("product.found", product !== undefined);
                span.setStatus({ code: SpanStatusCode.OK });
                return product;
            } finally {
                span.end();
            }
        },
    );
}

export async function convertPrice(
    priceUsd: number,
    currency: Currency,
): Promise<number> {
    return tracer.startActiveSpan(
        "productService.convertPrice",
        async (span) => {
            try {
                span.setAttributes({
                    "currency.from": "USD",
                    "currency.to": currency,
                });
                const rate = EXCHANGE_RATES.get(currency) ?? 1.0;
                const converted = round(priceUsd * rate);
                span.setStatus({ code: SpanStatusCode.OK });
                return converted;
            } finally {
                span.end();
            }
        },
    );
}

export async function getProductSummary(filters: {
    category?: Category;
    currency: Currency;
}) {
    return tracer.startActiveSpan(
        "productService.getProductSummary",
        async (span) => {
            span.setAttributes({
                "summary.filter.category": filters.category ?? "all",
                "summary.filter.currency": filters.currency,
            });
            try {
                const rawProducts = await filterProducts({
                    category: filters.category,
                });
                const aggregated = await aggregateProducts(
                    rawProducts,
                    filters.currency,
                );
                const formatted = await formatSummary(
                    aggregated,
                    filters.currency,
                );
                span.setStatus({ code: SpanStatusCode.OK });
                return formatted;
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

async function aggregateProducts(products: Product[], currency: Currency) {
    return tracer.startActiveSpan(
        "productService.aggregateProducts",
        async (span) => {
            try {
                span.setAttribute("products.count", products.length);
                const rate = EXCHANGE_RATES.get(currency) ?? 1.0;
                const byCategory: Record<
                    string,
                    { count: number; prices: number[] }
                > = {};
                const allPrices: number[] = [];

                for (const p of products) {
                    const convertedPrice = round(p.basePrice * rate);
                    allPrices.push(convertedPrice);
                    if (byCategory[p.category] === undefined) {
                        byCategory[p.category] = { count: 0, prices: [] };
                    }
                    byCategory[p.category].count++;
                    byCategory[p.category].prices.push(convertedPrice);
                }
                span.setStatus({ code: SpanStatusCode.OK });
                return { byCategory, allPrices };
            } finally {
                span.end();
            }
        },
    );
}

async function formatSummary(
    aggregated: {
        byCategory: Record<string, { count: number; prices: number[] }>;
        allPrices: number[];
    },
    currency: Currency,
) {
    return tracer.startActiveSpan(
        "productService.formatSummary",
        async (span) => {
            try {
                const { allPrices, byCategory } = aggregated;
                const totalProducts = allPrices.length;
                const avgPrice =
                    totalProducts === 0
                        ? 0
                        : round(
                              allPrices.reduce((a, b) => a + b, 0) /
                                  totalProducts,
                          );
                const minPrice =
                    totalProducts === 0 ? 0 : Math.min(...allPrices);
                const maxPrice =
                    totalProducts === 0 ? 0 : Math.max(...allPrices);

                const formattedByCategory: Record<
                    string,
                    {
                        count: number;
                        avgPrice: number;
                        minPrice: number;
                        maxPrice: number;
                    }
                > = {};
                for (const [cat, { count, prices }] of Object.entries(
                    byCategory,
                )) {
                    formattedByCategory[cat] = {
                        count,
                        avgPrice: round(
                            prices.reduce((a, b) => a + b, 0) / count,
                        ),
                        minPrice: Math.min(...prices),
                        maxPrice: Math.max(...prices),
                    };
                }

                span.setStatus({ code: SpanStatusCode.OK });
                return {
                    totalProducts,
                    avgPrice,
                    minPrice,
                    maxPrice,
                    currency,
                    byCategory: formattedByCategory,
                };
            } finally {
                span.end();
            }
        },
    );
}

function round(n: number): number {
    return Math.round(n * 100) / 100;
}
