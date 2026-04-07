import { describe, expect, it } from "vitest";
import { estimateApp } from "./estimate";

describe("Estimate Route", () => {
    it("calculates basic estimate", async () => {
        const res = await estimateApp.request("/products/p001/estimate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity: 1 }),
        });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toHaveProperty("productId", "p001");
        expect(data).toHaveProperty("quantity", 1);
        expect(data).toHaveProperty("total");
        expect(data).toHaveProperty("currency", "USD");
        expect(data).toHaveProperty("breakdown");
    });

    it("includes shipping and tax when requested", async () => {
        const res = await estimateApp.request("/products/p001/estimate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                quantity: 2,
                options: { includeShipping: true, includeTax: true },
            }),
        });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.shipping).toBeDefined();
        expect(data.tax).toBeDefined();
    });

    it("applies discount code", async () => {
        const res = await estimateApp.request("/products/p001/estimate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                quantity: 1,
                options: { discountCode: "SAVE10" },
            }),
        });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.discount).toBeDefined();
        expect(data.discount).toBeGreaterThan(0);
    });

    it("applies quantity discount for large orders", async () => {
        const res1 = await estimateApp.request("/products/p001/estimate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity: 1 }),
        });
        const res10 = await estimateApp.request("/products/p001/estimate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity: 10 }),
        });
        const d1 = await res1.json();
        const d10 = await res10.json();
        expect(d10.unitPrice).toBeLessThan(d1.unitPrice);
    });

    it("converts total to JPY", async () => {
        const res = await estimateApp.request("/products/p001/estimate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity: 1, currency: "JPY" }),
        });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.currency).toBe("JPY");
        expect(data.total).toBeGreaterThan(1000);
    });

    it("returns 404 for unknown product", async () => {
        const res = await estimateApp.request("/products/unknown-id/estimate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity: 1 }),
        });
        expect(res.status).toBe(404);
    });
});
