// リポジトリ img/ に置かれた画像の自動読み込み
// ビルド時に import.meta.glob が img/ 以下を走査して一覧を自動生成する。
// 画像を置いてビルド(=mainへのpush)するだけで反映され、手動の一覧更新は不要。
// 存在しないパスへ探索リクエストを出さないので404も発生しない。
// 同名の png と jpg が両方あれば png 優先(CLAUDE.md の規則どおり)。
// 無いスロットは null(呼び出し側で 画廊 → 絵文字 にフォールバックする)。

import { SPECIMENS } from "./data.js";

export const PORTRAIT_IDS = ["gakusei", "gakusha", "koujika", "kifujin", "collector"];

const FILES = import.meta.glob("/img/**/*.{png,jpg}", { eager: true, query: "?url", import: "default" });
const urlFor = (base) => FILES[`${base}.png`] || FILES[`${base}.jpg`] || null;

// 戻り値: { shop: url|null, portraits: {id: url}, specimens: {id: url} }
// (呼び出し側の形を変えないため async のまま)
export async function loadFileImages() {
  const result = { shop: urlFor("/img/shop"), portraits: {}, specimens: {} };
  for (const id of PORTRAIT_IDS) {
    const u = urlFor(`/img/portraits/${id}`);
    if (u) result.portraits[id] = u;
  }
  for (const id of Object.keys(SPECIMENS)) {
    const u = urlFor(`/img/specimens/${id}`);
    if (u) result.specimens[id] = u;
  }
  return result;
}
