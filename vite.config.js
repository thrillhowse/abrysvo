import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ command, isPreview }) => ({
  plugins: [
    react(),
    {
      name: "privacy-policy",
      transformIndexHtml() {
        const isDevServer = command === "serve" && !isPreview;
        // React Fast Refresh injects an inline preamble during development.
        // Built pages must not inherit this development-only exception.
        const scripts = isDevServer ? "'self' 'unsafe-inline'" : "'self'";
        const connections =
          isDevServer
            ? "'self' ws://localhost:* ws://127.0.0.1:*"
            : "'none'";
        return [
          {
            tag: "meta",
            attrs: {
              "http-equiv": "Content-Security-Policy",
              content: `default-src 'self'; script-src ${scripts}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src ${connections}; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'`,
            },
            injectTo: "head-prepend",
          },
        ];
      },
    },
  ],
}));
