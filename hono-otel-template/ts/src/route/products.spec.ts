import { describe, expect, it } from "vitest";
import { productsApp } from "./products";

describe("Products Route", () => {
    it("lists all products", async () => {
        const res = await productsApp.request("/products");
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toHaveProperty("items");
        expect(data).toHaveProperty("total");
        expect(data.items.length).toBeGreaterThan(0);
        expect(data.items[0]).toHaveProperty("price");
        expect(data.items[0]).toHaveProperty("currency", "USD");
    });

    it("filters by category", async () => {
        const res = await productsApp.request("/products?category=electronics");
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(
            data.items.every(
                (item: { category: string }) => item.category === "electronics",
            ),
        ).toBe(true);
    });

    it("supports pagination", async () => {
        const res = await productsApp.request("/products?limit=2&offset=0");
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.items.length).toBe(2);
        expect(data.limit).toBe(2);
        expect(data.offset).toBe(0);
    });

    it("converts price to JPY", async () => {
        const res = await productsApp.request("/products/p001?currency=JPY");
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.currency).toBe("JPY");
        expect(data.price).toBeGreaterThan(data.basePrice);
    });

    it("returns 404 for unknown product", async () => {
        const res = await productsApp.request("/products/unknown-id");
        expect(res.status).toBe(404);
    });
});
