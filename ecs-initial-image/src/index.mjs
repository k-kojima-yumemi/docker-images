import { Hono } from "hono";
import { env } from "hono/adapter";

const app = new Hono();

app.get("*", (c) => {
  const { RESPONSE_CONTENT, RESPONSE_STATUS, RESPONSE_CONTENT_TYPE } = env(c);

  const content = RESPONSE_CONTENT ?? "Hello World";
  const statusCode = RESPONSE_STATUS ? Number(RESPONSE_STATUS) : 200;
  const contentType = RESPONSE_CONTENT_TYPE ?? "text/plain";
  console.log(
    JSON.stringify({
      path: c.req.path,
      method: c.req.method,
      status: statusCode,
      contentType,
      content,
    }),
  );

  return c.body(content, statusCode, {
    "Content-Type": contentType,
  });
});

export default app;
