import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const rootDir = typeof import.meta.dirname !== 'undefined' ? import.meta.dirname : __dirname;

export default defineConfig({
  root: path.resolve(rootDir, "registropolis-main"),
  envDir: rootDir,
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "registropolis-main/src"),
    },
  },
});
