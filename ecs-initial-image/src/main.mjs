import { createServer as createHttpsServer } from "node:https";
import { serve } from "@hono/node-server";
import app from "./index.mjs";

const port = Number(process.env.PORT ?? 3000);

function isTlsEnabled() {
  return String(process.env.ENABLE_TLS ?? "").toLowerCase() === "true";
}

function createHttpServeOptions() {
  return {
    fetch: app.fetch,
    port,
  };
}

function createHttpsServeOptions() {
  const cert = process.env.TLS_CERT;
  const key = process.env.TLS_KEY;
  if (!cert || !key) {
    console.error(
      "ENABLE_TLS=true requires TLS_CERT and TLS_KEY environment variables.",
    );
    process.exit(1);
  }
  return {
    fetch: app.fetch,
    port,
    createServer: createHttpsServer,
    serverOptions: {
      cert,
      key,
    },
  };
}

function createServeOptions(tlsEnabled) {
  return tlsEnabled ? createHttpsServeOptions() : createHttpServeOptions();
}

const tlsEnabled = isTlsEnabled();

serve(createServeOptions(tlsEnabled), (info) => {
  if (tlsEnabled) {
    console.log(`HTTPS server is running on ${info.port}`);
  } else {
    console.log(`Server is running on ${info.port}`);
  }
});
