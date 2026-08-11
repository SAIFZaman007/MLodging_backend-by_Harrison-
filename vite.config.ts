import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 5174,
    fs: {
      strict: false,
      allow: [
        process.cwd(),
        "C:/PROJECT/Client/Master_Lodging ~ by Harrison/dashboard",
      ],
    },
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Recharts + d3 is by far the heaviest dependency and only the dashboard
        // route needs it. Splitting it keeps the login/auth path fast to boot.
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
          if (id.includes("react") || id.includes("@tanstack")) return "vendor";
          return undefined;
        },
      },
    },
  },
});