import React, { useState, useEffect, useCallback } from "react";

// ============================================================
// 骨と硝子の店 — Os et Vitrum — v2
// 追加: 銘板セット / 通り名 / 熟練度 / 霧の湿原 / 棚増設・内装
//       外套の蒐集家(交渉) / 常連セリフ / 画像差し替え(画廊)
// ============================================================

const SAVE_KEY = "bone_glass_save_v1";   // v1のセーブを引き継ぐ
const IMG_KEY = "bg_images_v1";

// ---------- 色 ----------
const C = {
  bg: "#14110d", panel: "#1f1a13", panelHi: "#2a2318",
  line: "#4a3b28", brass: "#c9a15e", ivory: "#e8dcc4",
  dim: "#8a7a5f", glass: "#7fa07a", red: "#b06a5a",
  night: "#8fa3b8", // 蒐集家の色
};

// ---------- 素材・資材 ----------
const MATERIALS = {
  tori:    { name: "小鳥の亡骸", icon: "🐦" },
  chou:    { name: "蝶",         icon: "🦋" },
  kabuto:  { name: "甲虫",       icon: "🪲" },
  koke:    { name: "苔",         icon: "🌿" },
  sakana:  { name: "小魚",       icon: "🐟" },
  kai:     { name: "巻貝",       icon: "🐚" },
  kani:    { name: "蟹",         icon: "🦀" },
  kurage:  { name: "海月",       icon: "🪼" },
  koumori: { name: "蝙蝠の亡骸", icon: "🦇" },
  hebi:    { name: "蛇の亡骸",   icon: "🐍" },
  suisho:  { name: "水晶の原石", icon: "💎" },
  ammo:    { name: "アンモナイトの原石", icon: "🌀" },
  kaeru:   { name: "蛙の亡骸",   icon: "🐸" },
  tokage:  { name: "蜥蜴の亡骸", icon: "🦎" },
  ga:      { name: "枯葉蛾",     icon: "🍂" },
  hikarigoke: { name: "夜光苔",  icon: "✨" },
  fukurou: { name: "梟の亡骸",   icon: "🦉" },
  bin:     { name: "硝子瓶",     icon: "🫙", supply: true },
  waku:    { name: "真鍮の額縁", icon: "🖼️", supply: true },
  daiza:   { name: "黒檀の台座", icon: "◼️", supply: true },
};
const MAT_ORDER = ["tori","chou","kabuto","koke","sakana","kai","kani","kurage","koumori","hebi","suisho","ammo","kaeru","tokage","ga","hikarigoke","fukurou","bin","waku","daiza"];

// ---------- 標本 ----------
const CAT_NAME = { bone: "骨格", insect: "昆虫", wet: "液浸", mineral: "鉱物", craft: "工芸" };
const TAG_NAME = { rare: "珍", fancy: "華", scholar: "学" };

const SPECIMENS = {
  s_torikotsu: { name: "小鳥の頭骨",       icon: "🐦", price: 120, cat: "bone",    tags: [] },
  s_zenshin:   { name: "小鳥の全身骨格",   icon: "🦴", price: 360, cat: "bone",    tags: ["rare","scholar"] },
  s_tenshi:    { name: "蝶の展翅標本",     icon: "🦋", price: 100, cat: "insect",  tags: [] },
  s_chougaku:  { name: "蝶の額装標本",     icon: "🖼️", price: 280, cat: "insect",  tags: ["fancy"] },
  s_kabuto:    { name: "甲虫の乾燥標本",   icon: "🪲", price: 90,  cat: "insect",  tags: [] },
  s_kabutogaku:{ name: "甲虫の額装標本",   icon: "🖼️", price: 240, cat: "insect",  tags: ["fancy"] },
  s_terra:     { name: "苔のテラリウム",   icon: "🌿", price: 160, cat: "craft",   tags: ["fancy"] },
  s_gyoshin:   { name: "魚の液浸標本",     icon: "🐟", price: 130, cat: "wet",     tags: [] },
  s_kuragebin: { name: "海月の液浸標本",   icon: "🪼", price: 300, cat: "wet",     tags: ["rare"] },
  s_kaimigaki: { name: "磨き上げた貝殻",   icon: "🐚", price: 80,  cat: "mineral", tags: [] },
  s_kani:      { name: "蟹の乾燥標本",     icon: "🦀", price: 140, cat: "craft",   tags: [] },
  s_koumori:   { name: "蝙蝠の骨格標本",   icon: "🦇", price: 320, cat: "bone",    tags: ["rare","scholar"] },
  s_hebibin:   { name: "蛇の液浸標本",     icon: "🐍", price: 260, cat: "wet",     tags: ["rare"] },
  s_hebikotsu: { name: "蛇の脊椎骨標本",   icon: "🦴", price: 200, cat: "bone",    tags: ["scholar"] },
  s_suisho:    { name: "水晶のクラスター", icon: "💎", price: 180, cat: "mineral", tags: ["fancy"] },
  s_ammo:      { name: "アンモナイトの化石", icon: "🌀", price: 220, cat: "mineral", tags: ["scholar"] },
  // --- v2 追加(湿原・熟練) ---
  s_kaerubin:  { name: "蛙の液浸標本",     icon: "🐸", price: 140, cat: "wet",     tags: [] },
  s_kaerukotsu:{ name: "蛙の骨格標本",     icon: "🦴", price: 190, cat: "bone",    tags: ["scholar"] },
  s_tokagebin: { name: "蜥蜴の液浸標本",   icon: "🦎", price: 210, cat: "wet",     tags: ["rare"] },
  s_ga:        { name: "枯葉蛾の展翅標本", icon: "🍂", price: 110, cat: "insect",  tags: [] },
  s_gagaku:    { name: "枯葉蛾の額装標本", icon: "🖼️", price: 270, cat: "insect",  tags: ["fancy","rare"] },
  s_fukuroukotsu:{ name: "梟の頭骨",       icon: "🦉", price: 340, cat: "bone",    tags: ["rare","scholar"] },
  s_fukurouzen:{ name: "梟の全身骨格",     icon: "🦉", price: 620, cat: "bone",    tags: ["rare","scholar"] },
  s_hikariterra:{ name: "光る苔のテラリウム", icon: "✨", price: 300, cat: "craft", tags: ["fancy","rare"] },
  s_kaigaku:   { name: "貝殻の額装標本",   icon: "🖼️", price: 190, cat: "mineral", tags: ["fancy"] },
  s_kanikoura: { name: "磨き上げた甲羅",   icon: "🦀", price: 130, cat: "mineral", tags: [] },
};

// ---------- 処理法 ----------
const PROCESSES = {
  boil:     { name: "煮沸洗浄", desc: "亡骸を煮て、骨だけを取り出す" },
  dry:      { name: "乾燥展翅", desc: "形を整え、静かに乾かす" },
  preserve: { name: "硝子封入", desc: "硝子瓶に封じて保存する", needs: "bin" },
  frame:    { name: "額装",     desc: "額縁に収めて飾り立てる", needs: "waku" },
  polish:   { name: "研磨",     desc: "磨き上げて輝きを出す" },
  assemble: { name: "組立",     desc: "台座の上に骨を組み上げる", needs: "daiza" },
};
const procLevel = (exp) => (exp >= 12 ? 3 : exp >= 4 ? 2 : 1);

// ---------- レシピ (minLv: 必要熟練) ----------
const RECIPES = [
  { id: "r01", from: "tori",        proc: "boil",     to: "s_torikotsu" },
  { id: "r02", from: "s_torikotsu", proc: "assemble", to: "s_zenshin" },
  { id: "r03", from: "chou",        proc: "dry",      to: "s_tenshi" },
  { id: "r04", from: "s_tenshi",    proc: "frame",    to: "s_chougaku" },
  { id: "r05", from: "kabuto",      proc: "dry",      to: "s_kabuto" },
  { id: "r06", from: "s_kabuto",    proc: "frame",    to: "s_kabutogaku" },
  { id: "r07", from: "koke",        proc: "preserve", to: "s_terra" },
  { id: "r08", from: "sakana",      proc: "preserve", to: "s_gyoshin" },
  { id: "r09", from: "kurage",      proc: "preserve", to: "s_kuragebin" },
  { id: "r10", from: "kai",         proc: "polish",   to: "s_kaimigaki" },
  { id: "r11", from: "kani",        proc: "dry",      to: "s_kani" },
  { id: "r12", from: "koumori",     proc: "boil",     to: "s_koumori" },
  { id: "r13", from: "hebi",        proc: "preserve", to: "s_hebibin" },
  { id: "r14", from: "hebi",        proc: "boil",     to: "s_hebikotsu" },
  { id: "r15", from: "suisho",      proc: "polish",   to: "s_suisho" },
  { id: "r16", from: "ammo",        proc: "polish",   to: "s_ammo" },
  // --- v2 ---
  { id: "r17", from: "kaeru",       proc: "preserve", to: "s_kaerubin" },
  { id: "r18", from: "kaeru",       proc: "boil",     to: "s_kaerukotsu", minLv: 2 },
  { id: "r19", from: "tokage",      proc: "preserve", to: "s_tokagebin" },
  { id: "r20", from: "ga",          proc: "dry",      to: "s_ga" },
  { id: "r21", from: "s_ga",        proc: "frame",    to: "s_gagaku",     minLv: 2 },
  { id: "r22", from: "fukurou",     proc: "boil",     to: "s_fukuroukotsu", minLv: 2 },
  { id: "r23", from: "s_fukuroukotsu", proc: "assemble", to: "s_fukurouzen", minLv: 2 },
  { id: "r24", from: "hikarigoke",  proc: "preserve", to: "s_hikariterra", minLv: 2 },
  { id: "r25", from: "s_kaimigaki", proc: "frame",    to: "s_kaigaku",    minLv: 2 },
  { id: "r26", from: "kani",        proc: "polish",   to: "s_kanikoura",  minLv: 2 },
];
// 標本 → 最終工程(熟練Lv3の売価ボーナス用)
const SPEC_PROC = {};
RECIPES.forEach((r) => { SPEC_PROC[r.to] = r.proc; });
// 二次加工が存在する品(from側に立つ標本)
const SECONDARY = {};
RECIPES.forEach((r) => { if (SPECIMENS[r.from]) SECONDARY[r.from] = r.id; });

// ---------- 採集地 ----------
const SITES = [
  { id: "mori",  name: "近くの森", cost: 40, desc: "鳥・虫・苔。手堅い採集地",
    table: [ ["tori", 3], ["chou", 4], ["kabuto", 4], ["koke", 3] ] },
  { id: "umibe", name: "入り江", cost: 50, desc: "魚・貝・蟹。稀に海月",
    table: [ ["sakana", 4], ["kai", 4], ["kani", 3], ["kurage", 1] ] },
  { id: "doukutsu", name: "石灰洞窟", cost: 85, desc: "蝙蝠・蛇・鉱石。費用は嵩む",
    table: [ ["koumori", 2], ["hebi", 3], ["suisho", 3], ["ammo", 2] ] },
  { id: "shitsugen", name: "霧の湿原", cost: 150, minRep: 10, desc: "蛙・蜥蜴・蛾、稀に梟。遠出になる",
    table: [ ["kaeru", 3], ["tokage", 3], ["ga", 3], ["hikarigoke", 2], ["fukurou", 1] ] },
];

const SUPPLY_SHOP = [
  { id: "bin", cost: 25 }, { id: "waku", cost: 45 }, { id: "daiza", cost: 55 },
];

// ---------- 店の設え ----------
const SHELF_EXPAND = { 7: 800, 8: 1200, 9: 1800 };
const DECOR = [
  { id: "lamp",   name: "真鍮の吊りランプ", icon: "🕯️", cost: 600,  desc: "店先が明るくなり、客足が増す(来客+1)" },
  { id: "velvet", name: "天鵞絨の敷布",     icon: "🟥", cost: 900,  desc: "華やかな品が映える(華タグの売価+10%)" },
  { id: "window", name: "大硝子窓",         icon: "🪟", cost: 1500, desc: "往来から棚が見える(購入率+5%)" },
];

// ---------- 客 ----------
const CUSTOMERS = [
  { id: "gakusei", name: "学生", icon: "📓", minRep: 0, budget: 150, weight: 4, easyBuyer: true,
    likesTags: [], likesCats: [],
    lines: {
      buy: ["小遣いで買えるのを探してて…", "レポートの資料にしたいんです", "ここ、落ち着きますね"],
      regular: ["また来ちゃいました", "先生に自慢したら羨ましがられました"],
      friend: ["この店で買った頭骨、下宿の机に置いてます", "就職したら、大きいのを買いに来ますから"],
      pass: ["……今月は下宿代が。また来ます", "うう、悩む。悩んで、帰ります"],
      poor: ["桁がひとつ違うや……見てるだけでも楽しいけど"],
      big: ["一世一代の買い物です!"],
    } },
  { id: "gakusha", name: "老学者", icon: "🧐", minRep: 8, budget: 420, weight: 3,
    likesTags: ["scholar"], likesCats: ["bone", "mineral"],
    lines: {
      buy: ["ふむ、保存状態がよろしい", "研究室に置きたい", "この骨の並び…実に正確だ"],
      regular: ["君の仕事は信用できる", "弟子にもこの店を教えた"],
      friend: ["論文の謝辞に店の名を書いておいたよ", "君は良い標本師になったな"],
      pass: ["うちの研究室に既にあるのでな", "分類に少々疑問が残る。出直そう"],
      poor: ["研究費の申請が通ってからだ……"],
      big: ["これは学術的発見に等しい"],
    } },
  { id: "koujika", name: "好事家", icon: "🎩", minRep: 16, budget: 520, weight: 3,
    likesTags: ["rare"], likesCats: [],
    lines: {
      buy: ["珍しいものはあるかね", "よそでは見ない品だ", "私の部屋に飾るとしよう"],
      regular: ["今夜も掘り出し物の匂いがする", "友人には教えたくない店だ"],
      friend: ["私の蒐集室の半分は、この店の品だよ"],
      pass: ["ふむ……本物かね? いや、疑って悪かった", "今宵は心が動かなかった"],
      poor: ["金貨が足りん。屋敷から取ってくるべきだったか"],
      big: ["この出会いに乾杯したい気分だ"],
    } },
  { id: "kifujin", name: "貴婦人", icon: "🪞", minRep: 26, budget: 650, weight: 2,
    likesTags: ["fancy"], likesCats: [],
    lines: {
      buy: ["あら、綺麗…", "客間に映えそうだわ", "包んでちょうだい"],
      regular: ["お友達にもこの店を教えましたのよ", "あなたの棚は、いつ見ても素敵"],
      friend: ["主人には内緒の楽しみですの"],
      pass: ["素敵だけど、客間には少し大きすぎるわね", "今日は見に来ただけですの"],
      poor: ["あら……お財布を忘れてきたみたい"],
      big: ["今夜の夜会で自慢しますわ"],
    } },
];

const COLLECTOR = {
  id: "collector", name: "外套の蒐集家", icon: "🕯️",
  appear: "……夜分に失礼。硝子の光が見えたものでね。",
  want: (n) => `その『${n}』……私の許でこそ、あれは意味を持つ。`,
  dealFair: "賢明だ。……良い夜を。",
  dealHigh: "ふ……面白い店主だ。払おう。",
  dealFail: "……欲をかいたな。縁がなかった。",
  refuse: "……そうか。気が変わったら、灯りを点けておくといい。",
};

// ---------- 銘板セット ----------
const SETS = [
  { id: "set_bird",  name: "鳥類学の棚", groups: [["s_torikotsu"], ["s_zenshin"]], invite: "gakusha",
    desc: "頭骨と全身骨格を並べて" },
  { id: "set_wing",  name: "鱗翅と鞘翅", groups: [["s_chougaku"], ["s_kabutogaku"]], invite: "kifujin",
    desc: "蝶と甲虫、二つの額装" },
  { id: "set_snake", name: "蛇の二態",   groups: [["s_hebibin"], ["s_hebikotsu"]], invite: "koujika",
    desc: "同じ蛇の、二つの姿" },
  { id: "set_aqua",  name: "硝子の水槽", cat: "wet", count: 3, invite: "koujika",
    desc: "液浸標本を三点" },
  { id: "set_earth", name: "大地の記憶", groups: [["s_ammo"], ["s_suisho"]], invite: "gakusha",
    desc: "化石と結晶を並べて" },
  { id: "set_bones", name: "骸の行進",   cat: "bone", count: 3, invite: "koujika",
    desc: "骨格標本を三点" },
  { id: "set_garden",name: "匣の庭",     groups: [["s_terra", "s_hikariterra"], ["s_tenshi", "s_kabuto", "s_ga"]], invite: "gakusei",
    desc: "緑の匣と、乾いた虫" },
  { id: "set_night", name: "夜の帳",     groups: [["s_fukuroukotsu", "s_fukurouzen"], ["s_koumori", "s_ga", "s_gagaku"]], invite: "collector",
    desc: "夜の住人たちを並べて" },
];

// ---------- 通り名 ----------
const ALIASES = {
  bone:    { name: "骸骨堂", invite: ["gakusha"] },
  insect:  { name: "胡蝶堂", invite: ["kifujin"] },
  wet:     { name: "玻璃堂", invite: ["koujika"] },
  mineral: { name: "星石堂", invite: ["gakusha", "koujika"] },
  craft:   { name: "匣庭堂", invite: ["gakusei"] },
};

const PRICE_MODES = {
  strong:   { name: "強気", mult: 1.3, buy: 0.72, repBonus: 0, desc: "売価+30%・客足は鈍る" },
  normal:   { name: "標準", mult: 1.0, buy: 1.0,  repBonus: 0, desc: "基準の値付け" },
  discount: { name: "勉強", mult: 0.8, buy: 1.25, repBonus: 1, desc: "売価-20%・売れやすく評判も上がる" },
};

const RENT = 100, RENT_INTERVAL = 7, MAX_AP = 3;

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
  };
}
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
  return bestN >= 5 ? best : null;
}
function custLine(c, bought, kind) {
  const L = c.lines;
  if (kind === "buy") {
    let pool = [...L.buy];
    if (bought >= 8 && L.friend) pool = [...pool, ...L.friend, ...L.friend];
    else if (bought >= 3 && L.regular) pool = [...pool, ...L.regular, ...L.regular];
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

  let visitors = Math.min(10, 2 + Math.floor(g.rep / 8) + (g.decor.lamp ? 1 : 0) + (Math.random() < 0.5 ? 1 : 0));
  const aliasCat = aliasOf(g.soldByCat);
  const pool = CUSTOMERS.filter((c) => g.rep >= c.minRep).map((c) => {
    let w = c.weight;
    if (aliasCat && ALIASES[aliasCat].invite.includes(c.id)) w += 2;
    if (sets.some((s) => s.invite === c.id)) w += 2;
    return [c, w];
  });

  const priceAt = (i) => {
    let p = basePrice(g, shelf[i]) * mode.mult;
    if (adjBonus(shelf, i, g.shelfSize)) p *= 1.15;
    if (sets.some((s) => s.members.includes(shelf[i]))) p *= 1.20;
    return round5(p);
  };

  for (let v = 0; v < visitors; v++) {
    const c = weightedPick(pool);
    const bought = custBought[c.id] || 0;
    const slots = shelf.map((id, i) => ({ id, i })).filter((s) => s.id && s.i < g.shelfSize);
    if (!slots.length) { log.push({ t: "misc", cid: c.id, text: `${c.name}が覗いたが、棚は空だった。` }); continue; }

    const afford = slots.filter((s) => priceAt(s.i) <= c.budget);
    if (!afford.length) {
      log.push({ t: "misc", cid: c.id, text: `${c.name}「${custLine(c, bought, "poor")}」` });
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
      log.push({ t: "sale", cid: c.id, big, text: `${c.name}「${line}」— ${sp.icon} ${sp.name}を ${price}G で購入。` });
    } else {
      log.push({ t: "misc", cid: c.id, text: `${c.name}「${custLine(c, bought, "pass")}」` });
    }
  }
  if (!visitors) log.push({ t: "misc", text: "今夜は誰も来なかった。硝子が静かに光っている。" });

  let rentText = null;
  if (g.day % RENT_INTERVAL === 0) { gold -= RENT; rentText = `大家が来た。家賃 ${RENT}G を支払った。`; }

  // 蒐集家の来訪判定
  let offer = null;
  if (g.rep >= 18 && (g.collectorCd || 0) <= 0) {
    const nightSet = sets.some((s) => s.id === "set_night");
    if (Math.random() < 0.22 + (nightSet ? 0.15 : 0)) {
      const shelfRares = shelf.map((id, i) => ({ id, i })).filter((s) => s.id && s.i < g.shelfSize && SPECIMENS[s.id].tags.includes("rare"));
      const stockRares = Object.keys(g.spec).filter((k) => g.spec[k] > 0 && SPECIMENS[k].tags.includes("rare"));
      if (shelfRares.length) { const t = pick(shelfRares); offer = { specId: t.id, source: "shelf", slot: t.i }; }
      else if (stockRares.length) { offer = { specId: pick(stockRares), source: "stock" }; }
    }
  }
  return { log, gold, rep, sold, rentText, shelf, soldByCat, custBought, offer };
}

// ---------- 画像 ----------
const IMG_SLOTS = [
  { id: "shop",      name: "店内観(タイトル背景)", wide: true },
  { id: "gakusei",   name: "学生" },
  { id: "gakusha",   name: "老学者" },
  { id: "koujika",   name: "好事家" },
  { id: "kifujin",   name: "貴婦人" },
  { id: "collector", name: "外套の蒐集家" },
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
const Portrait = ({ cid, imgs, size = 34 }) => {
  const meta = imgs && imgs[cid];
  const fb = cid === "collector" ? COLLECTOR.icon : (CUSTOMERS.find((c) => c.id === cid) || {}).icon || "·";
  if (!meta || !meta.data) return <span style={{ fontSize: Math.round(size * 0.62), width: size, textAlign: "center", flexShrink: 0 }}>{fb}</span>;
  return (
    <span style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", display: "inline-block", border: `1px solid ${C.line}`, flexShrink: 0, background: "#000" }}>
      <img src={meta.data} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${meta.zoom || 1.15})`, filter: "sepia(0.3) contrast(1.05) brightness(0.98)" }} />
    </span>
  );
};

// ============================================================
// メイン
// ============================================================
export default function BoneAndGlass() {
  const [screen, setScreen] = useState("loading");
  const [hasSave, setHasSave] = useState(false);
  const [g, setG] = useState(newGame);
  const [imgs, setImgs] = useState({});
  const [sel, setSel] = useState(null);
  const [shelfPickFor, setShelfPickFor] = useState(null);
  const [showBook, setShowBook] = useState(false);
  const [bookTab, setBookTab] = useState("spec");
  const [showGallery, setShowGallery] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    (async () => {
      try { const r = await window.storage.get(SAVE_KEY); if (r && r.value) setHasSave(true); } catch (e) {}
      try { const r = await window.storage.get(IMG_KEY); if (r && r.value) setImgs(JSON.parse(r.value)); } catch (e) {}
      setScreen("title");
    })();
  }, []);

  const save = useCallback(async (state) => {
    try { await window.storage.set(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
  }, []);
  const saveImgs = async (next) => {
    setImgs(next);
    try { await window.storage.set(IMG_KEY, JSON.stringify(next)); } catch (e) { flash("画像の保存に失敗した…容量かも"); }
  };

  const loadSave = async () => {
    try {
      const r = await window.storage.get(SAVE_KEY);
      if (r && r.value) { setG(migrate(JSON.parse(r.value))); setScreen("game"); }
    } catch (e) { setToast("記録が読み込めなかった…"); }
  };
  const startNew = async () => {
    const ng = newGame(); setG(ng); setScreen("game");
    try { await window.storage.set(SAVE_KEY, JSON.stringify(ng)); } catch (e) {}
  };
  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2400); };

  // ---- 朝 ----
  const gather = (site) => {
    if (g.gold < site.cost) return flash("お金が足りない");
    const got = {};
    for (let i = 0; i < 3; i++) { const m = weightedPick(site.table); got[m] = (got[m] || 0) + 1; }
    const inv = { ...g.inv };
    Object.entries(got).forEach(([k, v]) => (inv[k] = (inv[k] || 0) + v));
    setG({ ...g, gold: g.gold - site.cost, inv });
    flash("入手: " + Object.entries(got).map(([k, v]) => `${itemIcon(k)}${itemName(k)}×${v}`).join("、"));
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

  // ---- 昼 ----
  const craftables = (id) => RECIPES.filter((r) => r.from === id);
  const doCraft = (r) => {
    if (g.ap <= 0) return flash("今日の作業はもう終わり");
    const p = PROCESSES[r.proc];
    const inv = { ...g.inv }; const spec = { ...g.spec };
    if (SPECIMENS[r.from]) { spec[r.from] -= 1; if (spec[r.from] <= 0) delete spec[r.from]; }
    else { inv[r.from] -= 1; if (inv[r.from] <= 0) delete inv[r.from]; }
    if (p.needs) { inv[p.needs] -= 1; if (inv[p.needs] <= 0) delete inv[p.needs]; }
    spec[r.to] = (spec[r.to] || 0) + 1;
    const isNew = !g.known.includes(r.id);
    const known = isNew ? [...g.known, r.id] : g.known;
    const exp = { ...g.procExp, [r.proc]: (g.procExp[r.proc] || 0) + 1 };
    const lvUp = procLevel(exp[r.proc]) > procLevel(g.procExp[r.proc] || 0);
    const made = SPECIMENS[r.to];
    const craftLog = [{ text: `${p.name} → ${made.icon} ${made.name}${isNew ? "(新発見!)" : ""}`, isNew }, ...g.craftLog].slice(0, 6);
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
    if (res.rentText) log.push({ t: "rent", text: res.rentText });
    // 通り名の変化
    const oldAlias = aliasOf(g.soldByCat), newAlias = aliasOf(res.soldByCat);
    let aliasHistory = g.aliasHistory;
    if (newAlias && newAlias !== oldAlias) {
      const nm = ALIASES[newAlias].name;
      log.push({ t: "alias", text: `街の噂 — この店は『${nm}』と呼ばれはじめた。` });
      if (!aliasHistory.includes(newAlias)) aliasHistory = [...aliasHistory, newAlias];
    }
    setG({
      ...g, phase: "night", shelf: res.shelf,
      gold: g.gold + res.gold, rep: g.rep + res.rep,
      nightLog: log, nightEarn: res.gold, nightRent: res.rentText,
      totalEarn: g.totalEarn + Math.max(0, res.gold), totalSold: g.totalSold + res.sold,
      soldByCat: res.soldByCat, custBought: res.custBought,
      alias: newAlias, aliasHistory,
      offer: res.offer, offerResult: null,
    });
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
        offer: null, offerResult: `${sp.name}を ${fair}G で譲った。蒐集家「${COLLECTOR.dealFair}」`, collectorCd: 2 });
    } else if (choice === "high") {
      if (Math.random() < 0.6) {
        const st = removeItem(g);
        setG({ ...st, gold: st.gold + high, rep: st.rep + 2, nightEarn: st.nightEarn + high, totalEarn: st.totalEarn + high, totalSold: st.totalSold + 1,
          offer: null, offerResult: `強気の値をつけた……通った。${sp.name}を ${high}G で売却。蒐集家「${COLLECTOR.dealHigh}」`, collectorCd: 2 });
      } else {
        setG({ ...g, offer: null, offerResult: `強気の値をつけた……蒐集家「${COLLECTOR.dealFail}」外套が夜に溶けていった。`, collectorCd: 4 });
      }
    } else {
      setG({ ...g, offer: null, offerResult: `断った。蒐集家「${COLLECTOR.refuse}」`, collectorCd: 1 });
    }
  };

  // ---- 翌朝 ----
  const nextDay = () => {
    const ng = {
      ...g, day: g.day + 1, phase: "morning", ap: MAX_AP,
      nightLog: [], nightRent: null, craftLog: [], offer: null, offerResult: null,
      collectorCd: Math.max(0, (g.collectorCd || 0) - 1),
    };
    setG(ng); save(ng);
  };

  const resetAll = async () => {
    if (!window.confirm("記録を消して最初からはじめる?(画像は残ります)")) return;
    try { await window.storage.delete(SAVE_KEY); } catch (e) {}
    startNew();
  };

  // ============================================================
  if (screen === "loading") return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.dim, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, 'Yu Mincho', serif" }}>
      店の鍵を開けています…
    </div>
  );

  if (screen === "title") return (
    <div style={{ minHeight: "100vh", background: C.bg, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, 'Yu Mincho', serif", padding: 24, overflow: "hidden" }}>
      {imgs.shop && imgs.shop.data && (
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${imgs.shop.data})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.35, filter: "sepia(0.2) brightness(0.8)" }} />
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
  const aliasCat = aliasOf(g.soldByCat);

  // 二次加工マーク: '⚒'=発見済みの次加工あり '?'=未知の次加工あり
  const nextMark = (specId) => {
    const rid = SECONDARY[specId]; if (!rid) return null;
    return g.known.includes(rid) ? "⚒" : "?";
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.ivory, fontFamily: "Georgia, 'Yu Mincho', serif" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "12px 12px 96px" }}>

        {/* ヘッダー */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: `1px solid ${C.line}`, paddingBottom: 8, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.3em", color: C.dim }}>
              骨と硝子の店{aliasCat && <span style={{ color: C.brass }}> — 人呼んで『{ALIASES[aliasCat].name}』</span>}
            </div>
            <div style={{ fontSize: 16, letterSpacing: "0.1em" }}>{g.day}日目 <span style={{ color: C.brass }}>{PHASE_LABEL[g.phase]}</span></div>
          </div>
          <div style={{ textAlign: "right", fontSize: 13 }}>
            <div style={{ color: g.gold < 0 ? C.red : C.brass, fontVariantNumeric: "tabular-nums" }}>{g.gold} G{g.gold < 0 ? "(借金)" : ""}</div>
            <div style={{ color: C.dim }}>評判 {g.rep} · <span style={{ color: daysToRent === 0 ? C.red : C.dim }}>{daysToRent === 0 ? "今夜家賃" : `家賃まで${daysToRent}日`}</span></div>
          </div>
        </div>

        {/* ===== 朝 ===== */}
        {g.phase === "morning" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.8 }}>夜のうちに届いた依頼票に目を通す。今日はどこへ人をやろうか。</div>
            {SITES.map((s) => {
              const locked = s.minRep && g.rep < s.minRep;
              return (
                <Panel key={s.id} style={locked ? { opacity: 0.55 } : null}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 15 }}>{s.name} <span style={{ color: C.brass, fontSize: 13 }}>{s.cost}G</span></div>
                      <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{locked ? `評判${s.minRep}になると採集人が請けてくれる` : s.desc}</div>
                      {!locked && <div style={{ fontSize: 12, marginTop: 4 }}>{s.table.map(([m]) => itemIcon(m)).join(" ")}</div>}
                    </div>
                    <Btn onClick={() => gather(s)} disabled={locked || g.gold < s.cost}>採集依頼</Btn>
                  </div>
                </Panel>
              );
            })}
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
            <Panel>
              <div style={{ fontSize: 15, marginBottom: 6 }}>店の設え <span style={{ fontSize: 11, color: C.dim }}>儲けの使い道</span></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
              </div>
            </Panel>
            <Panel style={{ background: "transparent" }}>
              <div style={{ fontSize: 11, color: C.dim, marginBottom: 4 }}>倉庫の素材(採集地の順)</div>
              <div style={{ fontSize: 13, lineHeight: 1.9 }}>
                {invEntries.length ? invEntries.map(([k, v]) => <span key={k} style={{ marginRight: 10, whiteSpace: "nowrap" }}>{itemIcon(k)}{itemName(k)}×{v}</span>) : <span style={{ color: C.dim }}>空っぽだ</span>}
              </div>
            </Panel>
          </div>
        )}

        {/* ===== 昼(工房) ===== */}
        {g.phase === "workshop" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 12, color: C.dim }}>素材を選んで、仕立て方を決める。</div>
              <div style={{ fontSize: 13, color: C.brass }}>作業残り {"●".repeat(g.ap)}{"○".repeat(MAX_AP - g.ap)}</div>
            </div>

            <Panel>
              <div style={{ fontSize: 11, color: C.dim, marginBottom: 6 }}>作業台に載せる <span style={{ color: "#6f6350" }}>(⚒=仕立て直せる ?=まだ何かになりそう)</span></div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[...invEntries.filter(([k]) => !MATERIALS[k].supply), ...specEntries.filter(([k]) => craftables(k).length)].map(([k, v]) => {
                  const mk = SPECIMENS[k] ? nextMark(k) : null;
                  return (
                    <button key={k} onClick={() => setSel(k === sel ? null : k)}
                      style={{
                        fontFamily: "inherit", cursor: "pointer", fontSize: 13, padding: "6px 9px", borderRadius: 4,
                        background: sel === k ? C.brass : C.panelHi, color: sel === k ? "#1a140c" : C.ivory,
                        border: `1px solid ${sel === k ? C.brass : C.line}`,
                      }}>{itemIcon(k)} {itemName(k)} ×{v}{mk && <span style={{ color: sel === k ? "#1a140c" : C.glass, marginLeft: 4 }}>{mk}</span>}</button>
                  );
                })}
                {!invEntries.filter(([k]) => !MATERIALS[k].supply).length && !specEntries.filter(([k]) => craftables(k).length).length &&
                  <span style={{ color: C.dim, fontSize: 12 }}>加工できるものがない。明日の仕入れで補充しよう。</span>}
              </div>
            </Panel>

            <Panel>
              <div style={{ fontSize: 11, color: C.dim, marginBottom: 6 }}>仕立て方 {sel ? `— ${itemIcon(sel)} ${itemName(sel)}` : "(先に素材を選ぶ)"}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {Object.entries(PROCESSES).map(([pid, p]) => {
                  const lv = procLevel(g.procExp[pid] || 0);
                  const r = sel ? RECIPES.find((x) => x.from === sel && x.proc === pid) : null;
                  const possible = !!r;
                  const lvOk = r && lv >= (r.minLv || 1);
                  const known = r && g.known.includes(r.id);
                  const stocked = r && (!p.needs || (g.inv[p.needs] || 0) > 0);
                  const disabled = !sel || !possible || !lvOk || !stocked || g.ap <= 0;
                  return (
                    <button key={pid} onClick={() => r && lvOk && stocked && doCraft(r)} disabled={disabled}
                      style={{
                        fontFamily: "inherit", textAlign: "left", cursor: disabled ? "default" : "pointer",
                        background: disabled ? "transparent" : C.panelHi,
                        border: `1px solid ${possible && sel ? C.brass : C.line}`,
                        opacity: sel && !possible ? 0.35 : 1,
                        color: C.ivory, borderRadius: 4, padding: "8px 10px", fontSize: 13,
                      }}>
                      <span style={{ color: possible && sel ? C.brass : C.ivory }}>{p.name}</span>
                      <span style={{ fontSize: 10, color: C.dim, marginLeft: 6 }}>Lv{lv}</span>
                      {p.needs && <span style={{ fontSize: 11, color: (g.inv[p.needs] || 0) > 0 ? C.glass : C.red, marginLeft: 6 }}>要 {itemIcon(p.needs)}{itemName(p.needs)}(所持{g.inv[p.needs] || 0})</span>}
                      <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>
                        {!sel ? p.desc
                          : !possible ? "この素材には合わないようだ"
                          : !lvOk ? `熟練が足りない — ${p.name}Lv${r.minLv}になれば、何かできそうだ`
                          : known ? `→ ${SPECIMENS[r.to].icon} ${SPECIMENS[r.to].name}(基準 ${round5(basePrice(g, r.to))}G)`
                          : "→ ??? 何ができるかは、やってみないと分からない"}
                      </div>
                    </button>
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
                          <div style={{ fontSize: 24 }}>{SPECIMENS[id].icon}</div>
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
                        {SPECIMENS[k].icon} {SPECIMENS[k].name} ×{v}
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
        {g.phase === "night" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Panel>
              <div style={{ fontSize: 11, color: C.dim, marginBottom: 8, letterSpacing: "0.2em" }}>本日の営業</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {g.nightLog.map((l, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: 8,
                    fontSize: 13, lineHeight: 1.7,
                    color: l.t === "sale" ? C.ivory : l.t === "rent" ? C.red : l.t === "alias" ? C.brass : C.dim,
                    borderLeft: `2px solid ${l.big ? "#e0b96a" : l.t === "sale" ? C.brass : l.t === "rent" ? C.red : l.t === "alias" ? C.brass : C.line}`,
                    paddingLeft: 8,
                    background: l.big ? "rgba(201,161,94,0.08)" : "transparent",
                    borderRadius: l.big ? 4 : 0, paddingTop: l.big ? 4 : 0, paddingBottom: l.big ? 4 : 0,
                  }}>
                    {l.cid && <Portrait cid={l.cid} imgs={imgs} size={30} />}
                    <span>{l.text}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 10, paddingTop: 8, fontSize: 14, display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: C.dim }}>本日の売上</span>
                <span style={{ color: C.brass, fontVariantNumeric: "tabular-nums" }}>{g.nightEarn} G</span>
              </div>
            </Panel>

            {/* 蒐集家 */}
            {g.offer && (() => {
              const sp = SPECIMENS[g.offer.specId];
              const base = basePrice(g, g.offer.specId);
              const fair = round5(base * 1.6), high = round5(base * 2.2);
              return (
                <Panel style={{ borderColor: C.night }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <Portrait cid="collector" imgs={imgs} size={40} />
                    <div style={{ fontSize: 12, color: C.night, letterSpacing: "0.15em" }}>閉店後、扉が叩かれた</div>
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.9, color: C.ivory }}>
                    {COLLECTOR.name}「{COLLECTOR.appear}」<br />
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

            {daysToRent === 1 && <div style={{ fontSize: 12, color: C.red, textAlign: "center" }}>明日は家賃の日({RENT}G)。</div>}

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

        {/* ===== フッター ===== */}
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, background: "rgba(20,17,13,0.96)", borderTop: `1px solid ${C.line}`, padding: "10px 12px" }}>
          <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", gap: 8, alignItems: "center" }}>
            <Btn onClick={() => { setBookTab("spec"); setShowBook(true); }} style={{ fontSize: 12, padding: "8px 10px" }}>図鑑 {knownSpecs.size}/{Object.keys(SPECIMENS).length}</Btn>
            <Btn onClick={() => setShowGallery(true)} style={{ fontSize: 12, padding: "8px 10px" }}>画廊</Btn>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
              {g.phase === "morning" && <Btn primary onClick={() => setG({ ...g, phase: "workshop" })}>工房へ →</Btn>}
              {g.phase === "workshop" && <Btn primary onClick={() => { setSel(null); setG({ ...g, phase: "shelf" }); }}>陳列へ →</Btn>}
              {g.phase === "shelf" && (
                <>
                  <Btn onClick={() => setG({ ...g, phase: "workshop" })} disabled={g.ap <= 0}>← 工房</Btn>
                  <Btn primary onClick={openStore}>開店する</Btn>
                </>
              )}
              {g.phase === "night" && <Btn primary onClick={nextDay} disabled={!!g.offer}>翌朝へ →</Btn>}
            </div>
          </div>
        </div>

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
                      return (
                        <div key={id} style={{ border: `1px solid ${C.line}`, borderRadius: 5, padding: 8, opacity: found ? 1 : 0.45 }}>
                          <div style={{ fontSize: 13 }}>{found ? s.icon : "▪"} {found ? s.name : "?????"}</div>
                          <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>
                            {found ? <>{CAT_NAME[s.cat]} · {s.price}G{s.tags.map((t) => <TagChip key={t} t={t} />)}</> : "未発見"}
                          </div>
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
                          {meta && meta.data ? <img src={meta.data} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "sepia(0.2)" }} /> : null}
                        </span>
                      ) : (
                        <Portrait cid={slot.id} imgs={imgs} size={48} />
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

        {toast && (
          <div style={{ position: "fixed", bottom: 68, left: "50%", transform: "translateX(-50%)", background: C.panelHi, border: `1px solid ${C.brass}`, color: C.ivory, borderRadius: 6, padding: "8px 14px", fontSize: 13, zIndex: 60, maxWidth: "90%", boxShadow: "0 4px 18px rgba(0,0,0,0.5)" }}>
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
