import { Hono } from "hono";
import { env } from "hono/adapter";

const app = new Hono();

const REQUEST_INSPECTOR_PATH = "/__debug/request";

const isEnabled = (value) => String(value ?? "").toLowerCase() === "true";

const isLoggingSuppressed = () =>
  globalThis.process?.env?.NODE_ENV === "test" ||
  Boolean(globalThis.process?.env?.VITEST);

const defaultResponse = (c) => {
  const { RESPONSE_CONTENT, RESPONSE_STATUS, RESPONSE_CONTENT_TYPE } = env(c);

  const content = RESPONSE_CONTENT ?? "Hello World";
  const statusCode = RESPONSE_STATUS ? Number(RESPONSE_STATUS) : 200;
  const contentType = RESPONSE_CONTENT_TYPE ?? "text/plain";
  if (!isLoggingSuppressed()) {
    console.log(
      JSON.stringify({
        level: "info",
        message: `${c.req.method} ${c.req.url} - ${statusCode} ${contentType}`,
        path: c.req.path,
        method: c.req.method,
        status: statusCode,
        contentType,
        content,
        requestHeader: c.req.header(),
      }),
    );
  }

  return c.body(content, statusCode, {
    "Content-Type": contentType,
  });
};

const readBody = async (c) => {
  try {
    const text = await c.req.text();
    return text.length > 0 ? text : null;
  } catch {
    return null;
  }
};

const requestInspectorResponse = async (c) => {
  const requestInfo = {
    method: c.req.method,
    path: c.req.path,
    url: c.req.url,
    query: c.req.query(),
    headers: c.req.header(),
    body: await readBody(c),
  };

  if (!isLoggingSuppressed()) {
    console.log(
      JSON.stringify({
        level: "info",
        message: `[request-inspector] ${requestInfo.method} ${requestInfo.url}`,
        ...requestInfo,
      }),
    );
  }

  return c.json(requestInfo);
};

app.all(REQUEST_INSPECTOR_PATH, (c) => {
  const { ENABLE_REQUEST_INSPECTOR } = env(c);
  return isEnabled(ENABLE_REQUEST_INSPECTOR)
    ? requestInspectorResponse(c)
    : defaultResponse(c);
});

app.get("*", defaultResponse);

export default app;
