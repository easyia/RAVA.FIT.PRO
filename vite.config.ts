import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["Favicon.png", "Logomarca.png"],
      manifest: {
        name: "RAVA FIT PRO",
        short_name: "RAVA FIT",
        description: "Transformando Resultados em Alta Performance",
        theme_color: "#9b87f5",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "/Logomarca.png",
            sizes: "512x512",
            type: "image/png",
          }
        ],
      },
    }),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
