import { afterEach, beforeEach, describe, expect, it } from "vitest";
import app from "./index.mjs";

describe("Hono Application Tests", () => {
  let originalEnv;

  beforeEach(() => {
    // Save existing environment variables
    originalEnv = { ...process.env };
    // Clean up test-specific environment variables
    delete process.env.RESPONSE_CONTENT;
    delete process.env.RESPONSE_STATUS;
    delete process.env.RESPONSE_CONTENT_TYPE;
  });

  afterEach(() => {
    // Reset environment variables
    process.env = originalEnv;
  });

  it("should return default values when no environment variables are set", async () => {
    const res = await app.request("http://localhost/");

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/plain");
    expect(await res.text()).toBe("Hello World");
  });

  it("should use custom content when RESPONSE_CONTENT is set", async () => {
    process.env.RESPONSE_CONTENT = "Custom message";

    const res = await app.request("http://localhost/");

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/plain");
    expect(await res.text()).toBe("Custom message");
  });

  it("should use custom status code when RESPONSE_STATUS is set", async () => {
    process.env.RESPONSE_STATUS = "201";

    const res = await app.request("http://localhost/");

    expect(res.status).toBe(201);
    expect(res.headers.get("Content-Type")).toBe("text/plain");
    expect(await res.text()).toBe("Hello World");
  });

  it("should use custom content type when RESPONSE_CONTENT_TYPE is set", async () => {
    process.env.RESPONSE_CONTENT_TYPE = "application/json";

    const res = await app.request("http://localhost/");

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/json");
    expect(await res.text()).toBe("Hello World");
  });

  it("should use all custom values when all environment variables are set", async () => {
    process.env.RESPONSE_CONTENT = '{"message": "JSON response"}';
    process.env.RESPONSE_STATUS = "201";
    process.env.RESPONSE_CONTENT_TYPE = "application/json";

    const res = await app.request("http://localhost/");

    expect(res.status).toBe(201);
    expect(res.headers.get("Content-Type")).toBe("application/json");
    expect(await res.text()).toBe('{"message": "JSON response"}');
  });

  it("should handle different error status codes", async () => {
    process.env.RESPONSE_CONTENT = "Not Found";
    process.env.RESPONSE_STATUS = "404";

    const res = await app.request("http://localhost/");

    expect(res.status).toBe(404);
    expect(res.headers.get("Content-Type")).toBe("text/plain");
    expect(await res.text()).toBe("Not Found");
  });

  it("should handle HTML content type", async () => {
    process.env.RESPONSE_CONTENT = "<h1>Hello HTML</h1>";
    process.env.RESPONSE_CONTENT_TYPE = "text/html";

    const res = await app.request("http://localhost/");

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/html");
    expect(await res.text()).toBe("<h1>Hello HTML</h1>");
  });

  it.each([["/"], ["/test"], ["/api/v1"], ["/any/path"]])(
    "should return same response for path: %s",
    async (path) => {
      const res = await app.request(`http://localhost${path}`);
      expect(res.status).toBe(200);
      expect(await res.text()).toBe("Hello World");
    },
  );
});
