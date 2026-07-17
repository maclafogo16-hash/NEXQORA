import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Permite probar subdominios falsos en local, ej. demo.localhost:5173
    host: true,
  },
});
