import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cpSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// リポジトリ直下の img/ を、ビルド時に dist/img/ へそのまま複製する。
// (CLAUDE.md の画像命名規則どおり、img/ に置いた画像を配信するため。
//  開発サーバではプロジェクトルートの img/ がそのまま配信される)
function copyImgDir() {
  return {
    name: "copy-img-dir",
    closeBundle() {
      const src = resolve(__dirname, "img");
      if (existsSync(src)) cpSync(src, resolve(__dirname, "dist/img"), { recursive: true });
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), copyImgDir()],
});
