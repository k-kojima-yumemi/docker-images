import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { env } from "hono/adapter";

const app = new Hono();

app.get("*", (c) => {
  const { RESPONSE_CONTENT, RESPONSE_STATUS, RESPONSE_CONTENT_TYPE } = env(c);

  const content = RESPONSE_CONTENT ?? "Hello World";
  const statusCode = RESPONSE_STATUS ? Number(RESPONSE_STATUS) : 200;
  const contentType = RESPONSE_CONTENT_TYPE ?? "text/plain";

  c.header("Content-Type", contentType);

  return c.text(content, statusCode);
});

serve(
  {
    fetch: app.fetch,
    port: Number(process.env.PORT ?? 3000),
  },
  (info) => {
    console.log(`Server is running on ${info.port}`);
  },
);
