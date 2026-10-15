import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// In dev, /api/* is proxied to the FastAPI backend (default http://127.0.0.1:8000).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_PROXY || "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
  test: { environment: "jsdom", globals: true, setupFiles: "./src/test-setup.js" },
});
