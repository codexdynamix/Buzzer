import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  root: path.resolve(import.meta.dirname, "registropolis-main"),
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "registropolis-main/src"),
    },
  },
});
