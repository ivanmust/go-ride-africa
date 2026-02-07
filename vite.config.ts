import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

/** Serves the correct HTML entry for driver/admin client-side routes on refresh. */
function mpaHistoryFallback() {
  return {
    name: "mpa-history-fallback",
    enforce: "pre" as const,
    configureServer(server: { middlewares: { stack: Array<{ route: string; handle: (req: { url?: string }, res: object, next: () => void) => void }> } }) {
      const rewrite = (req: { url?: string }, _res: object, next: () => void) => {
        const raw = req.url ?? "";
        const pathname = raw.split("?")[0];
        const qs = raw.includes("?") ? raw.slice(raw.indexOf("?")) : "";
        if (pathname.startsWith("/index-driver.html")) {
          req.url = "/index-driver.html" + qs;
        } else if (pathname.startsWith("/index-admin.html")) {
          req.url = "/index-admin.html" + qs;
        }
        next();
      };
      server.middlewares.stack.unshift({ route: "", handle: rewrite });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      // Dev-only CSP: allow all outgoing connections so local APIs (3000, 4000, etc.) and Google maps work without CSP blocking.
      "Content-Security-Policy":
        "connect-src *; frame-src 'self' https://maps.googleapis.com;",
    },
  },
  plugins: [mpaHistoryFallback(), react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./src/shared"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        driver: path.resolve(__dirname, "index-driver.html"),
        admin: path.resolve(__dirname, "index-admin.html"),
      },
    },
  },
}));
