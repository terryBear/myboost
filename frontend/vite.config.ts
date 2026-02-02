import react from "@vitejs/plugin-react-swc";
import path, { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  base: "/static/",
  build: {
    emptyOutDir: true,
    manifest: true, // 👈 important for django-vite
    outDir: path.resolve(__dirname, "../static/frontend"),
    rollupOptions: {
      input: {
        companies_report: resolve(__dirname, "src/companies_report.tsx"),
        client_report: resolve(__dirname, "src/client_report.tsx"),
      },
    },
  },
  server: {
    hmr: {
      host: "localhost",
      port: 5173,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
