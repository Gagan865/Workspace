import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

// Plain TanStack Start config (previously wrapped by @lovable.dev/vite-tanstack-config).
// Plugin order matters: tailwind → tsconfig paths → tanstackStart → nitro (build) → react.
export default defineConfig(async ({ command }) => {
  const plugins = [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      // Block importing server-only modules from client code.
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
      // Use src/server.ts as the SSR entry (our error-wrapping fetch handler).
      server: { entry: "server" },
    }),
  ];

  // nitro packages the SSR build for the deploy target. It auto-detects the
  // host from the environment: on Vercel it emits .vercel/output (Build Output
  // API v3); locally it builds a Node server so `npm run preview` works.
  // Override with NITRO_PRESET=vercel if auto-detection ever misses.
  if (command === "build") {
    const { nitro } = await import("nitro/vite");
    plugins.push(nitro());
  }

  plugins.push(viteReact());

  return {
    plugins,
    server: {
      host: "::",
      port: 8080,
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
      // Keep a single instance of React and TanStack Query across bundles.
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
      // Rebuild the optimized deps on startup so an HMR cache can't mix hashes.
      force: true,
    },
  };
});
