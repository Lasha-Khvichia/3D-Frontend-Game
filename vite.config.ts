import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Babylon and React are pinned to their own chunks so a gameplay change does
// not invalidate the engine in every player's browser cache.
//
// Measured 2026-09-03: letting the bundler split Babylon naturally produced 60
// chunks and a larger total download. One chunk is the better trade here.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: "es2022",
    sourcemap: true,
    // The Babylon chunk is ~1.8MB raw / ~416KB gzipped and is meant to be big.
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules/@babylonjs")) return "babylon";
          if (id.includes("node_modules/react")) return "react";
          return undefined;
        },
      },
    },
  },
});
