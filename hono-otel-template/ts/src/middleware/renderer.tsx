import { jsxRenderer } from "hono/jsx-renderer";

export const renderer = jsxRenderer(({ children }) => {
    return (
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
            </head>
            <body>{children}</body>
        </html>
    );
});
