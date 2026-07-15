// リポジトリ img/ に置かれた画像の自動読み込み
// ビルド時に import.meta.glob が img/ 以下を走査して一覧を自動生成する。
// 画像を置いてビルド(=mainへのpush)するだけで反映され、手動の一覧更新は不要。
// 存在しないパスへ探索リクエストを出さないので404も発生しない。
// 同名の png と jpg が両方あれば png 優先(CLAUDE.md の規則どおり)。
// 無いスロットは null(呼び出し側で 画廊 → 絵文字 にフォールバックする)。

import { SPECIMENS, MATERIALS, SITES } from "./data.js";

export const PORTRAIT_IDS = ["gakusei", "gakusha", "koujika", "kifujin", "collector", "ooya", "wakate", "mushiya", "saisyuunin"];

// リポジトリ読み込み画像のスロット種別ごとの初期zoom(ここ一箇所で調整する)
// 肖像は横長(左右に壁紙、中央に楕円の額)なので、円形切り抜きに楕円の内側が収まるよう拡大する
// shop=1.1 はタイトル背景の拡大トリム(店内観の外周の紙フチを画面外へ出す)
// site=1.1 は採集地カード背景の拡大トリム(背景画像の外周の紙フチをカード外へ出す)
export const FILE_ZOOM = { portrait: 1.7, shop: 1.1, site: 1.1 };

// 標本画像の外周トリム倍率: 生成画像の白フチ・右下の署名を表示時に切り落とす(元ファイルは加工しない)
export const SPEC_TRIM = 1.15;
// 個体差が出た標本用の上書き倍率(標本ID → 倍率)。初期は空
export const SPEC_TRIM_BY_ID = {};
export const specTrim = (id) => SPEC_TRIM_BY_ID[id] || SPEC_TRIM;

const FILES = import.meta.glob("/img/**/*.{png,jpg}", { eager: true, query: "?url", import: "default" });
const urlFor = (base) => FILES[`${base}.png`] || FILES[`${base}.jpg`] || null;

// 戻り値: { shop, portraits: {id: url}, specimens: {id: url}, materials: {id: url}, sites: {id: url} }
// materials(素材アイコン・ドット絵想定)と sites(採集地カード背景)は将来用の読み込み口。
// 画像が置かれた日から自動で反映される(無ければ絵文字・現行表示のまま)
export async function loadFileImages() {
  const result = { shop: urlFor("/img/shop"), logo: urlFor("/img/logo"), portraits: {}, specimens: {}, materials: {}, sites: {}, moon: {},
    // 月の独白の一拍で使う空の画像(満月=full / 新月=new)。未作成でも可(無ければ地の文のみ)
    sky: { full: urlFor("/img/sky/full"), new: urlFor("/img/sky/new") } };
  for (let i = 0; i < 7; i++) {
    const u = urlFor(`/img/moon/${i}`); // 月相ドットの差し替え口(0新月〜4満月〜6有明)。未作成でも可
    if (u) result.moon[i] = u;
  }
  for (const id of PORTRAIT_IDS) {
    const u = urlFor(`/img/portraits/${id}`);
    if (u) result.portraits[id] = u;
  }
  for (const id of Object.keys(SPECIMENS)) {
    const u = urlFor(`/img/specimens/${id}`);
    if (u) result.specimens[id] = u;
  }
  for (const id of Object.keys(MATERIALS)) {
    const u = urlFor(`/img/materials/${id}`);
    if (u) result.materials[id] = u;
  }
  for (const s of SITES) {
    const u = urlFor(`/img/sites/${s.id}`);
    if (u) result.sites[s.id] = u;
  }
  return result;
}
