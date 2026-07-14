import React, { useState, useEffect, useCallback } from "react";

// ============================================================
// 骨と硝子の店 — Os et Vitrum — v2
// 追加: 銘板セット / 通り名 / 熟練度 / 霧の湿原 / 棚増設・内装
//       外套の蒐集家(交渉) / 常連セリフ / 画像差し替え(画廊)
// ============================================================

import {
  SAVE_KEY, IMG_KEY, C,
  MATERIALS, MAT_ORDER, CAT_NAME, TAG_NAME, SPECIMENS,
  PROCESSES, procLevel, RECIPES, SPEC_PROC, SECONDARY,
  SITES, SUPPLY_SHOP, SHELF_EXPAND, DECOR,
  CUSTOMERS, COLLECTOR, OOYA, SHOP_BUYOUT, SETS, ALIASES, PRICE_MODES,
  GAKUSEI_KOUHAI_LINE, GAKUSEI_GRAD, SWAMP_UNLOCK, CAVE_UNLOCK, SPEC_LORE,
  RENT, RENT_INTERVAL, MAX_AP,
} from "./data.js";
import { storage } from "./storage.js";
import { loadFileImages, FILE_ZOOM, specTrim } from "./images.js";

// ---------- ユーティリティ ----------
const rnd = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rnd(arr.length)];
function weightedPick(pairs) {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [v, w] of pairs) { r -= w; if (r <= 0) return v; }
  return pairs[pairs.length - 1][0];
}
const itemName = (id) => (SPECIMENS[id] ? SPECIMENS[id].name : MATERIALS[id].name);
const itemIcon = (id) => (SPECIMENS[id] ? SPECIMENS[id].icon : MATERIALS[id].icon);
const round5 = (n) => Math.round(n / 5) * 5;

function newGame() {
  return {
    day: 1, phase: "morning", gold: 300, rep: 0, ap: MAX_AP,
    inv: { tori: 1, chou: 1, bin: 1 },
    spec: {},
    shelf: Array(9).fill(null), shelfSize: 6,
    known: [], knownSets: [],
    priceMode: "normal",
    nightLog: [], nightEarn: 0, nightRent: null,
    totalEarn: 0, totalSold: 0,
    craftLog: [],
    procExp: { boil: 0, dry: 0, preserve: 0, frame: 0, polish: 0, assemble: 0 },
    decor: { lamp: false, velvet: false, window: false },
    soldByCat: { bone: 0, insect: 0, wet: 0, mineral: 0, craft: 0 },
    custBought: {},
    alias: null, aliasHistory: [],
    offer: null, offerResult: null, collectorCd: 0,
    apprentice: false,
    trust: 0, // 蒐集家の信頼(内部値、-6〜+6。画面には出さない)
    lastRent: RENT, // 前回支払った家賃額
    ownShop: false, buyoutPending: false, // 店の買い取り(pendingは買った日の夜の演出用)
    gakuseiGraduated: false, // 学生の就職イベント(一度きり)
    swampUnlocked: false,    // 霧の湿原(老学者への累計販売で解禁)
    caveUnlocked: false, gatherCount: 0, // 石灰洞窟(森・入り江への依頼の累計で解禁)
  };
}
const clampTrust = (t) => Math.max(-6, Math.min(6, t));
// 家賃の段階化: 開店前(その日の朝時点)の評判で判定。大家は先週までの噂を聞いて来る
const rentFor = (rep) => (rep >= 40 ? 200 : rep >= 20 ? 150 : RENT);
// v1セーブの取り込み
function migrate(loaded) {
  const base = newGame();
  const g = { ...base, ...loaded };
  if (!Array.isArray(g.shelf) || g.shelf.length < 9)
    g.shelf = [...(g.shelf || []), ...Array(9).fill(null)].slice(0, 9);
  g.shelfSize = loaded.shelfSize || 6;
  g.procExp = { ...base.procExp, ...(loaded.procExp || {}) };
  g.decor = { ...base.decor, ...(loaded.decor || {}) };
  g.soldByCat = { ...base.soldByCat, ...(loaded.soldByCat || {}) };
  g.custBought = { ...(loaded.custBought || {}) };
  g.knownSets = loaded.knownSets || [];
  g.aliasHistory = loaded.aliasHistory || [];
  g.offer = null; g.offerResult = null;
  g.collectorCd = loaded.collectorCd || 0;
  g.apprentice = !!loaded.apprentice;
  g.trust = typeof loaded.trust === "number" ? clampTrust(loaded.trust) : 0;
  // 通り名を持たない旧セーブは、従来の判定(最多カテゴリ5個以上)で引き継ぐ
  if (!("alias" in loaded)) g.alias = aliasOf(g.soldByCat);
  g.lastRent = typeof loaded.lastRent === "number" ? loaded.lastRent : RENT;
  g.ownShop = !!loaded.ownShop;
  g.buyoutPending = false;
  g.gakuseiGraduated = !!loaded.gakuseiGraduated;
  // 旧セーブ: 湿原は評判10以上なら解禁済み扱い、洞窟は解禁済み扱い
  g.swampUnlocked = loaded.swampUnlocked !== undefined ? !!loaded.swampUnlocked : (loaded.rep || 0) >= 10;
  g.caveUnlocked = loaded.caveUnlocked !== undefined ? !!loaded.caveUnlocked : true;
  g.gatherCount = loaded.gatherCount || 0;
  return g;
}

// ---------- 棚まわりの計算 ----------
function adjBonus(shelf, i, size) {
  const me = shelf[i]; if (!me) return false;
  const row = Math.floor(i / 3), col = i % 3;
  const neigh = [];
  if (col > 0) neigh.push(row * 3 + col - 1);
  if (col < 2) neigh.push(row * 3 + col + 1);
  if (row > 0) neigh.push((row - 1) * 3 + col);
  if (row < 2) neigh.push((row + 1) * 3 + col);
  return neigh.some((j) => j < size && shelf[j] && SPECIMENS[shelf[j]].cat === SPECIMENS[me].cat);
}
function activeSets(shelf, size) {
  const ids = shelf.slice(0, size).filter(Boolean);
  const res = [];
  for (const s of SETS) {
    if (s.groups) {
      const chosen = []; let ok = true;
      for (const grp of s.groups) {
        const hit = grp.filter((x) => ids.includes(x));
        if (!hit.length) { ok = false; break; }
        chosen.push(...hit);
      }
      if (ok) res.push({ ...s, members: [...new Set(chosen)] });
    } else if (s.cat) {
      const members = ids.filter((x) => SPECIMENS[x].cat === s.cat);
      if (members.length >= s.count) res.push({ ...s, members: [...new Set(members)] });
    }
  }
  return res;
}
// 基準価(熟練Lv3・天鵞絨込み、棚補正なし)
function basePrice(g, specId) {
  let p = SPECIMENS[specId].price;
  const proc = SPEC_PROC[specId];
  if (proc && procLevel(g.procExp[proc] || 0) >= 3) p *= 1.10;
  if (g.decor.velvet && SPECIMENS[specId].tags.includes("fancy")) p *= 1.10;
  return p;
}
// 棚上の売価(値付け・隣接・銘板込み)
function shelfPrice(g, i, sets) {
  const id = g.shelf[i]; if (!id) return 0;
  let p = basePrice(g, id) * PRICE_MODES[g.priceMode].mult;
  if (adjBonus(g.shelf, i, g.shelfSize)) p *= 1.15;
  if (sets && sets.some((s) => s.members.includes(id))) p *= 1.20;
  return round5(p);
}
function aliasOf(soldByCat) {
  let best = null, bestN = 0;
  for (const [cat, n] of Object.entries(soldByCat)) {
    if (n > bestN) { best = cat; bestN = n; }
  }
  return bestN >= 10 ? best : null;
}
// 通り名の粘り: 未獲得なら最多カテゴリ(5個以上)で獲得。
// 獲得済みなら、他カテゴリが現通り名カテゴリを3個以上上回った場合のみ交代
function nextAlias(cur, soldByCat) {
  if (!cur) return aliasOf(soldByCat);
  const curN = soldByCat[cur] || 0;
  let best = null, bestN = 0;
  for (const [cat, n] of Object.entries(soldByCat)) {
    if (cat === cur) continue;
    if (n > bestN) { best = cat; bestN = n; }
  }
  return best && bestN >= curN + 3 ? best : cur;
}
function custLine(c, bought, kind) {
  const L = c.lines;
  if (kind === "buy") {
    let pool = [...L.buy];
    if (bought >= 18 && L.friend) pool = [...pool, ...L.friend, ...L.friend];
    else if (bought >= 8 && L.regular) pool = [...pool, ...L.regular, ...L.regular];
    return pick(pool);
  }
  return pick(L[kind] || L.buy);
}

// ---------- 夜の営業 ----------
function simulateNight(g) {
  const log = [];
  let gold = 0, rep = 0, sold = 0;
  const shelf = [...g.shelf];
  const soldByCat = { ...g.soldByCat };
  const custBought = { ...g.custBought };
  const mode = PRICE_MODES[g.priceMode];
  const sets = activeSets(shelf, g.shelfSize);

  // 来客数の上限は棚数に連動(棚6→最大8人、棚9→最大11人)
  let visitors = Math.min(g.shelfSize + 2, 2 + Math.floor(g.rep / 8) + (g.decor.lamp ? 1 : 0) + (Math.random() < 0.5 ? 1 : 0));
  const aliasCat = g.alias;
  const pool = CUSTOMERS.filter((c) => g.rep >= c.minRep && (!c.flag || g[c.flag])).map((c) => {
    let w = c.weight;
    if (aliasCat && ALIASES[aliasCat].invite.includes(c.id)) w += 2;
    if (sets.some((s) => s.invite === c.id)) w += 2;
    // 就職イベント後、学生は後輩に代替わり(buyに一言加わる)
    if (c.id === "gakusei" && g.gakuseiGraduated)
      c = { ...c, lines: { ...c.lines, buy: [...c.lines.buy, GAKUSEI_KOUHAI_LINE] } };
    return [c, w];
  });
  let graduated = g.gakuseiGraduated;

  const priceAt = (i) => {
    let p = basePrice(g, shelf[i]) * mode.mult;
    if (adjBonus(shelf, i, g.shelfSize)) p *= 1.15;
    if (sets.some((s) => s.members.includes(shelf[i]))) p *= 1.20;
    return round5(p);
  };

  for (let v = 0; v < visitors; v++) {
    const c = weightedPick(pool);
    // 学生の就職イベント: 累計販売が閾値に達した後の来店を置き換える(購入なし・一度きり)
    if (c.id === "gakusei" && !graduated && (custBought.gakusei || 0) >= GAKUSEI_GRAD.threshold) {
      graduated = true;
      custBought.gakusei = 0; // 後輩に代替わり
      log.push({
        t: "misc", cid: "gakusei",
        line: GAKUSEI_GRAD.line, sub: GAKUSEI_GRAD.sub,
        text: `学生「${GAKUSEI_GRAD.line}」— ${GAKUSEI_GRAD.sub}`,
      });
      continue;
    }
    const bought = custBought[c.id] || 0;
    const slots = shelf.map((id, i) => ({ id, i })).filter((s) => s.id && s.i < g.shelfSize);
    if (!slots.length) { log.push({ t: "misc", cid: c.id, text: `${c.name}が覗いたが、棚は空だった。`, line: null }); continue; }

    const afford = slots.filter((s) => priceAt(s.i) <= c.budget);
    if (!afford.length) {
      const line = custLine(c, bought, "poor");
      log.push({ t: "misc", cid: c.id, text: `${c.name}「${line}」`, line });
      continue;
    }
    const favs = afford.filter((s) => {
      const sp = SPECIMENS[s.id];
      return sp.tags.some((t) => c.likesTags.includes(t)) || c.likesCats.includes(sp.cat);
    });
    let target, chance;
    if (favs.length) { target = pick(favs); chance = 0.85; }
    else { target = pick(afford); chance = c.easyBuyer ? 0.75 : 0.5; }
    chance = Math.min(0.97, chance * mode.buy + (g.decor.window ? 0.05 : 0));

    if (Math.random() < chance) {
      const price = priceAt(target.i);
      const sp = SPECIMENS[target.id];
      shelf[target.i] = null;
      gold += price; sold++;
      soldByCat[sp.cat] = (soldByCat[sp.cat] || 0) + 1;
      custBought[c.id] = bought + 1;
      rep += 1 + (sp.tags.includes("rare") ? 1 : 0) + mode.repBonus;
      const big = price >= 300;
      const line = big ? custLine(c, bought, "big") : custLine(c, bought, "buy");
      log.push({ t: "sale", cid: c.id, big, text: `${c.name}「${line}」— ${sp.icon} ${sp.name}を ${price}G で購入。`, line, itemId: target.id, price });
    } else {
      const line = custLine(c, bought, "pass");
      log.push({ t: "misc", cid: c.id, text: `${c.name}「${line}」`, line });
    }
  }
  if (!visitors) log.push({ t: "misc", text: "今夜は誰も来なかった。硝子が静かに光っている。" });

  // 湿原の解禁(老学者への累計販売が閾値に達した夜、営業ログ末尾にイベント行)
  let swampUnlocked = g.swampUnlocked;
  if (!swampUnlocked && (custBought.gakusha || 0) >= SWAMP_UNLOCK.threshold) {
    swampUnlocked = true;
    log.push({ t: "event", cid: "gakusha", text: SWAMP_UNLOCK.text });
  }

  // 家賃(店を買い取った夜は、大家の去り際のイベント行に差し替わる)
  let rentLog = null, rentPaid = null;
  if (g.buyoutPending) {
    rentLog = { t: "event", cid: "ooya", text: `大家は金を数え終え、しばらく黙っていた。「${OOYA.farewell}」` };
  } else if (!g.ownShop && g.day % RENT_INTERVAL === 0) {
    const rent = rentFor(g.rep); // 開店前(朝時点)の評判で判定
    const cash = g.gold + gold;  // 支払い直前の所持金
    gold -= rent; rentPaid = rent;
    let text;
    if (rent > (g.lastRent != null ? g.lastRent : RENT)) {
      text = rent >= 200
        ? `大家「${OOYA.raise200}」— 家賃は ${rent}G になった。`
        : `大家「${OOYA.raise150}」— 家賃は ${rent}G になった。`;
    } else if (cash < rent) {
      text = `大家「${OOYA.broke}」`;
    } else if (Math.random() < 0.5) {
      text = `大家「${pick(OOYA.normal)}」— 家賃 ${rent}G を支払った。`;
    } else {
      text = `大家が来た。家賃 ${rent}G を支払った。`;
    }
    rentLog = { t: "rent", cid: "ooya", text };
  }

  // 見習いの日当
  let wageText = null;
  if (g.apprentice) { gold -= 50; wageText = "見習いに日当 50G を払った。"; }

  // 蒐集家の来訪判定(trustが負のときのみ出現率が減衰。正でも上げない)
  let offer = null;
  if (g.rep >= 18 && (g.collectorCd || 0) <= 0) {
    const nightSet = sets.some((s) => s.id === "set_night");
    let appearRate = 0.22 + (nightSet ? 0.15 : 0);
    const trust = g.trust || 0;
    if (trust < 0) appearRate *= 1 + trust / 8;
    if (Math.random() < appearRate) {
      const shelfRares = shelf.map((id, i) => ({ id, i })).filter((s) => s.id && s.i < g.shelfSize && SPECIMENS[s.id].tags.includes("rare"));
      const stockRares = Object.keys(g.spec).filter((k) => g.spec[k] > 0 && SPECIMENS[k].tags.includes("rare"));
      if (shelfRares.length) { const t = pick(shelfRares); offer = { specId: t.id, source: "shelf", slot: t.i }; }
      else if (stockRares.length) { offer = { specId: pick(stockRares), source: "stock" }; }
    }
  }
  return { log, gold, rep, sold, rentLog, rentPaid, wageText, shelf, soldByCat, custBought, offer,
    gakuseiGraduated: graduated, swampUnlocked };
}

// ---------- 画像 ----------
const IMG_SLOTS = [
  { id: "shop",      name: "店内観(タイトル背景)", wide: true },
  { id: "gakusei",   name: "学生" },
  { id: "gakusha",   name: "老学者" },
  { id: "koujika",   name: "好事家" },
  { id: "kifujin",   name: "貴婦人" },
  { id: "collector", name: "外套の蒐集家" },
  { id: "ooya",      name: "大家" },
  { id: "wakate",    name: "若い研究者" },
];
const ZOOMS = [1.0, 1.15, 1.35];
function resizeImage(file, maxW, maxH, cb) {
  const fr = new FileReader();
  fr.onload = () => {
    const img = new Image();
    img.onload = () => {
      const sc = Math.min(1, maxW / img.width, maxH / img.height);
      const cv = document.createElement("canvas");
      cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc);
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      cb(cv.toDataURL("image/jpeg", 0.82));
    };
    img.src = fr.result;
  };
  fr.readAsDataURL(file);
}

// ============================================================
// UI 部品
// ============================================================
// 下部バーのボタン共通スタイル(折り返し禁止・狭い幅でも一行に収める)
const FOOT_BTN = { fontSize: 12, padding: "8px 9px", whiteSpace: "nowrap" };
const Panel = ({ children, style }) => (
  <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 6, padding: 12, ...style }}>{children}</div>
);
const Btn = ({ children, onClick, disabled, primary, style }) => (
  <button onClick={onClick} disabled={disabled}
    style={{
      fontFamily: "inherit", cursor: disabled ? "default" : "pointer",
      background: disabled ? "#221d15" : primary ? C.brass : C.panelHi,
      color: disabled ? "#5a4f3d" : primary ? "#1a140c" : C.ivory,
      border: `1px solid ${disabled ? "#33291c" : primary ? C.brass : C.line}`,
      borderRadius: 4, padding: "8px 14px", fontSize: 14, fontWeight: primary ? 700 : 400,
      letterSpacing: "0.05em", ...style,
    }}>{children}</button>
);
const TagChip = ({ t }) => (
  <span style={{ fontSize: 10, border: `1px solid ${C.brass}`, color: C.brass, borderRadius: 3, padding: "0 4px", marginLeft: 4 }}>{TAG_NAME[t]}</span>
);
// 肖像の絵文字フォールバック
const portraitFallback = (cid) =>
  cid === "collector" ? COLLECTOR.icon
  : cid === "ooya" ? OOYA.icon
  : (CUSTOMERS.find((c) => c.id === cid) || {}).icon || "·";

// 肖像: リポジトリ画像 → 画廊(アップロード) → 絵文字 の順
const Portrait = ({ cid, imgs, fileImgs, size = 34 }) => {
  const fileUrl = fileImgs && fileImgs.portraits && fileImgs.portraits[cid];
  const meta = imgs && imgs[cid];
  const fb = portraitFallback(cid);
  const src = fileUrl || (meta && meta.data);
  if (!src) return <span style={{ fontSize: Math.round(size * 0.62), width: size, textAlign: "center", flexShrink: 0 }}>{fb}</span>;
  const zoom = fileUrl ? FILE_ZOOM.portrait : (meta.zoom || 1.15);
  return (
    <span style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", display: "inline-block", border: `1px solid ${C.line}`, flexShrink: 0, background: "#000" }}>
      <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})`, filter: "sepia(0.3) contrast(1.05) brightness(0.98)" }} />
    </span>
  );
};
// 夜のカード用の大きな肖像(額縁風)。画像が無ければ絵文字を大きく
const FramedPortrait = ({ cid, imgs, fileImgs }) => {
  const fileUrl = fileImgs && fileImgs.portraits && fileImgs.portraits[cid];
  const meta = imgs && imgs[cid];
  const src = fileUrl || (meta && meta.data);
  const fb = portraitFallback(cid);
  const zoom = fileUrl ? FILE_ZOOM.portrait : (meta && meta.zoom) || 1.15;
  return (
    <div style={{ width: "40%", flexShrink: 0 }}>
      <div style={{ border: `3px double ${C.brass}`, borderRadius: 4, padding: 3, background: "#0e0b08", boxShadow: "0 2px 10px rgba(0,0,0,0.45)" }}>
        <div style={{ aspectRatio: "1 / 1", overflow: "hidden", borderRadius: 2, background: "#171310", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {src
            ? <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})`, filter: "sepia(0.3) contrast(1.05) brightness(0.98)" }} />
            : <span style={{ fontSize: 52 }}>{fb}</span>}
        </div>
      </div>
    </div>
  );
};
// 標本の絵柄: リポジトリ画像があれば正方形・角丸で、なければ絵文字
// 画像は角丸コンテナ内で specTrim() 倍に拡大し、外周の白フチ・署名を切り落とす
const SpecIcon = ({ id, fileImgs, size = 20, emojiSize, style }) => {
  const url = fileImgs && fileImgs.specimens && fileImgs.specimens[id];
  if (url) return (
    <span style={{
      width: size, height: size, borderRadius: Math.max(3, Math.round(size * 0.14)),
      overflow: "hidden", display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style,
    }}>
      <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transform: `scale(${specTrim(id)})` }} />
    </span>
  );
  return <span style={{ fontSize: emojiSize || Math.round(size * 0.85), lineHeight: 1, ...style }}>{SPECIMENS[id].icon}</span>;
};

// ============================================================
// メイン
// ============================================================
export default function BoneAndGlass() {
  const [screen, setScreen] = useState("loading");
  const [hasSave, setHasSave] = useState(false);
  const [g, setG] = useState(newGame);
  const [imgs, setImgs] = useState({});
  const [fileImgs, setFileImgs] = useState(null);
  const [sel, setSel] = useState(null);
  const [shelfPickFor, setShelfPickFor] = useState(null);
  const [showBook, setShowBook] = useState(false);
  const [bookTab, setBookTab] = useState("spec");
  const [bookDetail, setBookDetail] = useState(null); // 図鑑の詳細ビュー(発見済み標本ID)
  const [showGallery, setShowGallery] = useState(false);
  const [showDecor, setShowDecor] = useState(false);
  const [toast, setToast] = useState(null);
  // 夜のカード送り: idx=表示中の客, collapsed=「残りをまとめる」押下済み
  const [nightView, setNightView] = useState({ idx: 0, collapsed: false });
  // 洞窟解禁の朝のイベント行(その朝のあいだだけ表示)
  const [caveEvent, setCaveEvent] = useState(null);

  useEffect(() => {
    (async () => {
      try { const r = await storage.get(SAVE_KEY); if (r && r.value) setHasSave(true); } catch (e) {}
      try { const r = await storage.get(IMG_KEY); if (r && r.value) setImgs(JSON.parse(r.value)); } catch (e) {}
      setScreen("title");
    })();
    loadFileImages().then(setFileImgs).catch(() => {});
  }, []);

  const save = useCallback(async (state) => {
    try { await storage.set(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
  }, []);
  const saveImgs = async (next) => {
    setImgs(next);
    try { await storage.set(IMG_KEY, JSON.stringify(next)); } catch (e) { flash("画像の保存に失敗した…容量かも"); }
  };

  const loadSave = async () => {
    try {
      const r = await storage.get(SAVE_KEY);
      if (r && r.value) { setG(migrate(JSON.parse(r.value))); setScreen("game"); }
    } catch (e) { setToast("記録が読み込めなかった…"); }
  };
  const startNew = async () => {
    const ng = newGame(); setG(ng); setScreen("game");
    try { await storage.set(SAVE_KEY, JSON.stringify(ng)); } catch (e) {}
  };
  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2400); };

  // ---- 朝 ----
  const gather = (site) => {
    if (g.gold < site.cost) return flash("お金が足りない");
    const got = {};
    for (let i = 0; i < 3; i++) { const m = weightedPick(site.table); got[m] = (got[m] || 0) + 1; }
    const inv = { ...g.inv };
    Object.entries(got).forEach(([k, v]) => (inv[k] = (inv[k] || 0) + v));
    // 洞窟の解禁: 森・入り江への依頼の累計が閾値に達したら
    let gatherCount = g.gatherCount || 0, caveUnlocked = g.caveUnlocked;
    if (site.id === "mori" || site.id === "umibe") gatherCount += 1;
    const justUnlocked = !caveUnlocked && gatherCount >= CAVE_UNLOCK.threshold;
    if (justUnlocked) { caveUnlocked = true; setCaveEvent(CAVE_UNLOCK.text); }
    setG({ ...g, gold: g.gold - site.cost, inv, gatherCount, caveUnlocked });
    flash(justUnlocked ? CAVE_UNLOCK.text : "入手: " + Object.entries(got).map(([k, v]) => `${itemIcon(k)}${itemName(k)}×${v}`).join("、"));
  };
  const buySupply = (s) => {
    if (g.gold < s.cost) return flash("お金が足りない");
    const inv = { ...g.inv }; inv[s.id] = (inv[s.id] || 0) + 1;
    setG({ ...g, gold: g.gold - s.cost, inv });
  };
  const expandShelf = () => {
    const next = g.shelfSize + 1, cost = SHELF_EXPAND[next];
    if (!cost) return;
    if (g.gold < cost) return flash("お金が足りない");
    setG({ ...g, gold: g.gold - cost, shelfSize: next });
    flash(`大工が棚を増やしてくれた(${next}枠)`);
  };
  const buyDecor = (d) => {
    if (g.decor[d.id] || g.gold < d.cost) return;
    setG({ ...g, gold: g.gold - d.cost, decor: { ...g.decor, [d.id]: true } });
    flash(`${d.name}を設えた`);
  };
  // 店の買い取り(大家の別れの言葉はその夜の営業ログで)
  const buyShop = () => {
    if (g.ownShop || g.gold < SHOP_BUYOUT) return;
    setG({ ...g, gold: g.gold - SHOP_BUYOUT, ownShop: true, buyoutPending: true });
  };

  // ---- 昼 ----
  const craftables = (id) => RECIPES.filter((r) => r.from === id);
  // n=2 は熟練Lv3特典の「2個仕立てる」(1APで2個、素材・資材を2セット消費)
  const doCraft = (r, n = 1) => {
    if (g.ap <= 0) return flash("今日の作業はもう終わり");
    const p = PROCESSES[r.proc];
    const inv = { ...g.inv }; const spec = { ...g.spec };
    if (SPECIMENS[r.from]) { spec[r.from] -= n; if (spec[r.from] <= 0) delete spec[r.from]; }
    else { inv[r.from] -= n; if (inv[r.from] <= 0) delete inv[r.from]; }
    if (p.needs) { inv[p.needs] -= n; if (inv[p.needs] <= 0) delete inv[p.needs]; }
    spec[r.to] = (spec[r.to] || 0) + n;
    const isNew = !g.known.includes(r.id);
    const known = isNew ? [...g.known, r.id] : g.known;
    const exp = { ...g.procExp, [r.proc]: (g.procExp[r.proc] || 0) + n };
    const lvUp = procLevel(exp[r.proc]) > procLevel(g.procExp[r.proc] || 0);
    const made = SPECIMENS[r.to];
    const craftLog = [{ text: `${p.name} → ${made.icon} ${made.name}${n === 2 ? " ×2" : ""}${isNew ? "(新発見!)" : ""}`, isNew }, ...g.craftLog].slice(0, 6);
    setG({ ...g, inv, spec, known, ap: g.ap - 1, craftLog, procExp: exp });
    setSel(null);
    if (isNew) flash(`新しい標本を作り出した — ${made.name}`);
    else if (lvUp) flash(`${p.name}の腕が上がった(Lv${procLevel(exp[r.proc])})`);
  };

  // ---- 夕 ----
  const placeOnShelf = (slotIdx, specId) => {
    const shelf = [...g.shelf]; const spec = { ...g.spec };
    if (shelf[slotIdx]) spec[shelf[slotIdx]] = (spec[shelf[slotIdx]] || 0) + 1;
    if (specId) { spec[specId] -= 1; if (spec[specId] <= 0) delete spec[specId]; }
    shelf[slotIdx] = specId;
    // 銘板の発見記録
    const sets = activeSets(shelf, g.shelfSize);
    let knownSets = g.knownSets;
    sets.forEach((s) => {
      if (!knownSets.includes(s.id)) {
        knownSets = [...knownSets, s.id];
        flash(`銘板が掲がった — 『${s.name}』`);
      }
    });
    setG({ ...g, shelf, spec, knownSets });
    setShelfPickFor(null);
  };

  // ---- 開店 ----
  const openStore = () => {
    const res = simulateNight(g);
    const log = [...res.log];
    if (res.wageText) log.push({ t: "rent", text: res.wageText });
    if (res.rentLog) log.push(res.rentLog);
    // 通り名の変化(獲得済みの通り名には粘りがある)
    const oldAlias = g.alias, newAlias = nextAlias(g.alias, res.soldByCat);
    let aliasHistory = g.aliasHistory;
    if (newAlias && newAlias !== oldAlias) {
      const nm = ALIASES[newAlias].name;
      log.push({ t: "alias", text: `街の噂 — この店は『${nm}』と呼ばれはじめた。` });
      if (!aliasHistory.includes(newAlias)) aliasHistory = [...aliasHistory, newAlias];
    }
    setG({
      ...g, phase: "night", shelf: res.shelf,
      gold: g.gold + res.gold, rep: g.rep + res.rep,
      nightLog: log, nightEarn: res.gold, nightRent: res.rentLog ? res.rentLog.text : null,
      totalEarn: g.totalEarn + Math.max(0, res.gold), totalSold: g.totalSold + res.sold,
      soldByCat: res.soldByCat, custBought: res.custBought,
      alias: newAlias, aliasHistory,
      offer: res.offer, offerResult: null,
      lastRent: res.rentPaid != null ? res.rentPaid : g.lastRent,
      gakuseiGraduated: res.gakuseiGraduated, swampUnlocked: res.swampUnlocked,
    });
    setNightView({ idx: 0, collapsed: false });
  };

  // ---- 蒐集家との交渉 ----
  const resolveOffer = (choice) => {
    const o = g.offer; if (!o) return;
    const sp = SPECIMENS[o.specId];
    const base = basePrice(g, o.specId);
    const fair = round5(base * 1.6), high = round5(base * 2.2);
    const removeItem = (st) => {
      if (o.source === "shelf") { const shelf = [...st.shelf]; shelf[o.slot] = null; return { ...st, shelf }; }
      const spec = { ...st.spec }; spec[o.specId] -= 1; if (spec[o.specId] <= 0) delete spec[o.specId];
      return { ...st, spec };
    };
    if (choice === "fair") {
      const st = removeItem(g);
      setG({ ...st, gold: st.gold + fair, rep: st.rep + 3, nightEarn: st.nightEarn + fair, totalEarn: st.totalEarn + fair, totalSold: st.totalSold + 1,
        offer: null, offerResult: `${sp.name}を ${fair}G で譲った。蒐集家「${COLLECTOR.dealFair}」`, collectorCd: 2,
        trust: clampTrust((g.trust || 0) + 1) });
    } else if (choice === "high") {
      // ふっかけ成功率: 高額品ほど通りにくく、信頼が良好だと通りやすい(上限0.85)
      const trust = g.trust || 0;
      const highChance = Math.min(0.85,
        Math.max(0.35, Math.min(0.70, 0.75 - base / 2000)) + Math.max(0, trust) * 0.04);
      if (Math.random() < highChance) {
        const st = removeItem(g);
        setG({ ...st, gold: st.gold + high, rep: st.rep + 2, nightEarn: st.nightEarn + high, totalEarn: st.totalEarn + high, totalSold: st.totalSold + 1,
          offer: null, offerResult: `強気の値をつけた……通った。${sp.name}を ${high}G で売却。蒐集家「${COLLECTOR.dealHigh}」`, collectorCd: 2,
          trust: clampTrust(trust + 1) });
      } else {
        setG({ ...g, offer: null, offerResult: `強気の値をつけた……蒐集家「${COLLECTOR.dealFail}」外套が夜に溶けていった。`, collectorCd: 4,
          trust: clampTrust(trust - 3) });
      }
    } else {
      setG({ ...g, offer: null, offerResult: `断った。蒐集家「${COLLECTOR.refuse}」`, collectorCd: 1,
        trust: clampTrust((g.trust || 0) - 1) });
    }
  };

  // ---- 見習い ----
  const toggleApprentice = () => {
    const hire = !g.apprentice;
    setG({ ...g, apprentice: hire, ap: MAX_AP + (hire ? 1 : 0) });
  };

  // ---- 翌朝 ----
  const nextDay = () => {
    const ng = {
      ...g, day: g.day + 1, phase: "morning", ap: MAX_AP + (g.apprentice ? 1 : 0),
      nightLog: [], nightRent: null, craftLog: [], offer: null, offerResult: null,
      buyoutPending: false,
      collectorCd: Math.max(0, (g.collectorCd || 0) - 1),
      // 信頼は負のときだけ毎朝+0.5ずつ0へ回復(正の値は減衰しない)
      trust: (g.trust || 0) < 0 ? Math.min(0, (g.trust || 0) + 0.5) : (g.trust || 0),
    };
    setG(ng); save(ng);
  };

  const resetAll = async () => {
    if (!window.confirm("記録を消して最初からはじめる?(画像は残ります)")) return;
    try { await storage.delete(SAVE_KEY); } catch (e) {}
    startNew();
  };

  // ============================================================
  if (screen === "loading") return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.dim, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, 'Yu Mincho', serif" }}>
      店の鍵を開けています…
    </div>
  );

  const shopBg = (fileImgs && fileImgs.shop) || (imgs.shop && imgs.shop.data) || null;

  if (screen === "title") return (
    <div style={{ minHeight: "100vh", background: C.bg, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, 'Yu Mincho', serif", padding: 24, overflow: "hidden" }}>
      {shopBg && (
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${shopBg})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.35, filter: "sepia(0.2) brightness(0.8)",
          ...(fileImgs && fileImgs.shop && FILE_ZOOM.shop !== 1 ? { transform: `scale(${FILE_ZOOM.shop})` } : null) }} />
      )}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(20,17,13,0.3), rgba(20,17,13,0.92))" }} />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", color: C.ivory }}>
        <div style={{ fontSize: 13, letterSpacing: "0.5em", color: C.dim, marginBottom: 8 }}>OS ET VITRUM</div>
        <h1 style={{ fontSize: 34, fontWeight: 400, letterSpacing: "0.25em", margin: "0 0 6px" }}>骨と硝子の店</h1>
        <div style={{ width: 180, height: 1, background: C.brass, margin: "14px 0 18px" }} />
        <p style={{ color: "#b3a586", fontSize: 13, textAlign: "center", lineHeight: 1.9, maxWidth: 340, margin: "0 0 28px" }}>
          亡骸と鉱石を仕入れ、標本に仕立て、<br />硝子の棚に並べて売る。
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 220 }}>
          {hasSave && <Btn primary onClick={loadSave}>続きから</Btn>}
          <Btn primary={!hasSave} onClick={startNew}>{hasSave ? "最初から" : "開店する"}</Btn>
        </div>
      </div>
    </div>
  );

  // ---- ゲーム本体 ----
  const PHASE_LABEL = { morning: "朝 · 仕入れ", workshop: "昼 · 工房", shelf: "夕 · 陳列", night: "夜 · 営業" };
  const invEntries = Object.entries(g.inv).filter(([, v]) => v > 0)
    .sort((a, b) => MAT_ORDER.indexOf(a[0]) - MAT_ORDER.indexOf(b[0]));
  const specEntries = Object.entries(g.spec).filter(([, v]) => v > 0);
  const knownSpecs = new Set(RECIPES.filter((r) => g.known.includes(r.id)).map((r) => r.to));
  const curSets = activeSets(g.shelf, g.shelfSize);
  const daysToRent = (RENT_INTERVAL - (g.day % RENT_INTERVAL)) % RENT_INTERVAL;
  const aliasCat = g.alias;

  // 夜のカード送り用: 客の来店(カード対象)とそれ以外(家賃・通り名・イベント行など、サマリ行き)
  const isCardEntry = (l) => l.cid && (l.t === "sale" || l.t === "misc");
  const nightCust = g.nightLog.filter(isCardEntry);
  const nightSys = g.nightLog.filter((l) => !isCardEntry(l));
  const nightInCards = g.phase === "night" && !nightView.collapsed && nightView.idx < nightCust.length;
  // カード送り中の売上累計(表示済みカードまで)
  const nightEarnSoFar = nightCust.slice(0, nightView.idx + 1)
    .filter((l) => l.t === "sale").reduce((s, l) => s + (l.price || 0), 0);
  const nightAdvance = () => setNightView((v) => ({ ...v, idx: v.idx + 1 }));
  const nightCollapse = () => setNightView((v) => ({ ...v, collapsed: true }));
  // 現行の一覧ログ形式(まとめ表示・サマリで使う)
  const nightLogLine = (l, i) => (
    <div key={i} style={{
      display: "flex", alignItems: "flex-start", gap: 8,
      fontSize: 13, lineHeight: 1.7,
      color: l.t === "sale" ? C.ivory : l.t === "rent" ? C.red : l.t === "alias" || l.t === "event" ? C.brass : C.dim,
      borderLeft: `2px solid ${l.big ? "#e0b96a" : l.t === "sale" ? C.brass : l.t === "rent" ? C.red : l.t === "alias" || l.t === "event" ? C.brass : C.line}`,
      paddingLeft: 8,
      background: l.big ? "rgba(201,161,94,0.08)" : "transparent",
      borderRadius: l.big ? 4 : 0, paddingTop: l.big ? 4 : 0, paddingBottom: l.big ? 4 : 0,
    }}>
      {l.cid && <Portrait cid={l.cid} imgs={imgs} fileImgs={fileImgs} size={30} />}
      <span>{l.text}</span>
    </div>
  );

  // 二次加工マーク: '⚒'=発見済みの次加工あり '?'=未知の次加工あり
  const nextMark = (specId) => {
    const rid = SECONDARY[specId]; if (!rid) return null;
    return g.known.includes(rid) ? "⚒" : "?";
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.ivory, fontFamily: "Georgia, 'Yu Mincho', serif" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", paddingTop: 12, paddingLeft: 12, paddingRight: 12, paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))" }}>

        {/* ヘッダー */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: `1px solid ${C.line}`, paddingBottom: 8, marginBottom: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.3em", color: C.dim, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>骨と硝子の店</div>
            {aliasCat && (
              <div style={{ fontSize: 10, letterSpacing: "0.15em", color: C.brass, whiteSpace: "nowrap" }}>人呼んで『{ALIASES[aliasCat].name}』</div>
            )}
            <div style={{ fontSize: 16, letterSpacing: "0.1em", whiteSpace: "nowrap" }}>{g.day}日目 <span style={{ color: C.brass }}>{PHASE_LABEL[g.phase]}</span></div>
          </div>
          <div style={{ textAlign: "right", fontSize: 13 }}>
            <div style={{ color: g.gold < 0 ? C.red : C.brass, fontVariantNumeric: "tabular-nums" }}>{g.gold} G{g.gold < 0 ? "(借金)" : ""}</div>
            <div style={{ color: C.dim }}>評判 {g.rep} · {g.ownShop
              ? <span style={{ color: C.glass }}>自分の店</span>
              : <span style={{ color: daysToRent === 0 ? C.red : C.dim }}>{daysToRent === 0 ? "今夜家賃" : `家賃${rentFor(g.rep)}Gまで${daysToRent}日`}</span>}</div>
          </div>
        </div>

        {/* ===== 朝 ===== */}
        {g.phase === "morning" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Panel style={{ background: "transparent" }}>
              <div style={{ fontSize: 11, color: C.dim, marginBottom: 4 }}>倉庫</div>
              <div style={{ fontSize: 13, lineHeight: 1.9 }}>
                {invEntries.length ? invEntries.map(([k, v]) => <span key={k} style={{ marginRight: 10, whiteSpace: "nowrap" }}>{itemIcon(k)}{itemName(k)}×{v}</span>) : <span style={{ color: C.dim }}>空っぽだ</span>}
              </div>
            </Panel>
            <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.8 }}>夜のうちに届いた依頼票に目を通す。今日はどこへ人をやろうか。</div>
            {caveEvent && (
              <div style={{ fontSize: 12, color: C.brass, lineHeight: 1.8, borderLeft: `2px solid ${C.brass}`, paddingLeft: 8 }}>{caveEvent}</div>
            )}
            {SITES.filter((s) =>
              s.id === "shitsugen" ? g.swampUnlocked : s.id === "doukutsu" ? g.caveUnlocked : true
            ).map((s) => (
              <Panel key={s.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 15 }}>{s.name} <span style={{ color: C.brass, fontSize: 13 }}>{s.cost}G</span></div>
                    <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{s.desc}</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>{s.table.map(([m]) => itemIcon(m)).join(" ")}</div>
                  </div>
                  <Btn onClick={() => gather(s)} disabled={g.gold < s.cost}>採集依頼</Btn>
                </div>
              </Panel>
            ))}
            <Panel>
              <div style={{ fontSize: 15, marginBottom: 6 }}>古物市 <span style={{ fontSize: 11, color: C.dim }}>資材の買い付け</span></div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {SUPPLY_SHOP.map((s) => (
                  <Btn key={s.id} onClick={() => buySupply(s)} disabled={g.gold < s.cost} style={{ fontSize: 13 }}>
                    {itemIcon(s.id)} {itemName(s.id)} {s.cost}G <span style={{ color: C.dim }}>(所持{g.inv[s.id] || 0})</span>
                  </Btn>
                ))}
              </div>
            </Panel>
            {g.rep >= 20 && (
              <Panel>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 15 }}>見習い <span style={{ fontSize: 11, color: C.dim }}>日当50G</span></div>
                    <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>
                      {g.apprentice ? "見習いは朝から工房にいる(作業+1)" : "見習いには暇を出している"}
                    </div>
                  </div>
                  <Btn onClick={toggleApprentice}>{g.apprentice ? "休ませる" : "雇う"}</Btn>
                </div>
              </Panel>
            )}
          </div>
        )}

        {/* ===== 昼(工房) ===== */}
        {g.phase === "workshop" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 12, color: C.dim }}>素材を選んで、仕立て方を決める。</div>
              <div style={{ fontSize: 13, color: C.brass }}>作業残り {"●".repeat(g.ap)}{"○".repeat(Math.max(0, MAX_AP + (g.apprentice ? 1 : 0) - g.ap))}</div>
            </div>

            <Panel>
              <div style={{ fontSize: 11, color: C.dim, marginBottom: 6 }}>作業台に載せる <span style={{ color: "#6f6350" }}>(⚒=仕立て直せる ?=まだ何かになりそう)</span></div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", maxHeight: 92, overflowY: "auto", paddingBottom: 2 }}>
                {[...invEntries.filter(([k]) => !MATERIALS[k].supply), ...specEntries.filter(([k]) => craftables(k).length)].map(([k, v]) => {
                  const mk = SPECIMENS[k] ? nextMark(k) : null;
                  return (
                    <button key={k} onClick={() => setSel(k === sel ? null : k)}
                      style={{
                        fontFamily: "inherit", cursor: "pointer", fontSize: 13, padding: "6px 9px", borderRadius: 4,
                        background: sel === k ? C.brass : C.panelHi, color: sel === k ? "#1a140c" : C.ivory,
                        border: `1px solid ${sel === k ? C.brass : C.line}`,
                        whiteSpace: "nowrap", flexShrink: 0,
                      }}>{itemIcon(k)} {itemName(k)} ×{v}{mk && <span style={{ color: sel === k ? "#1a140c" : C.glass, marginLeft: 4 }}>{mk}</span>}</button>
                  );
                })}
                {!invEntries.filter(([k]) => !MATERIALS[k].supply).length && !specEntries.filter(([k]) => craftables(k).length).length &&
                  <span style={{ color: C.dim, fontSize: 12 }}>加工できるものがない。明日の仕入れで補充しよう。</span>}
              </div>
            </Panel>

            <Panel>
              <div style={{ fontSize: 11, color: C.dim, marginBottom: 6 }}>仕立て方 {sel ? `— ${itemIcon(sel)} ${itemName(sel)}` : "(先に素材を選ぶ)"}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {Object.entries(PROCESSES).map(([pid, p]) => {
                  const lv = procLevel(g.procExp[pid] || 0);
                  const r = sel ? RECIPES.find((x) => x.from === sel && x.proc === pid) : null;
                  const possible = !!r;
                  const lvOk = r && lv >= (r.minLv || 1);
                  const known = r && g.known.includes(r.id);
                  const stocked = r && (!p.needs || (g.inv[p.needs] || 0) > 0);
                  const disabled = !sel || !possible || !lvOk || !stocked || g.ap <= 0;
                  // Lv3特典: 素材・資材が2セットあれば1APで2個
                  const fromCount = r ? (SPECIMENS[r.from] ? (g.spec[r.from] || 0) : (g.inv[r.from] || 0)) : 0;
                  const canDouble = !disabled && lv >= 3 && fromCount >= 2 && (!p.needs || (g.inv[p.needs] || 0) >= 2);
                  return (
                    <div key={pid}
                      style={{
                        textAlign: "left",
                        background: disabled ? "transparent" : C.panelHi,
                        border: `1px solid ${possible && sel ? C.brass : C.line}`,
                        opacity: sel && !possible ? 0.35 : 1,
                        color: C.ivory, borderRadius: 4, padding: "7px 9px", fontSize: 13,
                      }}>
                      <span style={{ color: possible && sel ? C.brass : C.ivory }}>{p.name}</span>
                      <span style={{ fontSize: 10, color: C.dim, marginLeft: 5 }}>Lv{lv}</span>
                      {r && (r.minLv || 1) >= 2 && (
                        <span style={{ fontSize: 10, marginLeft: 5, padding: "0 4px", borderRadius: 3, border: `1px solid ${lvOk ? C.line : C.red}`, color: lvOk ? C.dim : C.red, whiteSpace: "nowrap" }}>要Lv{r.minLv}</span>
                      )}
                      {sel && possible && p.needs && (
                        <div style={{ fontSize: 10, color: (g.inv[p.needs] || 0) > 0 ? C.glass : C.red, marginTop: 2 }}>要 {itemIcon(p.needs)}{itemName(p.needs)}(所持{g.inv[p.needs] || 0})</div>
                      )}
                      {/* 素材未選択のあいだは説明を畳み、一画面に収める */}
                      {sel && (
                        <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>
                          {!possible ? "この素材には合わないようだ"
                            : !lvOk ? `熟練が足りない — ${p.name}Lv${r.minLv}になれば、何かできそうだ`
                            : known ? `→ ${SPECIMENS[r.to].icon} ${SPECIMENS[r.to].name}(基準 ${round5(basePrice(g, r.to))}G)`
                            : "→ ??? 何ができるかは、やってみないと分からない"}
                        </div>
                      )}
                      {sel && possible && (
                        <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
                          <Btn primary={!disabled} disabled={disabled} onClick={() => doCraft(r, 1)} style={{ fontSize: 12, padding: "5px 10px", whiteSpace: "nowrap" }}>仕立てる</Btn>
                          {/* Lv3特典は到達するまで見せない(未解放要素を明かさない) */}
                          {lv >= 3 && (
                            <Btn disabled={!canDouble} onClick={() => doCraft(r, 2)} style={{ fontSize: 12, padding: "5px 10px", whiteSpace: "nowrap" }}>2個仕立てる</Btn>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Panel>

            {g.craftLog.length > 0 && (
              <Panel style={{ background: "transparent" }}>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 4 }}>今日の仕事</div>
                {g.craftLog.map((l, i) => <div key={i} style={{ fontSize: 12, color: l.isNew ? C.brass : C.ivory, lineHeight: 1.8 }}>{l.text}</div>)}
              </Panel>
            )}
          </div>
        )}

        {/* ===== 夕(陳列) ===== */}
        {g.phase === "shelf" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 12, color: C.dim }}>硝子棚に並べる。同じ分類を隣り合わせると値打ちが上がり、良い組み合わせには銘板が掲がる。</div>

            <div style={{ background: "#171310", border: `2px solid ${C.line}`, borderRadius: 8, padding: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {g.shelf.map((id, i) => {
                  if (i >= 9) return null;
                  const locked = i >= g.shelfSize;
                  if (locked && i >= Math.max(6, g.shelfSize)) {
                    // 3行目はサイズが7以上のときだけ枠を見せる
                    if (g.shelfSize <= 6 && i >= 6) return null;
                  }
                  if (locked) return (
                    <div key={i} style={{ minHeight: 92, border: `1px dashed ${C.line}`, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#5a4f3d" }}>増設で解放</div>
                  );
                  const bonus = adjBonus(g.shelf, i, g.shelfSize);
                  const inSet = curSets.some((s) => s.members.includes(id));
                  return (
                    <button key={i} onClick={() => setShelfPickFor(shelfPickFor === i ? null : i)}
                      style={{
                        fontFamily: "inherit", cursor: "pointer", minHeight: 92,
                        background: shelfPickFor === i ? "#2e2618" : "rgba(127,160,122,0.06)",
                        border: `1px solid ${shelfPickFor === i ? C.brass : inSet ? C.brass : "rgba(127,160,122,0.35)"}`,
                        borderRadius: 5, color: C.ivory, padding: 6,
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                      }}>
                      {id ? (
                        <>
                          <SpecIcon id={id} fileImgs={fileImgs} size={40} emojiSize={24} />
                          <div style={{ fontSize: 10, textAlign: "center", lineHeight: 1.3 }}>{SPECIMENS[id].name}</div>
                          <div style={{ fontSize: 11, color: inSet ? C.brass : bonus ? C.glass : C.brass, borderTop: `1px solid ${C.line}`, paddingTop: 2, width: "100%", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
                            {shelfPrice(g, i, curSets)}G{inSet ? " ✦" : bonus ? " ↑" : ""}
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: 11, color: C.dim }}>空き棚</div>
                      )}
                    </button>
                  );
                })}
              </div>
              {curSets.length > 0 && (
                <div style={{ marginTop: 8, borderTop: `1px solid ${C.line}`, paddingTop: 6, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {curSets.map((s) => (
                    <span key={s.id} style={{ fontSize: 11, color: C.brass, border: `1px solid ${C.brass}`, borderRadius: 3, padding: "1px 7px" }}>
                      ✦ {s.name}{s.invite !== "collector" ? ` — ${CUSTOMERS.find((c) => c.id === s.invite).name}を呼ぶ` : " — 夜の気配"}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {shelfPickFor !== null && (
              <Panel>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 6 }}>棚 {shelfPickFor + 1} に置くもの</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {g.shelf[shelfPickFor] && <Btn onClick={() => placeOnShelf(shelfPickFor, null)} style={{ fontSize: 12 }}>下げる</Btn>}
                  {specEntries.map(([k, v]) => {
                    const mk = nextMark(k);
                    return (
                      <Btn key={k} onClick={() => placeOnShelf(shelfPickFor, k)} style={{ fontSize: 12 }}>
                        <SpecIcon id={k} fileImgs={fileImgs} size={18} emojiSize={13} /> {SPECIMENS[k].name} ×{v}
                        {SPECIMENS[k].tags.map((t) => <TagChip key={t} t={t} />)}
                        {mk && <span style={{ color: C.glass, marginLeft: 4 }}>{mk}</span>}
                      </Btn>
                    );
                  })}
                  {!specEntries.length && !g.shelf[shelfPickFor] && <span style={{ fontSize: 12, color: C.dim }}>在庫がない。工房で仕立てよう。</span>}
                </div>
              </Panel>
            )}

            <Panel>
              <div style={{ fontSize: 11, color: C.dim, marginBottom: 6 }}>今夜の値付け</div>
              <div style={{ display: "flex", gap: 6 }}>
                {Object.entries(PRICE_MODES).map(([k, m]) => (
                  <button key={k} onClick={() => setG({ ...g, priceMode: k })}
                    style={{
                      flex: 1, fontFamily: "inherit", cursor: "pointer", padding: "7px 4px", borderRadius: 4, fontSize: 13,
                      background: g.priceMode === k ? C.brass : C.panelHi, color: g.priceMode === k ? "#1a140c" : C.ivory,
                      border: `1px solid ${g.priceMode === k ? C.brass : C.line}`,
                    }}>{m.name}</button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: C.dim, marginTop: 5 }}>{PRICE_MODES[g.priceMode].desc}</div>
            </Panel>
          </div>
        )}

        {/* ===== 夜 ===== */}
        {g.phase === "night" && nightInCards && (() => {
          const l = nightCust[nightView.idx];
          const cust = CUSTOMERS.find((c) => c.id === l.cid);
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: 11, color: C.dim, letterSpacing: "0.2em" }}>本日の営業</div>
                <div style={{ fontSize: 11, color: C.dim, fontVariantNumeric: "tabular-nums" }}>{nightView.idx + 1} / {nightCust.length} 組</div>
              </div>
              <div onClick={nightAdvance} style={{ cursor: "pointer" }}>
                <Panel style={l.big ? { borderColor: "#e0b96a", boxShadow: "0 0 14px rgba(201,161,94,0.15)" } : null}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <FramedPortrait cid={l.cid} imgs={imgs} fileImgs={fileImgs} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, letterSpacing: "0.1em", marginBottom: 6 }}>{cust ? cust.name : ""}</div>
                      <div style={{ fontSize: 13, lineHeight: 1.9, color: l.line ? C.ivory : C.dim }}>
                        {l.line ? `「${l.line}」` : l.text}
                      </div>
                      {l.sub && <div style={{ fontSize: 12, lineHeight: 1.8, color: C.dim, marginTop: 6 }}>{l.sub}</div>}
                    </div>
                  </div>
                  {l.t === "sale" && (
                    <div style={{ marginTop: 10, borderTop: `1px solid ${C.line}`, paddingTop: 8, display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                      <SpecIcon id={l.itemId} fileImgs={fileImgs} size={26} emojiSize={16} />
                      <span>{SPECIMENS[l.itemId].name}</span>
                      <span style={{ marginLeft: "auto", color: C.brass, fontVariantNumeric: "tabular-nums" }}>{l.price} G</span>
                    </div>
                  )}
                </Panel>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn onClick={nightCollapse} style={{ fontSize: 12 }}>残りをまとめる</Btn>
                <Btn primary onClick={nightAdvance} style={{ marginLeft: "auto" }}>次へ →</Btn>
              </div>
            </div>
          );
        })()}
        {g.phase === "night" && !nightInCards && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {nightView.collapsed && nightCust.slice(nightView.idx).length > 0 && (
              <Panel>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 8, letterSpacing: "0.2em" }}>そのあとの客</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {nightCust.slice(nightView.idx).map(nightLogLine)}
                </div>
              </Panel>
            )}
            <Panel>
              <div style={{ fontSize: 11, color: C.dim, marginBottom: 8, letterSpacing: "0.2em" }}>本日の勘定</div>
              {nightSys.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 8 }}>
                  {nightSys.map(nightLogLine)}
                </div>
              )}
              <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 8, fontSize: 14, display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: C.dim }}>本日の売上</span>
                <span style={{ color: C.brass, fontVariantNumeric: "tabular-nums" }}>{g.nightEarn} G</span>
              </div>
            </Panel>

            {/* 蒐集家 */}
            {g.offer && (() => {
              const sp = SPECIMENS[g.offer.specId];
              const base = basePrice(g, g.offer.specId);
              const fair = round5(base * 1.6), high = round5(base * 2.2);
              const trust = g.trust || 0;
              const appearLine = trust <= -2 ? COLLECTOR.appearCold : trust >= 2 ? COLLECTOR.appearWarm : COLLECTOR.appear;
              return (
                <Panel style={{ borderColor: C.night }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <Portrait cid="collector" imgs={imgs} fileImgs={fileImgs} size={40} />
                    <div style={{ fontSize: 12, color: C.night, letterSpacing: "0.15em" }}>閉店後、扉が叩かれた</div>
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.9, color: C.ivory }}>
                    {COLLECTOR.name}「{appearLine}」<br />
                    「{COLLECTOR.want(sp.name)}」
                  </div>
                  <div style={{ fontSize: 11, color: C.dim, margin: "6px 0" }}>{sp.icon} {sp.name}(基準 {round5(base)}G)を望んでいる</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                    <Btn primary onClick={() => resolveOffer("fair")}>言い値で売る {fair}G</Btn>
                    <Btn onClick={() => resolveOffer("high")}>ふっかける {high}G(賭け)</Btn>
                    <Btn onClick={() => resolveOffer("refuse")}>断る</Btn>
                  </div>
                </Panel>
              );
            })()}
            {g.offerResult && (
              <Panel style={{ borderColor: C.night }}>
                <div style={{ fontSize: 13, lineHeight: 1.8, color: C.ivory }}>{g.offerResult}</div>
              </Panel>
            )}

            {!g.ownShop && daysToRent === 1 && <div style={{ fontSize: 12, color: C.red, textAlign: "center" }}>明日は家賃の日({rentFor(g.rep)}G)。</div>}

            {g.day % 30 === 0 && (
              <Panel style={{ borderColor: C.brass }}>
                <div style={{ fontSize: 13, color: C.brass, letterSpacing: "0.2em", marginBottom: 6 }}>{g.day / 30}ヶ月目の記録</div>
                <div style={{ fontSize: 13, lineHeight: 2 }}>
                  累計売上 {g.totalEarn}G / 販売数 {g.totalSold}点<br />
                  図鑑 {knownSpecs.size}/{Object.keys(SPECIMENS).length} 種 / 銘板 {g.knownSets.length}/{SETS.length} / 評判 {g.rep}<br />
                  <span style={{ color: C.dim, fontSize: 12 }}>
                    {g.rep >= 40 ? "この街で知らぬ者のない標本商になった。" : g.rep >= 20 ? "常連のつく、良い店になってきた。" : "まだ小さな店だが、硝子は毎晩磨かれている。"}
                  </span>
                </div>
              </Panel>
            )}
          </div>
        )}

        {/* ===== 図鑑(タブ付き) ===== */}
        {showBook && (
          <div onClick={() => setShowBook(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: C.panel, border: `1px solid ${C.brass}`, borderRadius: 8, padding: 16, maxWidth: 480, width: "100%", maxHeight: "82vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, alignItems: "center" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {[["spec", "標本"], ["plate", "銘板"], ["alias", "通り名"]].map(([k, n]) => (
                    <button key={k} onClick={() => setBookTab(k)}
                      style={{ fontFamily: "inherit", cursor: "pointer", fontSize: 12, padding: "4px 10px", borderRadius: 4, letterSpacing: "0.15em", background: bookTab === k ? C.brass : "transparent", color: bookTab === k ? "#1a140c" : C.dim, border: `1px solid ${bookTab === k ? C.brass : C.line}` }}>{n}</button>
                  ))}
                </div>
                <button onClick={() => setShowBook(false)} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontFamily: "inherit" }}>閉じる</button>
              </div>

              {bookTab === "spec" && (
                <>
                  <div style={{ fontSize: 11, color: C.dim, marginBottom: 8, lineHeight: 1.7 }}>
                    分類(骨格・昆虫・液浸・鉱物・工芸)は棚の並びと銘板に効く。珍・華・学の印は客の好みに効く。
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {Object.entries(SPECIMENS).map(([id, s]) => {
                      const found = knownSpecs.has(id);
                      const recipe = found ? RECIPES.find((r) => r.to === id) : null;
                      return (
                        <div key={id} onClick={() => found && setBookDetail(id)}
                          style={{ border: `1px solid ${C.line}`, borderRadius: 5, padding: 8, opacity: found ? 1 : 0.45, cursor: found ? "pointer" : "default" }}>
                          <div style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}>
                            {found ? <SpecIcon id={id} fileImgs={fileImgs} size={28} emojiSize={13} /> : "▪"} <span>{found ? s.name : "?????"}</span>
                          </div>
                          <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>
                            {found ? <>{CAT_NAME[s.cat]} · {s.price}G{s.tags.map((t) => <TagChip key={t} t={t} />)}</> : "未発見"}
                          </div>
                          {recipe && (
                            <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>
                              仕立て: {PROCESSES[recipe.proc].name}{(recipe.minLv || 1) >= 2 ? ` Lv${recipe.minLv}` : ""}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {bookTab === "plate" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontSize: 11, color: C.dim, marginBottom: 2 }}>良い陳列には銘板が掲がる。対象の売価+20%、決まった客を呼び寄せる。</div>
                  {SETS.map((s) => {
                    const found = g.knownSets.includes(s.id);
                    return (
                      <div key={s.id} style={{ border: `1px solid ${found ? C.brass : C.line}`, borderRadius: 5, padding: 8, opacity: found ? 1 : 0.5 }}>
                        <div style={{ fontSize: 13, color: found ? C.brass : C.ivory }}>✦ {found ? s.name : "?????"}</div>
                        <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{found ? s.desc : "未発見の陳列"}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {bookTab === "alias" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontSize: 11, color: C.dim, marginBottom: 2 }}>売れ筋の分類で、街での呼ばれ方が変わる。名は客層の足を引く。</div>
                  {Object.entries(ALIASES).map(([cat, a]) => {
                    const found = g.aliasHistory.includes(cat);
                    const now = aliasCat === cat;
                    return (
                      <div key={cat} style={{ border: `1px solid ${now ? C.brass : C.line}`, borderRadius: 5, padding: 8, opacity: found ? 1 : 0.5 }}>
                        <div style={{ fontSize: 13 }}>{found ? `『${a.name}』` : "『???』"}{now && <span style={{ fontSize: 10, color: C.brass, marginLeft: 6 }}>いまの通り名</span>}</div>
                        <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{found ? `${CAT_NAME[cat]}の店として知られた証` : `${CAT_NAME[cat]}を売り込めば…`}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== 図鑑の詳細ビュー(発見済み標本のみ) ===== */}
        {showBook && bookDetail && (() => {
          const s = SPECIMENS[bookDetail];
          const recipe = RECIPES.find((r) => r.to === bookDetail);
          const url = fileImgs && fileImgs.specimens && fileImgs.specimens[bookDetail];
          return (
            <div onClick={() => setBookDetail(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 55 }}>
              <div onClick={(e) => e.stopPropagation()} style={{ background: C.panel, border: `1px solid ${C.brass}`, borderRadius: 8, padding: 16, maxWidth: 380, width: "100%", maxHeight: "82vh", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 15, letterSpacing: "0.1em" }}>{s.name}</div>
                  <button onClick={() => setBookDetail(null)} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontFamily: "inherit" }}>閉じる</button>
                </div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                  {url ? (
                    <span style={{ width: "76%", aspectRatio: "1 / 1", borderRadius: 8, overflow: "hidden", display: "block", border: `1px solid ${C.line}` }}>
                      <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transform: `scale(${specTrim(bookDetail)})` }} />
                    </span>
                  ) : (
                    <div style={{ width: "76%", aspectRatio: "1 / 1", borderRadius: 8, border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 72, background: "#171310" }}>{s.icon}</div>
                  )}
                </div>
                <div style={{ fontSize: 12, color: C.dim, textAlign: "center" }}>
                  {CAT_NAME[s.cat]} · {s.price}G{s.tags.map((t) => <TagChip key={t} t={t} />)}
                </div>
                {recipe && (
                  <div style={{ fontSize: 12, color: C.dim, textAlign: "center", marginTop: 4 }}>
                    仕立て: {PROCESSES[recipe.proc].name}{(recipe.minLv || 1) >= 2 ? ` Lv${recipe.minLv}` : ""}
                  </div>
                )}
                {SPEC_LORE[bookDetail] && (
                  <div style={{ fontSize: 13, color: C.ivory, lineHeight: 2, marginTop: 12, borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
                    {SPEC_LORE[bookDetail]}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ===== 調度屋(棚増設・内装) ===== */}
        {showDecor && (
          <div onClick={() => setShowDecor(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: C.panel, border: `1px solid ${C.brass}`, borderRadius: 8, padding: 16, maxWidth: 480, width: "100%", maxHeight: "82vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ letterSpacing: "0.25em", color: C.brass, fontSize: 13 }}>調度屋 — 店の誂え</div>
                <button onClick={() => setShowDecor(false)} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontFamily: "inherit" }}>閉じる</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                {SHELF_EXPAND[g.shelfSize + 1] && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 13 }}>硝子棚の増設({g.shelfSize}→{g.shelfSize + 1}枠)<div style={{ fontSize: 11, color: C.dim }}>大工に頼んで棚を継ぎ足す</div></div>
                    <Btn onClick={expandShelf} disabled={g.gold < SHELF_EXPAND[g.shelfSize + 1]}>{SHELF_EXPAND[g.shelfSize + 1]}G</Btn>
                  </div>
                )}
                {DECOR.map((d) => (
                  <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", opacity: g.decor[d.id] ? 0.55 : 1 }}>
                    <div style={{ fontSize: 13 }}>{d.icon} {d.name}<div style={{ fontSize: 11, color: C.dim }}>{d.desc}</div></div>
                    {g.decor[d.id] ? <span style={{ fontSize: 12, color: C.glass }}>設置済</span> : <Btn onClick={() => buyDecor(d)} disabled={g.gold < d.cost}>{d.cost}G</Btn>}
                  </div>
                ))}
                {g.ownShop ? (
                  <div style={{ fontSize: 12, color: C.dim, borderTop: `1px solid ${C.line}`, paddingTop: 8, marginTop: 2, lineHeight: 1.8 }}>
                    この棚も、壁も、軋む床板も、もう誰のものでもない。
                  </div>
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${C.line}`, paddingTop: 8, marginTop: 2 }}>
                    <div style={{ fontSize: 13 }}>この店の買い取り<div style={{ fontSize: 11, color: C.dim }}>大家から店ごと買い上げる。家賃とはお別れだ</div></div>
                    <Btn onClick={buyShop} disabled={g.gold < SHOP_BUYOUT}>{SHOP_BUYOUT}G</Btn>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== 画廊(画像設定) ===== */}
        {showGallery && (
          <div onClick={() => setShowGallery(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: C.panel, border: `1px solid ${C.brass}`, borderRadius: 8, padding: 16, maxWidth: 480, width: "100%", maxHeight: "82vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ letterSpacing: "0.25em", color: C.brass, fontSize: 13 }}>画廊 — 版画の掛け替え</div>
                <button onClick={() => setShowGallery(false)} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontFamily: "inherit" }}>閉じる</button>
              </div>
              <div style={{ fontSize: 11, color: C.dim, marginBottom: 10, lineHeight: 1.7 }}>
                手持ちの版画(画像)を掛けられる。肖像は円く切り抜かれ、色味は店に合わせて揃えられる。拡大で端の署名も隠せる。
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {IMG_SLOTS.map((slot) => {
                  const meta = imgs[slot.id];
                  return (
                    <div key={slot.id} style={{ border: `1px solid ${C.line}`, borderRadius: 5, padding: 8, display: "flex", gap: 10, alignItems: "center" }}>
                      {slot.wide ? (
                        <span style={{ width: 84, height: 48, borderRadius: 4, overflow: "hidden", background: "#000", flexShrink: 0, border: `1px solid ${C.line}`, display: "inline-block" }}>
                          {shopBg ? <img src={shopBg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "sepia(0.2)" }} /> : null}
                        </span>
                      ) : (
                        <Portrait cid={slot.id} imgs={imgs} fileImgs={fileImgs} size={48} />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13 }}>{slot.name}</div>
                        <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap", alignItems: "center" }}>
                          <label style={{ fontSize: 11, color: C.brass, border: `1px solid ${C.brass}`, borderRadius: 3, padding: "2px 8px", cursor: "pointer" }}>
                            画像を選ぶ
                            <input type="file" accept="image/*" style={{ display: "none" }}
                              onChange={(e) => {
                                const f = e.target.files && e.target.files[0];
                                if (!f) return;
                                const [mw, mh] = slot.wide ? [1000, 640] : [520, 640];
                                resizeImage(f, mw, mh, (data) => {
                                  saveImgs({ ...imgs, [slot.id]: { data, zoom: slot.wide ? 1 : 1.15 } });
                                });
                                e.target.value = "";
                              }} />
                          </label>
                          {meta && meta.data && !slot.wide && (
                            <button onClick={() => {
                              const cur = ZOOMS.indexOf(meta.zoom || 1.15);
                              const nz = ZOOMS[(cur + 1) % ZOOMS.length];
                              saveImgs({ ...imgs, [slot.id]: { ...meta, zoom: nz } });
                            }} style={{ fontFamily: "inherit", fontSize: 11, background: C.panelHi, color: C.ivory, border: `1px solid ${C.line}`, borderRadius: 3, padding: "2px 8px", cursor: "pointer" }}>
                              拡大 ×{meta.zoom || 1.15}
                            </button>
                          )}
                          {meta && meta.data && (
                            <button onClick={() => { const n = { ...imgs }; delete n[slot.id]; saveImgs(n); }}
                              style={{ fontFamily: "inherit", fontSize: 11, background: "none", color: C.dim, border: `1px solid ${C.line}`, borderRadius: 3, padding: "2px 8px", cursor: "pointer" }}>外す</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 12, borderTop: `1px solid ${C.line}`, paddingTop: 8, textAlign: "right" }}>
                <button onClick={resetAll} style={{ background: "none", border: "none", color: "#5a4f3d", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>ゲームをはじめから</button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ===== 画面下端に固定する要素(ルート直下に置き、祖先スタイルの影響を受けないようにする) ===== */}
      {/* 夜のカード送り中の売上累計チップ */}
      {g.phase === "night" && nightInCards && (
        <div style={{ position: "fixed", right: 12, bottom: "calc(70px + env(safe-area-inset-bottom, 0px))", background: "rgba(31,26,19,0.95)", border: `1px solid ${C.brass}`, borderRadius: 4, padding: "5px 10px", fontSize: 12, color: C.brass, fontVariantNumeric: "tabular-nums", zIndex: 40 }}>
          売上 {nightEarnSoFar} G
        </div>
      )}

      {/* 下部バー */}
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, background: "rgba(20,17,13,0.96)", borderTop: `1px solid ${C.line}`, paddingTop: 10, paddingLeft: 10, paddingRight: 10, paddingBottom: "calc(10px + env(safe-area-inset-bottom, 0px))" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", gap: 6, alignItems: "center" }}>
          <Btn onClick={() => { setBookTab("spec"); setBookDetail(null); setShowBook(true); }} style={FOOT_BTN}>図鑑</Btn>
          <Btn onClick={() => setShowGallery(true)} style={FOOT_BTN}>画廊</Btn>
          <Btn onClick={() => setShowDecor(true)} style={FOOT_BTN}>調度屋</Btn>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
            {g.phase === "morning" && <Btn primary onClick={() => { setCaveEvent(null); setG({ ...g, phase: "workshop" }); }} style={FOOT_BTN}>工房へ →</Btn>}
            {g.phase === "workshop" && <Btn primary onClick={() => { setSel(null); setG({ ...g, phase: "shelf" }); }} style={FOOT_BTN}>陳列へ →</Btn>}
            {g.phase === "shelf" && (
              <>
                <Btn onClick={() => setG({ ...g, phase: "workshop" })} disabled={g.ap <= 0} style={FOOT_BTN}>← 工房</Btn>
                <Btn primary onClick={openStore} style={FOOT_BTN}>開店する</Btn>
              </>
            )}
            {g.phase === "night" && <Btn primary onClick={nextDay} disabled={!!g.offer || nightInCards} style={FOOT_BTN}>翌朝へ →</Btn>}
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: "calc(68px + env(safe-area-inset-bottom, 0px))", left: "50%", transform: "translateX(-50%)", background: C.panelHi, border: `1px solid ${C.brass}`, color: C.ivory, borderRadius: 6, padding: "8px 14px", fontSize: 13, zIndex: 60, maxWidth: "90%", boxShadow: "0 4px 18px rgba(0,0,0,0.5)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
