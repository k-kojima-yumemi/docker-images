import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { parseEnvConfig } from "./envConfig";

const envConfig = parseEnvConfig();
const app = createApp(envConfig);

serve(
    {
        fetch: app.fetch,
        port: envConfig.port,
    },
    (info) => {
        console.log(
            `Server is running on http://localhost:${info.port} in ${envConfig.env} mode`,
        );
    },
);
