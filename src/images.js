// リポジトリ img/ に置かれた画像の自動読み込み
// CLAUDE.md の命名規則どおり png → jpg の順に探し、見つかった URL を返す。
// 無いスロットは null(呼び出し側で 画廊 → 絵文字 にフォールバックする)。

import { SPECIMENS } from "./data.js";

export const PORTRAIT_IDS = ["gakusei", "gakusha", "koujika", "kifujin", "collector"];

function probe(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function findImage(pathBase) {
  return (await probe(`${pathBase}.png`)) || (await probe(`${pathBase}.jpg`));
}

// 戻り値: { shop: url|null, portraits: {id: url}, specimens: {id: url} }
export async function loadFileImages() {
  const base = import.meta.env.BASE_URL || "./";
  const jobs = [];
  const result = { shop: null, portraits: {}, specimens: {} };

  jobs.push(findImage(`${base}img/shop`).then((u) => { result.shop = u; }));
  for (const id of PORTRAIT_IDS) {
    jobs.push(findImage(`${base}img/portraits/${id}`).then((u) => { if (u) result.portraits[id] = u; }));
  }
  for (const id of Object.keys(SPECIMENS)) {
    jobs.push(findImage(`${base}img/specimens/${id}`).then((u) => { if (u) result.specimens[id] = u; }));
  }
  await Promise.all(jobs);
  return result;
}
