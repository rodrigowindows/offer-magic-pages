import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Proxy para evitar CORS em desenvolvimento
    proxy: mode === "development" ? {
      '/api/marketing': {
        target: 'https://marketing.workfaraway.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/marketing/, ''),
        secure: false,
      }
    } : undefined,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
