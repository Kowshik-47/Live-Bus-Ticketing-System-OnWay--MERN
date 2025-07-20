import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react-swc";

// Server build configuration
export default defineConfig({
  plugins: [react()],
  server: {
    host: "localhost",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5173", // or your backend port
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
    },
  },
  build: {
    outDir: "dist",
  },
});
