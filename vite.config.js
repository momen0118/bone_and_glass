import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// img/ 以下の画像は src/images.js の import.meta.glob がビルド時に取り込む
// (dist へのコピーは不要になった)

export default defineConfig({
  base: "./",
  plugins: [react()],
});
