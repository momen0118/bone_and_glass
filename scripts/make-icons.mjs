// ホーム画面アイコン(PWA)の生成スクリプト。
// 素材 img/specimens/s_torikotsu.jpg の中央を正方形クロップ(白フチ・署名を除外)して
// public/icons/ に各サイズの PNG を書き出す。元ファイルは加工しない。
//
// 実行: node scripts/make-icons.mjs
// 依存を増やさないため、既に同梱の Chromium(Playwright)で canvas 描画→PNG化する。
// 素材の絵柄を差し替えたときだけ再実行してコミットすればよい(CI のビルドには組み込まない)。
import { readFileSync, mkdirSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { createRequire } from "module";

// playwright はローカル/グローバルどちらの node_modules でも拾えるように解決する
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); }
catch { ({ chromium } = require(process.env.PW_MODULE || "/opt/node22/lib/node_modules/playwright/index.js")); }

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcPath = resolve(root, "img/specimens/s_torikotsu.jpg");
const outDir = resolve(root, "public/icons");
mkdirSync(outDir, { recursive: true });

// 中央クロップ範囲(素材に対する割合)。白い紙フチと右下の署名(✦)を枠外へ出す
const CROP = { x: 0.12, y: 0.10, size: 0.74 };
const SIZES = [
  { name: "apple-touch-icon.png", px: 180 },
  { name: "icon-192.png", px: 192 },
  { name: "icon-512.png", px: 512 },
];

const dataUrl = "data:image/jpeg;base64," + readFileSync(srcPath).toString("base64");

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || "/opt/pw-browsers/chromium" });
const page = await browser.newPage();
for (const { name, px } of SIZES) {
  const b64 = await page.evaluate(async ({ dataUrl, crop, px }) => {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const W = img.naturalWidth, H = img.naturalHeight;
    const side = Math.min(W, H) * crop.size;
    const sx = W * crop.x, sy = H * crop.y;
    const cv = document.createElement("canvas");
    cv.width = px; cv.height = px;
    const ctx = cv.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    // 背景(店の色)で塗ってから絵柄を敷く(端の透過対策)
    ctx.fillStyle = "#14110d"; ctx.fillRect(0, 0, px, px);
    ctx.drawImage(img, sx, sy, side, side, 0, 0, px, px);
    return cv.toDataURL("image/png").split(",")[1];
  }, { dataUrl, crop: CROP, px });
  writeFileSync(resolve(outDir, name), Buffer.from(b64, "base64"));
  console.log("wrote", name, px + "px");
}
await browser.close();
console.log("done");
