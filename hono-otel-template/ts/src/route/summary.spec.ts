import { describe, expect, it } from "vitest";
import { summaryApp } from "./summary";

describe("Summary Route", () => {
    it("returns overall summary", async () => {
        const res = await summaryApp.request("/products/summary");
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toHaveProperty("totalProducts");
        expect(data.totalProducts).toBeGreaterThan(0);
        expect(data).toHaveProperty("avgPrice");
        expect(data).toHaveProperty("minPrice");
        expect(data).toHaveProperty("maxPrice");
        expect(data).toHaveProperty("byCategory");
        expect(data).toHaveProperty("currency", "USD");
    });

    it("filters by category", async () => {
        const res = await summaryApp.request(
            "/products/summary?category=electronics",
        );
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.byCategory).toHaveProperty("electronics");
        expect(Object.keys(data.byCategory)).toHaveLength(1);
    });

    it("converts to JPY", async () => {
        const resUsd = await summaryApp.request("/products/summary");
        const resJpy = await summaryApp.request(
            "/products/summary?currency=JPY",
        );
        const usd = await resUsd.json();
        const jpy = await resJpy.json();
        expect(jpy.currency).toBe("JPY");
        expect(jpy.avgPrice).toBeGreaterThan(usd.avgPrice);
    });
});
