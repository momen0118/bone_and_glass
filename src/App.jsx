import React, { useState, useEffect, useCallback, useRef } from "react";

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
  GAKUSEI_KOUHAI_LINE, GAKUSEI_GRAD, SWAMP_UNLOCK, CAVE_UNLOCK, SPEC_LORE, LEDGER_LOST, LEDGER_TITLES,
  WORM, isWorm, wormId, baseId, WORM_CATS, specOf, CAMPHOR, mushiDiscover, MUSHIYA,
  moonPhase, MOON_OPEN, MOON_BOOST, MOON_REPORT, KANI_RESCUE, ANA_ALIAS,
  ORDER_UNLOCK_REP, ORDER_CHANCE, ORDER_REWARD_MULT, ORDER_EXPIRED_LOG, ORDER_DECLINE,
  ORDER_CLIENTS, ORDER_FILTER, ORDER_LETTERS, ORDER_SITE_GATE, ORDER_RARE,
  BUYOUT_CELEBRATE, SCENES, OOYA_ORDER,
  APPRENTICE_INTRO, APPRENTICE_HIRE_FIRST, MONTH_REMARKS, RUMORS, RUMOR_CHANCE, OP,
  GOSSIP, GOSSIP_CHANCE, GOSSIP_SPEAKERS, GOSSIP_CUST_MIN,
  HANAKAGO, BANSHO, OPENING_NIGHT, NINE_BUY,
  RENT, RENT_INTERVAL, MAX_AP,
} from "./data.js";
import { storage } from "./storage.js";
import { loadFileImages, FILE_ZOOM, specTrim, portraitFrame, portraitVignette } from "./images.js";

// ---------- ユーティリティ ----------
const rnd = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rnd(arr.length)];
function weightedPick(pairs) {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [v, w] of pairs) { r -= w; if (r <= 0) return v; }
  return pairs[pairs.length - 1][0];
}
const itemName = (id) => (specOf(id) ? specOf(id).name : MATERIALS[id].name);
const itemIcon = (id) => (specOf(id) ? specOf(id).icon : MATERIALS[id].icon);
// カード表示のセリフ末に句点を補う(既に文末記号・終助詞「が」等で終わる文はそのまま)
const SENTENCE_END = "。．！？!?…‥〜~、」』が";
const withPeriod = (s) => (!s || SENTENCE_END.includes(s[s.length - 1]) ? s : s + "。");
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
    apprenticeSeen: false,   // 見習いの募集(貼り紙)イベントを消化したか
    apprenticeMorning: false, // その朝に貼り紙イベント行を出すか(翌朝クリア)
    apprenticeHiredOnce: false, // 初めて雇った瞬間の若者トーストを出したか
    made: {},                // 過去に一度でも仕立てた標本(初回は「2個仕立てる」を出さない)
    trust: 0, // 蒐集家の信頼(内部値、-6〜+6。画面には出さない)
    lastRent: RENT, // 前回支払った家賃額
    ownShop: false, // 店の買い取り
    gakuseiGraduated: false, // 学生の就職イベント(一度きり)
    swampUnlocked: false,    // 霧の湿原(老学者への累計販売で解禁)
    caveUnlocked: false, gatherCount: 0, // 石灰洞窟(森・入り江への依頼の累計で解禁)
    siteCount: {}, // 採集地別の依頼回数(馴染みの地の判定に使う)
    camphor: 0, // 樟脳の残晩数
    mushiFirstDone: false,  // 初回虫食いイベント消化=樟脳解禁
    mushiFirstNight: false, // 初回イベント: 虫湧き済みで蟲屋の来店待ち
    mushiMorning: null,     // 翌朝に見せる虫食い発見文
    mushiSold: 0, anaAlias: false, // 蟲屋への累計売却数と隠し通り名「穴物堂」
    order: null,   // 受領済みの特注 { client, specId, qty, dueDay, reward }
    letter: null,  // 未受領の手紙 { client, specId, qty, term, reward, li }
    orderExpired: false, // その朝に期限切れが起きたか(冒頭ログ用)
    // --- v6: 買い取り後のイベント列・廃坑 ---
    buyoutDay: null,          // 店を買い取った日(イベント列の起点)
    kifujinRumorDone: false,  // 貴婦人の噂(買い取り当日夜)の消化
    celebrated: {},           // 買い取りの祝いセリフを消化した客層(客層ごと1回)
    ooyaVisitDone: false,     // 大家の来訪(3日後夜)の消化
    ooyaOrderState: "none",   // 大家の依頼: none(未発生) / active(受注中) / done(完了)
    ooyaDelivered: {},        // 大家の依頼の部分納品済み数(specId → 数)
    haikouUnlocked: false,    // 廃坑(採集地)の解禁
    // --- v7: 万象の夜(エンディング) ---
    endingDone: false,        // 蒐集家の夜(エンディング演出)の消化
    hanakagoState: "none",    // 硝子の花籠: none(未入手)/ material(素材所持)/ done(完成)
    banshoAlias: false,       // 通り名「万象堂」の獲得
    banshoMorning: false,     // その朝に万象堂の冒頭ログを出すか(翌朝クリア)
    edFireDay: null,          // 図鑑コンプ後、この日の夜の閉店後に万象の夜が発生(コンプ翌日)
    // --- v7.1 ---
    openingNightDone: false,  // 開店の夜(1日目の学生イベント)の消化
    nineBuyDone: false,       // 好事家の九枠買い(隠しイベント)の消化
    // --- v7.2 ---
    moonReport: false,        // その朝に採集人の満月報告行を出すか(翌朝クリア)
    moonReportDone: false,    // 採集人の満月報告(2回目満月)の消化(一度きり)
    // --- v7.3 ---
    ooyaPreviewDone: false,   // 大家の初回家賃予告(6日目の夜)の消化(一度きり)
    kaniRescue: false,        // その朝に蟹の救済イベント行を出すか(翌朝クリア)
    kaniRescueDone: false,    // 蟹の救済(詰み防止)の消化(一度きり)
    // --- v8.1: 店史(帳簿) ---
    monthly: [],              // 月次記録の蓄積 [{ m, earn, sold, rep, alias }](30日ごとに締める)
    monthEarn: 0, monthSold: 0, // 今月(30日区切り)の売上・販売数(締めごとにリセット)
    soldByItem: {},           // 品別の通算販売数(標本ID → 数。soldByCatと同じ範囲を数える)
    soldByCust: {},           // 客層別の通算販売数(客ID → 数。soldByCatと同じ範囲を数える)
    bestMonthEarn: 0,         // 最高月商(月の締めで更新)
    historyLost: false,       // 旧セーブ引き継ぎ(帳簿に「記録は失われている」を出す)
    // --- v8.1: うわさ(風聞)の条件追跡 ---
    gossipLast: {},           // うわさ別の直近表示日(同じうわさの7日抑制)
    noCamphorDays: [],        // 直近14日のうち樟脳切れだった晩(日番号。樟脳解禁後のみ記録)
    strongNights: [],         // 直近14日のうち強気の値付けで開店した晩(日番号)
    lastFurnishDay: 0,        // 調度・棚増設を最後に購入した日(未購入は開店前=0)
    supplyBoughtToday: 0,     // その日の古物市で買った資材数(翌朝リセット)
    supplyBigDay: null,       // 古物市で資材を合計10個以上買った日
    orderMissTotal: 0,        // 特注のすっぽかし(期限切れ)の累計
    lastOrderMissDay: null,   // 直近のすっぽかし日
    orderDoneTotal: 0,        // 特注の達成の累計
    apprenticeOffStreak: 0,   // 見習いを連続で休ませている日数(解禁後・雇った日で0に戻る)
  };
}
const clampTrust = (t) => Math.max(-6, Math.min(6, t));
// 家賃の段階化: 開店前(その日の朝時点)の評判で判定。大家は先週までの噂を聞いて来る
const rentFor = (rep) => (rep >= 40 ? 400 : rep >= 20 ? 350 : RENT);
// v1セーブの取り込み(exportは検証スクリプト用。ゲーム内の挙動は不変)
export function migrate(loaded) {
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
  // 見習い: 旧セーブで評判20以上(解禁済み)なら押しかけイベントは消化済み扱い(スキップ)
  g.apprenticeSeen = loaded.apprenticeSeen !== undefined ? !!loaded.apprenticeSeen : (loaded.rep || 0) >= 20;
  g.apprenticeMorning = !!loaded.apprenticeMorning;
  // 既に見習いを雇った経験のある旧セーブは、若者トーストを消化済み扱い(雇用中なら既に見たはず)
  g.apprenticeHiredOnce = loaded.apprenticeHiredOnce !== undefined ? !!loaded.apprenticeHiredOnce : !!loaded.apprentice;
  // 製作履歴: 旧セーブは「図鑑の発見済み=製作済み」で初期化(発見済みが初回制限に掛からないように)
  g.made = loaded.made || {};
  if (!loaded.made) RECIPES.forEach((r) => { if ((loaded.known || []).includes(r.id)) g.made[r.to] = true; });
  g.trust = typeof loaded.trust === "number" ? clampTrust(loaded.trust) : 0;
  // 通り名を持たない旧セーブは、従来の判定(最多カテゴリ5個以上)で引き継ぐ
  if (!("alias" in loaded)) g.alias = aliasOf(g.soldByCat);
  g.lastRent = typeof loaded.lastRent === "number" ? loaded.lastRent : RENT;
  g.ownShop = !!loaded.ownShop;
  g.gakuseiGraduated = !!loaded.gakuseiGraduated;
  // 旧セーブ: 湿原は評判10以上なら解禁済み扱い、洞窟は解禁済み扱い
  g.swampUnlocked = loaded.swampUnlocked !== undefined ? !!loaded.swampUnlocked : (loaded.rep || 0) >= 10;
  g.caveUnlocked = loaded.caveUnlocked !== undefined ? !!loaded.caveUnlocked : true;
  g.gatherCount = loaded.gatherCount || 0;
  g.siteCount = loaded.siteCount || {}; // 旧セーブは採集地別カウント0開始
  g.camphor = loaded.camphor || 0; // 旧形式(最大14晩)の残値はそのまま引き継ぎ、次回購入から新仕様
  g.mushiFirstDone = !!loaded.mushiFirstDone;
  g.mushiFirstNight = !!loaded.mushiFirstNight;
  g.mushiMorning = loaded.mushiMorning || null;
  g.mushiSold = loaded.mushiSold || 0; // 旧セーブは0開始
  g.anaAlias = !!loaded.anaAlias;
  g.order = loaded.order || null;   // 旧セーブは特注なし
  g.letter = loaded.letter || null;
  g.orderExpired = false;
  // v6: 買い取り後のイベント列・廃坑
  g.kifujinRumorDone = !!loaded.kifujinRumorDone;
  g.celebrated = loaded.celebrated || {};
  g.ooyaVisitDone = !!loaded.ooyaVisitDone;
  g.ooyaOrderState = loaded.ooyaOrderState || "none";
  g.ooyaDelivered = loaded.ooyaDelivered || {};
  g.haikouUnlocked = !!loaded.haikouUnlocked;
  // v7: エンディング
  g.endingDone = !!loaded.endingDone;
  g.hanakagoState = loaded.hanakagoState || "none";
  g.banshoAlias = !!loaded.banshoAlias;
  g.banshoMorning = !!loaded.banshoMorning;
  g.edFireDay = typeof loaded.edFireDay === "number" ? loaded.edFireDay : null;
  // v7.1: 開店の夜は1日目を過ぎている既存セーブでは消化済み(発生させない)
  g.openingNightDone = loaded.openingNightDone !== undefined ? !!loaded.openingNightDone : (loaded.day || 1) > 1;
  g.nineBuyDone = !!loaded.nineBuyDone;
  // v7.2: 採集人の満月報告。2回目の満月(21日目)を過ぎている既存セーブでは消化済み
  g.moonReport = !!loaded.moonReport;
  g.moonReportDone = loaded.moonReportDone !== undefined ? !!loaded.moonReportDone : (loaded.day || 1) > 21;
  // v7.3: 大家の初回家賃予告(6日目の夜)。7日目以降の既存セーブは消化済み扱い。蟹の救済フラグ。
  g.ooyaPreviewDone = loaded.ooyaPreviewDone !== undefined ? !!loaded.ooyaPreviewDone : (loaded.day || 1) > 6;
  g.kaniRescue = !!loaded.kaniRescue;
  g.kaniRescueDone = !!loaded.kaniRescueDone;
  // v8.1: 店史。旧セーブは「記録は今月から」(過去分は遡らず、帳簿に喪失の一行を出す)
  g.monthly = loaded.monthly || [];
  g.historyLost = loaded.historyLost !== undefined ? !!loaded.historyLost : !loaded.monthly;
  g.monthEarn = loaded.monthEarn || 0;
  g.monthSold = loaded.monthSold || 0;
  g.soldByItem = loaded.soldByItem || {};
  g.soldByCust = loaded.soldByCust || {};
  g.bestMonthEarn = loaded.bestMonthEarn || 0;
  // v8.1: うわさの条件追跡。旧セーブは今日から数え始める(過去分は遡らない)
  g.gossipLast = loaded.gossipLast || {};
  g.noCamphorDays = loaded.noCamphorDays || [];
  g.strongNights = loaded.strongNights || [];
  g.lastFurnishDay = typeof loaded.lastFurnishDay === "number" ? loaded.lastFurnishDay : (loaded.day || 1);
  g.supplyBoughtToday = loaded.supplyBoughtToday || 0;
  g.supplyBigDay = typeof loaded.supplyBigDay === "number" ? loaded.supplyBigDay : null;
  g.orderMissTotal = loaded.orderMissTotal || 0;
  g.lastOrderMissDay = typeof loaded.lastOrderMissDay === "number" ? loaded.lastOrderMissDay : null;
  g.orderDoneTotal = loaded.orderDoneTotal || 0;
  g.apprenticeOffStreak = loaded.apprenticeOffStreak || 0;
  // 買い取り済みの旧セーブ: 翌日を「買い取り当日」とみなしてイベント列を開始する
  g.buyoutDay = typeof loaded.buyoutDay === "number" ? loaded.buyoutDay
    : (g.ownShop && !g.kifujinRumorDone ? g.day + 1 : null);
  return g;
}
// 図鑑コンプ(花籠を除く全標本を発見済み)。花籠は数に含めない
function specComp(known) {
  const goal = Object.keys(SPECIMENS).filter((id) => id !== HANAKAGO).length;
  const found = new Set(RECIPES.filter((r) => known.includes(r.id) && r.to !== HANAKAGO).map((r) => r.to)).size;
  return found >= goal;
}
// エンディング条件: 図鑑31種コンプ(評判は不問・trust出現率も不問)。
// 即日は発生せず、コンプ達成の翌日(edFireDay)の夜の閉店後に発生。
function endingReady(g) {
  return !g.endingDone && g.edFireDay != null && g.day >= g.edFireDay && specComp(g.known);
}
// 最安の採集費(蟹の救済の発火判定に使う)
const CHEAPEST_GATHER = Math.min(...SITES.map((s) => s.cost));
// 現在の手持ち(倉庫の素材・在庫標本・必要な資材・工程Lv)で実行できる仕立てが1つでもあるか
function canCraftAny(g) {
  return RECIPES.some((r) => {
    const p = PROCESSES[r.proc];
    const have = SPECIMENS[r.from] ? (g.spec[r.from] || 0) > 0 : (g.inv[r.from] || 0) > 0;
    if (!have) return false;
    if (procLevel((g.procExp && g.procExp[r.proc]) || 0) < (r.minLv || 1)) return false;
    if (p.needs && (g.inv[p.needs] || 0) <= 0) return false;
    return true;
  });
}
// 特注の手紙を1通生成(条件を満たさなければ null)。基準価=basePrice(g, id)
function rollOrderLetter(g) {
  // 依頼人抽選(解禁済みの客層のみ)
  const clientPool = ORDER_CLIENTS.filter((c) => {
    if (c.flag && !g[c.flag]) return false;
    const cust = CUSTOMERS.find((x) => x.id === c.id);
    return cust && g.rep >= cust.minRep;
  });
  if (!clientPool.length) return null;
  const client = weightedPick(clientPool.map((c) => [c, c.weight])).id;
  // 発見済みレシピの品(=作れると分かっている標本)
  const knownSpecs = [...new Set(RECIPES.filter((r) => g.known.includes(r.id)).map((r) => r.to))];
  const filt = ORDER_FILTER[client];
  // 発見済み × 依頼人フィルタ × 採集地が解禁済み(未解禁の原材料の品は除外)
  const pool = knownSpecs.filter((id) => SPECIMENS[id] && filt(SPECIMENS[id], basePrice(g, id))
    && !(ORDER_SITE_GATE[id] && !g[ORDER_SITE_GATE[id]]));
  if (!pool.length) return null;
  const specId = pick(pool);
  const price = basePrice(g, specId);
  // 数量(基準価帯)。<150=2〜3 / 150〜250=1〜2 / 250超=1
  const qty = price < 150 ? 2 + rnd(2) : price <= 250 ? 1 + rnd(2) : 1;
  // レア素材由来は長期・大口依頼(納期加算・報酬倍率の上書き)。それ以外は通常
  const rare = ORDER_RARE[specId];
  const term = 3 + (qty - 1) + (rare ? rare.term : 0); // 納期(受領日を含まず翌日から起算)
  const reward = round5(price * qty * (rare ? rare.mult : ORDER_REWARD_MULT));
  const li = rnd(ORDER_LETTERS[client].length);
  return { client, specId, qty, term, reward, li };
}

// ---------- 棚まわりの計算 ----------
function adjBonus(shelf, i, size) {
  const me = shelf[i]; if (!me || isWorm(me)) return false; // 虫食い品は隣接ボーナス対象外
  const row = Math.floor(i / 3), col = i % 3;
  const neigh = [];
  if (col > 0) neigh.push(row * 3 + col - 1);
  if (col < 2) neigh.push(row * 3 + col + 1);
  if (row > 0) neigh.push((row - 1) * 3 + col);
  if (row < 2) neigh.push((row + 1) * 3 + col);
  return neigh.some((j) => j < size && shelf[j] && !isWorm(shelf[j]) && SPECIMENS[shelf[j]].cat === SPECIMENS[me].cat);
}
function activeSets(shelf, size) {
  const ids = shelf.slice(0, size).filter((x) => x && !isWorm(x)); // 虫食い品は銘板対象外
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
// 基準価(熟練Lv3・天鵞絨込み、棚補正なし)。虫食い品は元の50%(補正なし)
function basePrice(g, specId) {
  if (isWorm(specId)) return SPECIMENS[baseId(specId)].price * 0.5;
  let p = SPECIMENS[specId].price;
  const proc = SPEC_PROC[specId];
  if (proc && procLevel(g.procExp[proc] || 0) >= 3) p *= 1.10;
  if (g.decor.velvet && SPECIMENS[specId].tags.includes("fancy")) p *= 1.10;
  return p;
}
// 学生の予算(蟹の救済の判定に使う)
const STUDENT_BUDGET = (CUSTOMERS.find((c) => c.id === "gakusei") || {}).budget || 150;
// 倉庫・棚に、標準値付け(基準価)で学生の予算以下となる完成標本(虫食いを除く)があるか
// = 通常客の学生に確実に売れる在庫があるか(蟹の救済の抑制条件)
function hasStudentStock(g) {
  const ids = [
    ...Object.keys(g.spec || {}).filter((id) => (g.spec[id] || 0) > 0),
    ...(g.shelf || []).slice(0, g.shelfSize).filter(Boolean),
  ];
  return ids.some((id) => !isWorm(id) && basePrice(g, id) <= STUDENT_BUDGET);
}
// 棚上の売価(値付け・隣接・銘板込み)。虫食い品は補正なしの基準価(蟲屋のみが買う)
function shelfPrice(g, i, sets) {
  const id = g.shelf[i]; if (!id) return 0;
  if (isWorm(id)) return round5(basePrice(g, id));
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
// (exportは検証スクリプト用。ゲーム内の挙動は不変)
export function simulateNight(g) {
  const log = [];
  let gold = 0, rep = 0, sold = 0;
  const shelf = [...g.shelf];
  const spec = { ...g.spec };
  const soldByCat = { ...g.soldByCat };
  const soldByItem = { ...g.soldByItem };
  const soldByCust = { ...g.soldByCust };
  const custBought = { ...g.custBought };
  const mode = PRICE_MODES[g.priceMode];
  const sets = activeSets(shelf, g.shelfSize);

  // 来客数(月齢: 満月+2 / 新月-2。上限は棚数連動、新月の下限1)
  const phase = moonPhase(g.day);
  let visitors = 2 + Math.floor(g.rep / 8) + (g.decor.lamp ? 1 : 0) + (Math.random() < 0.5 ? 1 : 0)
    + (phase === 4 ? 2 : 0) + (phase === 0 ? -2 : 0);
  visitors = Math.min(g.shelfSize + 2, Math.max(phase === 0 ? 1 : 0, visitors));
  const aliasCat = g.alias;
  // 銘板の招き: 単数 invite / 複数 invites の両対応
  const setInvites = (c) => sets.some((s) => (s.invites ? s.invites.includes(c.id) : s.invite === c.id));
  const pool = CUSTOMERS.filter((c) => g.rep >= c.minRep && (!c.flag || g[c.flag])).map((c) => {
    let w = c.weight;
    if (aliasCat && ALIASES[aliasCat].invite.includes(c.id)) w += 2;
    if (setInvites(c)) w += 2;
    // 就職イベント後、学生は後輩に代替わり(buyに一言加わる)
    if (c.id === "gakusei" && g.gakuseiGraduated)
      c = { ...c, lines: { ...c.lines, buy: [...c.lines.buy, GAKUSEI_KOUHAI_LINE] } };
    return [c, w];
  });
  let graduated = g.gakuseiGraduated;
  let graduatedTonight = false; // 就職イベントが起きた夜は学生を再抽選しない
  const celebrated = { ...g.celebrated }; // 買い取りの祝いセリフ(客層ごと1回)
  let rumorGiven = false; // 銘板の噂は一晩最大1回

  // ---- うわさ(風聞): 一晩最大1回。銘板の噂ヒントとは同夜に両方出ない(ヒント優先) ----
  let gossipGiven = false;
  const gossipLast = { ...(g.gossipLast || {}) };
  // 直近14日の追跡(今夜の分を含めて評価し、そのまま保存値として返す)
  const camphorOut = g.mushiFirstDone && (g.camphor || 0) <= 0; // 樟脳解禁後の樟脳切れの晩
  const noCamphorDays = [...(g.noCamphorDays || []).filter((d) => d > g.day - 14 && d < g.day), ...(camphorOut ? [g.day] : [])];
  const strongNights = [...(g.strongNights || []).filter((d) => d > g.day - 14 && d < g.day), ...(g.priceMode === "strong" ? [g.day] : [])];
  // #5: soldByCat最多分類が全体の6割以上(その分類の通り名を獲得済みの間のみ)
  const gossipTopCat = () => {
    let best = null, bestN = 0, total = 0;
    for (const [k, v] of Object.entries(soldByCat)) { total += v; if (v > bestN) { best = k; bestN = v; } }
    return total > 0 && bestN >= total * 0.6 && g.aliasHistory.includes(best) ? best : null;
  };
  // #6: 客層別販売の最多客層が明確(4割以上・同数の並びなし)。若い研究者は学生に合算。
  // 通算がごく少ないうちは「最多」が立たない(合計15件の下限)
  const gossipTopCust = () => {
    const t = {};
    for (const [k, v] of Object.entries(soldByCust)) { const key = k === "wakate" ? "gakusei" : k; t[key] = (t[key] || 0) + v; }
    let best = null, bestN = 0, tie = false, total = 0;
    for (const [k, v] of Object.entries(t)) {
      total += v;
      if (v > bestN) { best = k; bestN = v; tie = false; }
      else if (v === bestN && v > 0) tie = true;
    }
    if (total < GOSSIP_CUST_MIN) return null;
    return best && !tie && bestN >= total * 0.4 && GOSSIP_SPEAKERS.includes(best) ? best : null;
  };
  // 話者固定うわさの成立条件(条件を満たしている間だけ抽選対象)
  const gossipConds = {
    // 未購入の調度・棚増設が残っている × 30日間それらを購入していない × 所持金がその最安額の3倍以上
    g1: () => {
      const costs = DECOR.filter((d) => !g.decor[d.id]).map((d) => d.cost);
      if (SHELF_EXPAND[g.shelfSize + 1]) costs.push(SHELF_EXPAND[g.shelfSize + 1]);
      return costs.length > 0 && g.day - (g.lastFurnishDay || 0) >= 30 && g.gold >= Math.min(...costs) * 3;
    },
    g2: () => g.mushiFirstDone && noCamphorDays.length >= 7,
    g3: () => strongNights.length >= 8,
    g4: () => (g.mushiSold || 0) >= 5 && !g.anaAlias,
    g7: () => (g.orderMissTotal || 0) >= 1 && g.lastOrderMissDay != null && g.day - g.lastOrderMissDay <= 30,
    g8: () => g.supplyBigDay != null && g.day > g.supplyBigDay && g.day <= g.supplyBigDay + 3,
    // 今夜も休みなら「直近7日すべて休ませている」が成立する(過去6日+今夜で7日)
    g9: () => g.apprenticeSeen && !g.apprentice && (g.apprenticeOffStreak || 0) >= 6,
    g10: () => (g.orderDoneTotal || 0) >= 5 && (g.lastOrderMissDay == null || g.day - g.lastOrderMissDay > 30),
  };
  // セリフ表示の直前判定。3%で、その話者が言えるうわさから1本(7日抑制中は除く)。無ければ null
  const rollGossip = (c) => {
    if (gossipGiven || rumorGiven || !GOSSIP_SPEAKERS.includes(c.id)) return null;
    if (Math.random() >= GOSSIP_CHANCE) return null;
    const fresh = (key) => !(gossipLast[key] && g.day - gossipLast[key] < 7);
    const cands = [];
    for (const [key, def] of Object.entries(GOSSIP)) {
      if (key === "g6" || def.cid !== c.id || !fresh(key)) continue;
      if (key === "g5") {
        const cat = gossipTopCat();
        if (cat) cands.push({ key, line: def.line(CAT_NAME[cat]) });
      } else if (gossipConds[key]()) {
        cands.push({ key, line: def.line });
      }
    }
    if (fresh("g6")) {
      const top = gossipTopCust();
      if (top && top !== c.id) { // 最多客層本人は話者から除外
        const nm = (CUSTOMERS.find((x) => x.id === top) || {}).name;
        cands.push({ key: "g6", line: GOSSIP.g6.lines[c.id](nm) });
      }
    }
    if (!cands.length) return null;
    const hit = pick(cands);
    gossipGiven = true;
    gossipLast[hit.key] = g.day;
    return hit.line;
  };

  const priceAt = (i) => {
    let p = basePrice(g, shelf[i]) * mode.mult;
    if (adjBonus(shelf, i, g.shelfSize)) p *= 1.15;
    if (sets.some((s) => s.members.includes(shelf[i]))) p *= 1.20;
    return round5(p);
  };

  // 匣の庭(銘板)発動中は学生の予算を+30%(隠し効果・UIには一切出さない)
  const gardenActive = sets.some((s) => s.id === "set_garden");

  // 1人の客を応対する(棚・売上・評判・在庫を破壊的に更新し、ログを積む)。
  // opts.tag=ログに足す追加フィールド。戻り値 { bought }
  const serveCustomer = (c, opts = {}) => {
    const bought = custBought[c.id] || 0;
    const slots = shelf.map((id, i) => ({ id, i })).filter((s) => s.id && !isWorm(s.id) && s.i < g.shelfSize);
    if (!slots.length) { log.push({ t: "misc", cid: c.id, text: `${c.name}が覗いたが、棚は空だった。`, line: null, ...(opts.tag || {}) }); return { bought: false }; }
    const budget = c.id === "gakusei" && gardenActive ? Math.round(c.budget * 1.3) : c.budget;
    const afford = slots.filter((s) => priceAt(s.i) >= (c.floor || 0) && priceAt(s.i) <= budget);
    if (!afford.length) {
      const line = rollGossip(c) || custLine(c, bought, "poor");
      log.push({ t: "misc", cid: c.id, text: `${c.name}「${line}」`, line, ...(opts.tag || {}) });
      return { bought: false };
    }
    const favs = afford.filter((s) => {
      const sp = SPECIMENS[s.id];
      return sp.tags.some((t) => c.likesTags.includes(t)) || c.likesCats.includes(sp.cat);
    });
    let target, chance;
    // 大家(客化): 黄鉄鉱の結晶が棚にあれば最優先で買う(唯一、安物を機嫌よく買う上客)
    const ougon = c.id === "ooya" && afford.find((s) => s.id === "s_ougon");
    if (ougon) { target = ougon; chance = 0.92; }
    else if (favs.length) { target = pick(favs); chance = 0.85; }
    else { target = pick(afford); chance = c.easyBuyer ? 0.75 : 0.5; }
    chance = Math.min(0.97, chance * mode.buy + (g.decor.window ? 0.05 : 0));

    if (Math.random() < chance) {
      const price = priceAt(target.i);
      const sp = SPECIMENS[target.id];
      shelf[target.i] = null;
      gold += price; sold++;
      soldByCat[sp.cat] = (soldByCat[sp.cat] || 0) + 1;
      soldByItem[target.id] = (soldByItem[target.id] || 0) + 1;
      soldByCust[c.id] = (soldByCust[c.id] || 0) + 1;
      custBought[c.id] = bought + 1;
      rep += 1 + (sp.tags.includes("rare") ? 1 : 0) + mode.repBonus;
      const big = price >= 400;
      // セリフの優先順: 買い取りの祝い(一度きり) > うわさ(3%) > 通常のbuy/bigセリフ
      const line = opts.celebrateLine || rollGossip(c) || (big ? custLine(c, bought, "big") : custLine(c, bought, "buy"));
      log.push({ t: "sale", cid: c.id, big, text: `${c.name}「${line}」— ${sp.icon} ${sp.name}を ${price}G で購入。`, line, itemId: target.id, price, ...(opts.tag || {}) });
      return { bought: true };
    }
    // 銘板の噂: passした客が、担当銘板のうち未発見のものがあれば 8% で噂を落とす(一晩1回)。
    // うわさとは同夜に両方出ない(ここが先に判定される=ヒント優先)
    if (!rumorGiven && !gossipGiven) {
      const undiscovered = (RUMORS[c.id] || []).filter((r) => !g.knownSets.includes(r.set));
      if (undiscovered.length && Math.random() < RUMOR_CHANCE) {
        rumorGiven = true;
        const r = pick(undiscovered);
        log.push({ t: "misc", cid: c.id, text: `${c.name}「${r.line}」`, line: r.line, ...(opts.tag || {}) });
        return { bought: false };
      }
    }
    const line = rollGossip(c) || custLine(c, bought, "pass");
    log.push({ t: "misc", cid: c.id, text: `${c.name}「${line}」`, line, ...(opts.tag || {}) });
    return { bought: false };
  };

  // 好事家の九枠買い(隠しイベント): 棚9枠すべてが同一のrare標本 + 好事家custBought>=15。
  // 好事家がその夜の最初の客として来店し、9点を一括購入(表示価格の総和)。以後その夜は店じまい。
  let nineBuy = false;
  {
    const ids = shelf.slice(0, 9);
    const rareId = ids[0];
    if (!g.nineBuyDone && g.shelfSize === 9 && rareId && !isWorm(rareId)
        && SPECIMENS[rareId].tags.includes("rare") && ids.every((x) => x === rareId)
        && (custBought.koujika || 0) >= 15) {
      nineBuy = true;
      let total = 0;
      for (let i = 0; i < 9; i++) {
        const price = priceAt(i);
        const sp = SPECIMENS[shelf[i]];
        total += price; gold += price; sold++;
        soldByCat[sp.cat] = (soldByCat[sp.cat] || 0) + 1;
        soldByItem[shelf[i]] = (soldByItem[shelf[i]] || 0) + 1;
        soldByCust.koujika = (soldByCust.koujika || 0) + 1;
        rep += 1 + (sp.tags.includes("rare") ? 1 : 0) + mode.repBonus;
        shelf[i] = null;
      }
      custBought.koujika = (custBought.koujika || 0) + 9;
      log.push({ t: "sale", cid: "koujika", big: true, nineBuy: true, tap: true,
        line: NINE_BUY[0], line2: NINE_BUY[1], itemId: rareId, price: total, qty: 9,
        text: `好事家「${NINE_BUY[0]}」「${NINE_BUY[1]}」— ${SPECIMENS[rareId].icon} ${SPECIMENS[rareId].name}を9点、${total}G で購入。` });
    }
  }

  // 開店の夜(新規1日目・最初の客の学生): 一度きりの専用イベントカード(購入なし・タップ送り)
  let openingTonight = false;
  if (!nineBuy && g.day === 1 && !g.openingNightDone) {
    openingTonight = true;
    log.push({ t: "misc", cid: "gakusei", tap: true,
      line: OPENING_NIGHT[0], line2: OPENING_NIGHT[1], line3: OPENING_NIGHT[2],
      text: `学生「${OPENING_NIGHT[0]}」「${OPENING_NIGHT[1]}」「${OPENING_NIGHT[2]}」` });
  }

  // 貴婦人の噂: 店買い取り当日の夜、開店直後の1人目を貴婦人に固定(抽選外・未解禁でも登場)。
  // 演出(セリフ列)はUI側の全面カード送りで見せ、ここでは通常の買い物挙動に合流させる。
  let kifujinRumor = false;
  if (!nineBuy && g.ownShop && g.buyoutDay != null && g.day === g.buyoutDay && !g.kifujinRumorDone) {
    kifujinRumor = true;
    const kf = CUSTOMERS.find((c) => c.id === "kifujin");
    if (kf) serveCustomer(kf);
  }
  // 学生の就職イベント: 条件を満たす夜は「来客列の先頭」で発生させる。
  // 開店一番、金持ちに棚を食い荒らされる前に、棚で最も表示価格の高い品を予算無視で買っていく。
  // (累計販売が閾値に達し、棚に商品が1点以上ある夜。棚が空の夜は持ち越し)
  {
    const gslots = shelf.map((id, i) => ({ id, i })).filter((s) => s.id && !isWorm(s.id) && s.i < g.shelfSize);
    if (!nineBuy && !graduated && (custBought.gakusei || 0) >= GAKUSEI_GRAD.threshold && gslots.length) {
      graduated = true;
      graduatedTonight = true;
      let target = gslots[0];
      for (const s of gslots) if (priceAt(s.i) > priceAt(target.i)) target = s;
      const price = priceAt(target.i);
      const sp = SPECIMENS[target.id];
      shelf[target.i] = null;
      gold += price; sold++;
      soldByCat[sp.cat] = (soldByCat[sp.cat] || 0) + 1;
      soldByItem[target.id] = (soldByItem[target.id] || 0) + 1;
      soldByCust.gakusei = (soldByCust.gakusei || 0) + 1;
      rep += 1 + (sp.tags.includes("rare") ? 1 : 0) + mode.repBonus;
      custBought.gakusei = 0; // 後輩に代替わり(この購入は数に残さない)
      log.push({
        t: "sale", cid: "gakusei", big: true, grad: true,
        line: GAKUSEI_GRAD.line, line2: GAKUSEI_GRAD.line2, sub: GAKUSEI_GRAD.sub,
        itemId: target.id, price,
        text: `学生「${GAKUSEI_GRAD.line}」「${GAKUSEI_GRAD.line2}」— ${sp.icon} ${sp.name}を ${price}G で購入。`,
      });
    }
  }
  // 同一客層の3連続を避けるため、直近に来た客層を控える。九枠買いの夜は通常客を呼ばない(店じまい)
  const recent = [];
  for (let v = 0; !nineBuy && v < visitors; v++) {
    let c = weightedPick(pool);
    // 直前2組と同一客層なら1回だけ再抽選(他客層がプールにある場合のみ。序盤の学生オンリーは対象外)
    if (recent.length >= 2 && recent[recent.length - 1] === c.id && recent[recent.length - 2] === c.id
        && pool.some(([p]) => p.id !== c.id)) {
      c = weightedPick(pool);
    }
    recent.push(c.id);
    // 就職・開店の夜イベントの起きた夜、以降の学生の抽選は無効にする(再抽選しない=その枠は空振り)
    if (c.id === "gakusei" && (graduatedTonight || openingTonight)) continue;
    // 買い取り当日の夜(貴婦人の噂演出より後の客)以降、対象客層の初購入で祝いセリフを1回だけ差し込む。
    // 貴婦人は抽選外で先に応対済みなので、この抽選ループの客はすべて「噂より後」に当たる。
    const celebrateLine = (g.ownShop && g.buyoutDay != null && g.day >= g.buyoutDay
      && !celebrated[c.id] && BUYOUT_CELEBRATE[c.id]) || null;
    const res = serveCustomer(c, { celebrateLine });
    if (celebrateLine && res.bought) celebrated[c.id] = true;
  }
  if (!visitors) log.push({ t: "misc", text: "今夜は誰も来なかった。硝子が静かに光っている。" });

  // ---- 樟脳・虫湧き・蟲屋 ----
  let camphor = g.camphor || 0;
  let mushiFirstDone = g.mushiFirstDone;
  let mushiFirstNight = g.mushiFirstNight;
  let mushiMorning = null; // 翌朝に見せる発見文
  let mushiyaVisit = false; // この夜、蟲屋が来るか
  const firstMushiya = !g.mushiFirstDone; // この夜の蟲屋が初回イベントのものか
  // 倉庫の乾燥系(骨格・昆虫・工芸)の通常標本
  const dryList = () => Object.keys(spec).filter((k) => !isWorm(k) && spec[k] > 0 && WORM_CATS.includes(SPECIMENS[k].cat));
  const dryCount = () => dryList().reduce((n, k) => n + spec[k], 0);
  // 判定母数N: 無傷の乾燥系 + 虫食い品(虫食いの山も羽音を増やす)
  const wormTotal = () => Object.keys(spec).filter((k) => isWorm(k)).reduce((n, k) => n + spec[k], 0)
    + shelf.filter((x) => x && isWorm(x)).length;
  const spawnWorm = () => {
    const bag = [];
    dryList().forEach((k) => { for (let i = 0; i < spec[k]; i++) bag.push(k); }); // 抽選対象は無傷のみ
    if (!bag.length) return null;
    const victim = pick(bag);
    spec[victim] -= 1; if (spec[victim] <= 0) delete spec[victim];
    const w = wormId(victim);
    spec[w] = (spec[w] || 0) + 1;
    return SPECIMENS[victim].name;
  };

  if (!mushiFirstDone) {
    // 初回イベント(樟脳未解禁の間は通常判定を行わない)
    if (mushiFirstNight) {
      // 2夜目: 蟲屋が確定来店 → 翌朝から樟脳解禁
      mushiyaVisit = true;
      mushiFirstDone = true;
      mushiFirstNight = false;
    } else if (dryCount() >= 3 || (g.day >= 10 && dryCount() >= 1)) {
      // 1夜目: 倉庫に乾燥系3点以上、または10日目以降で乾燥系1点以上 → 確定で1品発生
      // (回転の良い店で乾燥系が溜まらず、いつまでも初回イベントが起きない問題への逃がし弁)
      const name = spawnWorm();
      if (name) { mushiMorning = name; mushiFirstNight = true; }
    }
  } else {
    // 通常運用
    if (camphor >= 1) {
      camphor -= 1; // 焚いている晩は湧かない(毎晩1消費)
    } else {
      const N = dryCount() + wormTotal(); // 虫食い品も母数に算入
      if (N > 0 && Math.random() < Math.min(N * 0.04, 0.6)) {
        const name = spawnWorm();
        if (name) mushiMorning = name;
      }
    }
    // 通常の蟲屋: 虫食い品を1点以上所持(倉庫・棚問わず)していれば40%で来店(別枠)
    const hasWorm = Object.keys(spec).some((k) => isWorm(k) && spec[k] > 0) || shelf.some((x) => x && isWorm(x));
    if (hasWorm && Math.random() < 0.4) mushiyaVisit = true;
  }

  // 蟲屋の来店処理(来客上限とは別枠)
  let mushiSold = g.mushiSold || 0;
  let anaAlias = g.anaAlias;
  if (mushiyaVisit) {
    const wormSlots = shelf.map((id, i) => ({ id, i })).filter((s) => s.id && isWorm(s.id) && s.i < g.shelfSize);
    const buyWorm = () => {
      const t = pick(wormSlots);
      // 蟲屋の買値: 基準価(50%)の70%固定。穴物堂の獲得後は75%に上がる(評判/販売カウント不変)
      const price = round5(basePrice(g, t.id) * (anaAlias ? 0.75 : 0.70));
      shelf[t.i] = null; gold += price;
      mushiSold += 1; // 蟲屋への累計売却数(穴物堂の判定に使う)
      return { id: t.id, price };
    };
    if (firstMushiya) {
      // 初回イベントは三段構成(二段目のみ棚の虫食い有無で分岐)
      if (wormSlots.length) {
        const b = buyWorm();
        log.push({ t: "sale", cid: "mushiya",
          line: MUSHIYA.firstAppear, line2: MUSHIYA.firstBuy, line3: MUSHIYA.firstLeave,
          itemId: b.id, price: b.price,
          text: `蟲屋「${MUSHIYA.firstAppear}」「${MUSHIYA.firstBuy}」— ${specOf(b.id).name}を ${b.price}G で購入。\n蟲屋「${MUSHIYA.firstLeave}」` });
      } else {
        log.push({ t: "misc", cid: "mushiya",
          line: MUSHIYA.firstAppear, line2: MUSHIYA.firstNone, line3: MUSHIYA.firstLeave,
          text: `蟲屋「${MUSHIYA.firstAppear}」「${MUSHIYA.firstNone}」「${MUSHIYA.firstLeave}」` });
      }
    } else if (wormSlots.length) {
      // 2回目以降は従来のランダム運用
      const b = buyWorm();
      const line = pick(MUSHIYA.buy);
      log.push({ t: "sale", cid: "mushiya", line, itemId: b.id, price: b.price,
        text: `蟲屋「${line}」— ${specOf(b.id).name}を ${b.price}G で購入。` });
    } else {
      log.push({ t: "misc", cid: "mushiya", line: MUSHIYA.empty, text: `蟲屋「${MUSHIYA.empty}」` });
    }
  }
  // 隠し通り名「穴物堂」: 蟲屋への累計売却が閾値に達した夜、営業ログ末尾に噂
  if (!anaAlias && mushiSold >= ANA_ALIAS.threshold) {
    anaAlias = true;
    log.push({ t: "alias", text: ANA_ALIAS.noise });
  }

  // 湿原の解禁(老学者への累計販売が閾値に達した夜、営業ログ末尾にイベント行)
  let swampUnlocked = g.swampUnlocked;
  if (!swampUnlocked && (custBought.gakusha || 0) >= SWAMP_UNLOCK.threshold) {
    swampUnlocked = true;
    log.push({ t: "event", cid: "gakusha", text: SWAMP_UNLOCK.text });
  }

  // 家賃(店を買い取ったあとは徴収なし)
  let rentLog = null, rentPaid = null;
  if (!g.ownShop && g.day % RENT_INTERVAL === 0) {
    const rent = rentFor(g.rep); // 開店前(朝時点)の評判で判定
    const cash = g.gold + gold;  // 支払い直前の所持金
    gold -= rent; rentPaid = rent;
    // 家賃回収は客と同じカードに昇格。line=大家のセリフ / narr=セリフなしの地の文 / payLabel=支払額 / text=まとめ時の一行
    let line = null, narr = null, payLabel, text;
    if (rent > (g.lastRent != null ? g.lastRent : RENT)) {
      line = rent >= 400 ? OOYA.raise200 : OOYA.raise150;
      payLabel = `家賃 ${rent}G`;
      text = `大家「${line}」— 家賃は ${rent}G になった。`;
    } else if (cash < rent) {
      line = OOYA.broke;
      payLabel = `家賃 ${rent}G(ツケ)`;
      text = `大家「${line}」`;
    } else if (Math.random() < 0.5) {
      line = pick(OOYA.normal);
      payLabel = `家賃 ${rent}G`;
      text = `大家「${line}」— 家賃 ${rent}G を支払った。`;
    } else {
      narr = "大家が来た。";
      payLabel = `家賃 ${rent}G`;
      text = `大家が来た。家賃 ${rent}G を支払った。`;
    }
    rentLog = { t: "rent", cid: "ooya", line, narr, payLabel, text };
  }
  // 初回家賃の前夜(6日目の夜)の閉店後、大家が初登場して予告する(一度きり・閉店後タグ・タップ送り2行)
  let ooyaPreview = false;
  if (rentLog == null && !g.ownShop && g.day === RENT_INTERVAL - 1 && !g.ooyaPreviewDone) {
    ooyaPreview = true;
    rentLog = { t: "rent", cid: "ooya", tap: true, line: OOYA.preview[0], line2: OOYA.preview[1], text: `大家「${OOYA.preview[0]}」` };
  }

  // 見習いの日当
  let wageText = null;
  if (g.apprentice) { gold -= 70; wageText = "見習いに日当 70G を払った。"; }

  // 蒐集家の来訪判定(trustが負のときのみ出現率が減衰。正でも上げない)。
  // エンディングの夜は通常の蒐集家来訪をスキップ(万象の夜の演出が単独で出る)
  let offer = null;
  if (g.rep >= 18 && (g.collectorCd || 0) <= 0 && !endingReady(g)) {
    const nightSet = sets.some((s) => s.id === "set_night");
    let appearRate = 0.22 + (nightSet ? 0.15 : 0);
    const trust = g.trust || 0;
    if (trust < 0) appearRate *= 1 + trust / 8;
    if (Math.random() < appearRate) {
      const shelfRares = shelf.map((id, i) => ({ id, i })).filter((s) => s.id && !isWorm(s.id) && s.i < g.shelfSize && SPECIMENS[s.id].tags.includes("rare"));
      const stockRares = Object.keys(spec).filter((k) => !isWorm(k) && spec[k] > 0 && SPECIMENS[k].tags.includes("rare"));
      if (shelfRares.length) { const t = pick(shelfRares); offer = { specId: t.id, source: "shelf", slot: t.i }; }
      else if (stockRares.length) { offer = { specId: pick(stockRares), source: "stock" }; }
    }
  }
  return { log, gold, rep, sold, rentLog, rentPaid, wageText, shelf, spec, soldByCat, soldByItem, soldByCust, custBought, offer,
    gakuseiGraduated: graduated, swampUnlocked,
    camphor, mushiFirstDone, mushiFirstNight, mushiMorning, mushiSold, anaAlias,
    celebrated, kifujinRumor, openingTonight, nineBuy, ooyaPreview,
    gossipLast, noCamphorDays, strongNights };
}

// ============================================================
// UI 部品
// ============================================================
// 下部バーのボタン共通スタイル(折り返し禁止・狭い幅でも一行に収める)
const FOOT_BTN = { fontSize: 12, padding: "8px 9px", whiteSpace: "nowrap" };

// 月相アイコン: SVGで自前描画(象牙色の円+背景色の影で7相を表現)。
// 画像 img/moon/{相番号}.png があればそれを pixelated で表示。効果の説明は一切なし
const MoonIcon = ({ day, fileImgs, size = 14 }) => {
  const phase = moonPhase(day);
  const url = fileImgs && fileImgs.moon && fileImgs.moon[phase];
  if (url) return <img src={url} alt="" width={size} height={size} style={{ imageRendering: "pixelated", display: "inline-block", verticalAlign: "middle" }} />;
  const r = 45, cx = 50, cy = 50;
  // 新月: 細い輪郭線だけの暗い円
  if (phase === 0) return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <circle cx={cx} cy={cy} r={r} fill={C.bg} stroke={C.ivory} strokeOpacity="0.5" strokeWidth="3" />
    </svg>
  );
  // 満月: 象牙色の全円
  if (phase === 4) return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <circle cx={cx} cy={cy} r={r} fill={C.ivory} />
    </svg>
  );
  // 三日月・上弦・十三夜=満ちる(右が明るい)/ 下弦・有明=欠ける(左が明るい)
  const waxing = phase <= 3;
  const f = phase === 2 || phase === 5 ? 0.5 : (phase === 1 || phase === 6 ? 0.25 : 0.75);
  const rx = Math.abs(r * Math.cos(Math.PI * f)).toFixed(2);
  const outerSweep = waxing ? 1 : 0;
  // 三日月/有明(f<0.5)は終端線が明部側へ膨らみ細い弧に、十三夜/下弦(f>0.5)は暗部側へ膨らむ
  const innerSweep = waxing ? (f < 0.5 ? 0 : 1) : (f < 0.5 ? 1 : 0);
  const d = `M${cx},${cy - r} A${r},${r} 0 0,${outerSweep} ${cx},${cy + r} A${rx},${r} 0 0,${innerSweep} ${cx},${cy - r} Z`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <circle cx={cx} cy={cy} r={r} fill={C.bg} stroke={C.line} strokeWidth="1" />
      <path d={d} fill={C.ivory} />
    </svg>
  );
};
const Panel = ({ children, style }) => (
  <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 0, padding: 12, ...style }}>{children}</div>
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
  <span style={{ fontSize: 10, border: `1px solid ${C.brass}`, color: C.brass, borderRadius: 0, padding: "0 4px", marginLeft: 4 }}>{TAG_NAME[t]}</span>
);
// 肖像の絵文字フォールバック
const portraitFallback = (cid) =>
  cid === "collector" ? COLLECTOR.icon
  : cid === "ooya" ? OOYA.icon
  : cid === "mushiya" ? MUSHIYA.icon
  : (CUSTOMERS.find((c) => c.id === cid) || {}).icon || "·";

// 肖像: リポジトリ画像 → 画廊(アップロード) → 絵文字 の順
const Portrait = ({ cid, imgs, fileImgs, size = 34 }) => {
  const fileUrl = fileImgs && fileImgs.portraits && fileImgs.portraits[cid];
  const meta = imgs && imgs[cid];
  const fb = portraitFallback(cid);
  const src = fileUrl || (meta && meta.data);
  if (!src) return <span style={{ fontSize: Math.round(size * 0.62), width: size, textAlign: "center", flexShrink: 0 }}>{fb}</span>;
  // 額なし版はリポジトリ画像のとき顔基準で個別調整。画廊アップロードは従来の中央拡大
  const fr = fileUrl ? portraitFrame(cid) : { scale: meta.zoom || 1.15, oy: 50 };
  return (
    <span style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", display: "inline-block", border: `1px solid ${C.line}`, flexShrink: 0, background: "#000" }}>
      <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 50%", transform: `scale(${fr.scale})`, transformOrigin: `50% ${fr.oy}%`, filter: "sepia(0.3) contrast(1.05) brightness(0.98)" }} />
    </span>
  );
};
// 夜のカード用の大きな肖像。銅版画のビネット様式: 縦楕円+縁ぼかし(硬い枠線は使わない)。
// 楕円の輪郭に沿って mask-image の radial-gradient で背景へ溶かす。画像が無ければ絵文字を大きく。
// 夜ログの小さいPortrait・画廊は現状(円形)のまま(小サイズではビネットが潰れるため)。
// VIGNETTE: 完全表示域を広く取り(72%)、ぼかし帯を外周へ追い込む。頬から上に減光をかけない。
const VIGNETTE = "radial-gradient(ellipse 50% 50% at 50% 47%, #000 72%, rgba(0,0,0,0) 92%)";
// 「時間が流れる演出」だけに使う統一フェード(静かなクロスフェード)。key変更で再生される。
// 適用箇所: OPの各枚 / 月の独白の一拍 / 閉店後の全面一拍 / 全面演出(買い取り・大家来訪)の各行。
// 通常のフェーズ遷移・カード送り・モーダルには使わない。
const FADE = "bgFadeIn 0.75s ease";
const FramedPortrait = ({ cid, imgs, fileImgs, width = "40%" }) => {
  const fileUrl = fileImgs && fileImgs.portraits && fileImgs.portraits[cid];
  const meta = imgs && imgs[cid];
  const src = fileUrl || (meta && meta.data);
  const fb = portraitFallback(cid);
  // ビネットはバストアップ(頭〜肩)。画廊アップロードは従来の中央拡大
  const fr = fileUrl ? portraitVignette(cid) : { scale: (meta && meta.zoom) || 1.15, oy: 50 };
  return (
    <div style={{ width, flexShrink: 0 }}>
      <div style={{ aspectRatio: "4 / 5", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
        WebkitMaskImage: VIGNETTE, maskImage: VIGNETTE }}>
        {src
          ? <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 50%", transform: `scale(${fr.scale})`, transformOrigin: `50% ${fr.oy}%`, filter: "sepia(0.3) contrast(1.05) brightness(0.98)" }} />
          : <span style={{ fontSize: 52 }}>{fb}</span>}
      </div>
    </div>
  );
};
// 素材の絵柄: リポジトリ画像(ドット絵想定、32×32)があれば整数倍・pixelatedで表示、なければ絵文字
const MatIcon = ({ id, fileImgs, size = 32, emojiSize = 13, style }) => {
  const url = fileImgs && fileImgs.materials && fileImgs.materials[id];
  if (url) return (
    <img src={url} alt="" style={{ width: size, height: size, imageRendering: "pixelated", display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }} />
  );
  return <span style={{ fontSize: emojiSize, ...style }}>{MATERIALS[id].icon}</span>;
};
// 標本の絵柄: リポジトリ画像があれば正方形・角丸で、なければ絵文字
// 画像は角丸コンテナ内で specTrim() 倍に拡大し、外周の白フチ・署名を切り落とす
const SpecIcon = ({ id, fileImgs, size = 20, emojiSize, style }) => {
  const bid = baseId(id); // 虫食い品は元標本の絵柄で表示
  const url = fileImgs && fileImgs.specimens && fileImgs.specimens[bid];
  if (url) return (
    <span style={{
      width: size, height: size, borderRadius: Math.max(3, Math.round(size * 0.14)),
      overflow: "hidden", display: "inline-block", verticalAlign: "middle", flexShrink: 0,
      ...(isWorm(id) ? { filter: "grayscale(0.4) brightness(0.85)", opacity: 0.9 } : null), ...style,
    }}>
      <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transform: `scale(${specTrim(bid)})` }} />
    </span>
  );
  // 絵文字フォールバックも画像と同じ size×size ボックスを占有(横並びの接地線・頭を揃える)。
  // 中身は下端寄せで、画像品(全面)と絵文字品の足元が板の上辺で揃う。
  return (
    <span style={{
      width: size, height: size, display: "inline-flex", alignItems: "flex-end", justifyContent: "center",
      verticalAlign: "middle", flexShrink: 0, lineHeight: 1,
      ...(isWorm(id) ? { filter: "grayscale(0.4)", opacity: 0.85 } : null), ...style,
    }}>
      <span style={{ fontSize: emojiSize || Math.round(size * 0.85), lineHeight: 1 }}>{SPECIMENS[bid].icon}</span>
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
  const [fileImgs, setFileImgs] = useState(null);
  const [sel, setSel] = useState(null);
  const [shelfPickFor, setShelfPickFor] = useState(null);
  const [showBook, setShowBook] = useState(false);
  const [bookTab, setBookTab] = useState("spec");
  const [bookDetail, setBookDetail] = useState(null); // 図鑑の詳細ビュー(発見済み標本ID)
  const [showLedger, setShowLedger] = useState(false); // 帳簿(店史)モーダル
  const [showDecor, setShowDecor] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null); // 表示タイマー(差し替え時にリセット)
  // 夜のカード送り: idx=表示中のステップ, sub=多段カードの表示済み行数, collapsed=「残りをまとめる」押下済み
  const [nightView, setNightView] = useState({ idx: 0, sub: 1, collapsed: false });
  // 洞窟解禁の朝のイベント行(その朝のあいだだけ表示)
  const [caveEvent, setCaveEvent] = useState(null);
  // 店買い取りの専用演出(null=非表示 / 0〜=表示中のステップ)
  const [buyoutStep, setBuyoutStep] = useState(null);
  // 焚き付けの確認ダイアログ
  const [burnConfirm, setBurnConfirm] = useState(false);
  // 特注の手紙を開いているか(羊皮紙面)
  const [showLetter, setShowLetter] = useState(false);
  // 通常依頼の破棄「断りの手紙」確認ダイアログ
  const [declineConfirm, setDeclineConfirm] = useState(false);
  // タップ送りの全面演出(貴婦人の噂・大家の来訪・権利書)。{ id, step }
  const [scene, setScene] = useState(null);
  // 大家の依頼カードの開閉(デフォルト折りたたみ)
  const [ooyaCardOpen, setOoyaCardOpen] = useState(false);
  // OP(はじまりの朝)の表示ステップ(null=非表示 / 0〜=表示中。新規開始時のみ)
  const [opStep, setOpStep] = useState(null);
  // タイトルに戻る確認(下部バー・全フェーズ)。店の記録は残す
  const [toTitleConfirm, setToTitleConfirm] = useState(false);
  // タイトルの「最初から」確認(既存セーブがある場合のみ)。記録を消してOPへ
  const [restartConfirm, setRestartConfirm] = useState(false);

  useEffect(() => {
    // フェード用のキーフレームを一度だけ注入
    if (!document.getElementById("bg-fade-kf")) {
      const st = document.createElement("style");
      st.id = "bg-fade-kf";
      st.textContent = "@keyframes bgFadeIn{from{opacity:0}to{opacity:1}}";
      document.head.appendChild(st);
    }
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

  const loadSave = async () => {
    try {
      const r = await storage.get(SAVE_KEY);
      if (r && r.value) { const mg = migrate(JSON.parse(r.value)); setG(mg); setOoyaCardOpen(ooyaOrderReady(mg)); setScreen("game"); }
    } catch (e) { flash("記録が読み込めなかった…"); }
  };
  const startNew = async () => {
    const ng = newGame(); setG(ng); setScreen("game");
    try { await storage.set(SAVE_KEY, JSON.stringify(ng)); } catch (e) {}
    setOpStep(0); // 新規開始のみOP演出を挟む(続きからでは出さない)
  };
  // タイトルの「最初から」: 既存の記録があるときのみ確認を挟み、消してOPへ
  const startFresh = () => {
    if (hasSave) { setRestartConfirm(true); return; }
    startNew();
  };
  const confirmRestart = async () => {
    setRestartConfirm(false);
    try { await storage.delete(SAVE_KEY); } catch (e) {}
    setHasSave(false);
    startNew();
  };
  // 下部バーの「タイトル」: 確認のうえタイトルへ戻す(店の記録は残す=保存済みのまま)
  const goTitle = async () => {
    setToTitleConfirm(false);
    try { const r = await storage.get(SAVE_KEY); setHasSave(!!(r && r.value)); } catch (e) { setHasSave(false); }
    // 開いている面・演出を畳んでタイトルへ
    setShowBook(false); setShowLedger(false); setShowDecor(false);
    setShowLetter(false); setScene(null); setOpStep(null);
    setScreen("title");
  };
  // トーストは後着優先の即時差し替え。差し替え時に表示タイマーをリセットし、常に規定時間フル表示する。
  const flash = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => { setToast(null); toastTimer.current = null; }, 2400);
  };

  // ---- 朝 ----
  const gather = (site) => {
    if (g.gold < site.cost) return flash("お金が足りない");
    // 通常は2個。馴染みの地(この採集地への依頼が8回目以降)は35%で3個目が付く(表示・通知なし)
    const nth = (g.siteCount[site.id] || 0) + 1;
    const amount = 2 + (nth >= 8 && Math.random() < 0.35 ? 1 : 0);
    // 前夜が満月だった朝の採集は特定素材の抽選重みを2倍(海月・蛾・夜光苔・梟・蝙蝠。表示・通知なし)
    // 満月は2晩あるため、その各翌朝=計2回の朝が対象になる
    let table = site.table;
    if (moonPhase(g.day - 1) === 4 && MOON_BOOST[site.id]) {
      const boost = MOON_BOOST[site.id];
      table = site.table.map(([m, w]) => [m, boost.includes(m) ? w * 2 : w]);
    }
    const got = {};
    for (let i = 0; i < amount; i++) { const m = weightedPick(table); got[m] = (got[m] || 0) + 1; }
    const inv = { ...g.inv };
    Object.entries(got).forEach(([k, v]) => (inv[k] = (inv[k] || 0) + v));
    const siteCount = { ...g.siteCount, [site.id]: nth };
    // 洞窟の解禁: 森・入り江への依頼の累計が閾値に達したら
    let gatherCount = g.gatherCount || 0, caveUnlocked = g.caveUnlocked;
    if (site.id === "mori" || site.id === "umibe") gatherCount += 1;
    const justUnlocked = !caveUnlocked && gatherCount >= CAVE_UNLOCK.threshold;
    if (justUnlocked) { caveUnlocked = true; setCaveEvent(CAVE_UNLOCK.text); }
    // 採集人の満月報告: 2回目の満月(相4)の一晩目の朝(奇数日=満月の対のうち先の日)に採集依頼を出したら一度きり
    const fireMoonReport = !g.moonReportDone && moonPhase(g.day) === 4 && g.day % 2 === 1 && Math.floor((g.day - 1) / 14) === 1;
    setG({ ...g, gold: g.gold - site.cost, inv, siteCount, gatherCount, caveUnlocked,
      moonReport: g.moonReport || fireMoonReport, moonReportDone: g.moonReportDone || fireMoonReport });
    flash(justUnlocked ? CAVE_UNLOCK.text : "入手: " + Object.entries(got).map(([k, v]) => `${itemIcon(k)}${itemName(k)} ${v}`).join("、"));
  };
  const buySupply = (s, qty = 1) => {
    const total = s.cost * qty;
    if (g.gold < total) return flash("お金が足りない");
    const inv = { ...g.inv }; inv[s.id] = (inv[s.id] || 0) + qty;
    // その日の資材購入数。合計10個に達した日を控える(うわさ#8)
    const supplyBoughtToday = (g.supplyBoughtToday || 0) + qty;
    setG({ ...g, gold: g.gold - total, inv, supplyBoughtToday,
      supplyBigDay: supplyBoughtToday >= 10 ? g.day : g.supplyBigDay });
  };
  // 樟脳を買う(5晩分。所持は1個まで=残晩数があるうちは買えない)
  const buyCamphor = () => {
    if (g.gold < CAMPHOR.cost || g.camphor > 0) return;
    setG({ ...g, gold: g.gold - CAMPHOR.cost, camphor: CAMPHOR.nights });
    flash(CAMPHOR.toast);
  };
  // 虫食い品をまとめて焚き付けにする(倉庫・棚のすべて。0G)
  const burnWorms = () => {
    const spec = { ...g.spec };
    Object.keys(spec).forEach((k) => { if (isWorm(k)) delete spec[k]; });
    const shelf = g.shelf.map((x) => (x && isWorm(x) ? null : x));
    setG({ ...g, spec, shelf });
    setBurnConfirm(false);
    flash("竈にくべた。よく燃えた。");
  };
  const expandShelf = () => {
    const next = g.shelfSize + 1, cost = SHELF_EXPAND[next];
    if (!cost) return;
    if (g.gold < cost) return flash("お金が足りない");
    setG({ ...g, gold: g.gold - cost, shelfSize: next, lastFurnishDay: g.day });
    flash(`大工が棚を増やしてくれた(${next}枠)`);
  };
  const buyDecor = (d) => {
    if (g.decor[d.id] || g.gold < d.cost) return;
    setG({ ...g, gold: g.gold - d.cost, decor: { ...g.decor, [d.id]: true }, lastFurnishDay: g.day });
    flash(`${d.name}を設えた`);
  };
  // 店の買い取り: 実行した瞬間、大家との専用イベント表示に切り替える
  const buyShop = () => {
    if (g.ownShop || g.gold < SHOP_BUYOUT) return;
    // 買い取り当日を記録(この日の夜に貴婦人の噂、3日後の夜に大家の来訪が起きる)
    setG({ ...g, gold: g.gold - SHOP_BUYOUT, ownShop: true, buyoutDay: g.day });
    setShowDecor(false);
    setBuyoutStep(0);
  };

  // ---- 昼 ----
  const craftables = (id) => RECIPES.filter((r) => r.from === id);
  // n=2 は熟練Lv3特典の「2個仕立てる」(1APで2個、素材・資材を2セット消費)
  const doCraft = (r, n = 1) => {
    if (g.ap <= 0) return flash("今日の作業はもう終わり");
    const p = PROCESSES[r.proc];
    // 硝子の花籠: 倉庫にも棚にも入らない。完成した瞬間、店の常設の飾りになる
    if (r.to === HANAKAGO) {
      const inv = { ...g.inv };
      inv[r.from] -= 1; if (inv[r.from] <= 0) delete inv[r.from];
      if (p.needs) { inv[p.needs] -= 1; if (inv[p.needs] <= 0) delete inv[p.needs]; }
      const known = g.known.includes(r.id) ? g.known : [...g.known, r.id];
      const exp = { ...g.procExp, [r.proc]: (g.procExp[r.proc] || 0) + 1 };
      setG({ ...g, inv, known, ap: g.ap - 1, procExp: exp, hanakagoState: "done" });
      setSel(null);
      setScene({ id: "hanakagoDone", step: 0 }); // 常設飾りにした一幕(タップ送り・フェード)
      return;
    }
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
    const madeHist = g.made[r.to] ? g.made : { ...g.made, [r.to]: true }; // 製作履歴(初回制限の判定用)
    setG({ ...g, inv, spec, known, ap: g.ap - 1, craftLog, procExp: exp, made: madeHist });
    setSel(null);
    if (isNew) flash(`新しい標本を作り出した — ${made.name}`);
    else if (lvUp) flash(`${p.name}の腕が上がった(Lv${procLevel(exp[r.proc])})`);
  };

  // 大家の依頼: 4品すべて倉庫に揃っているか(部分納品分も加味)
  const ooyaOrderReady = (st) => st.ooyaOrderState === "active" &&
    OOYA_ORDER.items.every(([id, need]) => ((st.ooyaDelivered && st.ooyaDelivered[id]) || 0) + ((st.spec && st.spec[id]) || 0) >= need);

  // ---- 夕 ----
  const placeOnShelf = (slotIdx, specId) => {
    const y = window.scrollY; // 配置パネルが閉じて頁が縮んでもスクロール位置を保つ
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
    // 再レイアウト後にスクロール位置を復元(縮んだ分は自動でクランプされる)
    requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, y)));
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
      ...g, phase: "night", shelf: res.shelf, spec: res.spec,
      gold: g.gold + res.gold, rep: g.rep + res.rep,
      nightLog: log, nightEarn: res.gold, nightRent: res.rentLog ? res.rentLog.text : null,
      totalEarn: g.totalEarn + Math.max(0, res.gold), totalSold: g.totalSold + res.sold,
      monthEarn: (g.monthEarn || 0) + Math.max(0, res.gold), monthSold: (g.monthSold || 0) + res.sold,
      soldByCat: res.soldByCat, soldByItem: res.soldByItem, soldByCust: res.soldByCust, custBought: res.custBought,
      alias: newAlias, aliasHistory,
      offer: res.offer, offerResult: null,
      lastRent: res.rentPaid != null ? res.rentPaid : g.lastRent,
      gakuseiGraduated: res.gakuseiGraduated, swampUnlocked: res.swampUnlocked,
      camphor: res.camphor, mushiFirstDone: res.mushiFirstDone,
      mushiFirstNight: res.mushiFirstNight, mushiMorning: res.mushiMorning,
      mushiSold: res.mushiSold, anaAlias: res.anaAlias,
      celebrated: res.celebrated,
      kifujinRumorDone: g.kifujinRumorDone || res.kifujinRumor,
      openingNightDone: g.openingNightDone || res.openingTonight,
      nineBuyDone: g.nineBuyDone || res.nineBuy,
      ooyaPreviewDone: g.ooyaPreviewDone || res.ooyaPreview,
      gossipLast: res.gossipLast, noCamphorDays: res.noCamphorDays, strongNights: res.strongNights,
    });
    setNightView({ idx: 0, sub: 1, collapsed: false });
    // 貴婦人の噂: 開店直後、全面のタップ送り演出を挟む(演出後は通常の営業カードへ)
    if (res.kifujinRumor) setScene({ id: "kifujinRumor", step: 0 });
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
        monthEarn: (st.monthEarn || 0) + fair, monthSold: (st.monthSold || 0) + 1,
        offer: null, offerResult: `${sp.name}を ${fair}G で譲った。蒐集家「${COLLECTOR.dealFair}」`, collectorCd: 2,
        trust: clampTrust((g.trust || 0) + 1) });
    } else if (choice === "high") {
      // ふっかけ成功率: 高額品ほど通りにくく、信頼が良好だと通りやすい(上限0.85)
      const trust = g.trust || 0;
      // 新月の晩のみ、ふっかけ成功率+15%(隠しパラメータ。表示しない)
      const newMoonBonus = moonPhase(g.day) === 0 ? 0.15 : 0;
      const highChance = Math.min(0.85,
        Math.max(0.35, Math.min(0.70, 0.75 - base / 2000)) + Math.max(0, trust) * 0.04 + newMoonBonus);
      if (Math.random() < highChance) {
        const st = removeItem(g);
        setG({ ...st, gold: st.gold + high, rep: st.rep + 2, nightEarn: st.nightEarn + high, totalEarn: st.totalEarn + high, totalSold: st.totalSold + 1,
          monthEarn: (st.monthEarn || 0) + high, monthSold: (st.monthSold || 0) + 1,
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
    const firstHire = hire && !g.apprenticeHiredOnce;
    setG({ ...g, apprentice: hire, ap: MAX_AP + (hire ? 1 : 0), apprenticeHiredOnce: g.apprenticeHiredOnce || hire });
    if (firstHire) flash(APPRENTICE_HIRE_FIRST); // 初めて雇った瞬間の若者(一度きり)
  };

  // ---- 翌朝 ----
  // extra=翌朝の状態に上書きするフィールド(演出で確定した受注などを混ぜ込む)
  const advanceDay = (extra = {}) => {
    const src = { ...g, ...extra };
    const day = src.day + 1;
    // 店史: 月の締め(30日ごと)。その月の売上・販売数と、月末時点の評判・通り名を蓄積する
    let monthly = src.monthly || [], monthEarn = src.monthEarn || 0, monthSold = src.monthSold || 0,
      bestMonthEarn = src.bestMonthEarn || 0;
    if (src.day % 30 === 0) {
      monthly = [...monthly, { m: src.day / 30, earn: monthEarn, sold: monthSold, rep: src.rep, alias: src.alias }];
      bestMonthEarn = Math.max(bestMonthEarn, monthEarn);
      monthEarn = 0; monthSold = 0;
    }
    // 特注: 期限切れ判定(無断すっぽかし)。評判-4、かつ依頼人のcustBought -3(下限0)。ログは従来の一行のまま
    let order = src.order, rep = src.rep, orderExpired = false, letter = null, custBought = src.custBought;
    let orderMissTotal = src.orderMissTotal || 0, lastOrderMissDay = src.lastOrderMissDay;
    if (order && day > order.dueDay) {
      custBought = { ...custBought, [order.client]: Math.max(0, (custBought[order.client] || 0) - 3) };
      rep = Math.max(0, rep - 4);
      order = null; orderExpired = true;
      orderMissTotal += 1; lastOrderMissDay = day; // すっぽかしの記録(うわさ#7・#10)
    }
    // 依頼を受けていない朝は、確率で手紙が1通届く(解禁評判以上・該当プールがあるとき)
    if (!order && rep >= ORDER_UNLOCK_REP && Math.random() < ORDER_CHANCE) letter = rollOrderLetter({ ...src, rep });
    // 見習いの押しかけ: 評判20到達の翌朝、一度だけイベント行を出し見習い欄を解禁
    const apprenticeMorning = !src.apprenticeSeen && rep >= 20;
    // 万象堂: 花籠完成の翌朝、通り名を得て冒頭ログを出す(一度きり)
    const banshoMorning = src.hanakagoState === "done" && !src.banshoAlias;
    // エンディング: 図鑑コンプ達成後、翌日の夜を発生日として一度だけ確定(以後は減らない)
    let edFireDay = src.edFireDay;
    if (edFireDay == null && !src.endingDone && specComp(src.known)) edFireDay = day + 1;
    // 蟹の救済(詰み防止・一度きり): 朝の開始時点で金欠・仕立て可能な組み合わせが皆無・
    // 学生に売れる完成在庫(標準値付けで150G以下・虫食い除く)も無いなら倉庫に蟹の亡骸を1つ置く
    let kaniRescue = false, rescueInv = src.inv;
    if (!src.kaniRescueDone && src.gold < CHEAPEST_GATHER && !canCraftAny(src) && !hasStudentStock(src)) {
      kaniRescue = true;
      rescueInv = { ...src.inv, kani: (src.inv.kani || 0) + 1 };
    }
    const ng = {
      ...src, day, phase: "morning", ap: MAX_AP + (src.apprentice ? 1 : 0),
      nightLog: [], nightRent: null, craftLog: [], offer: null, offerResult: null,
      collectorCd: Math.max(0, (src.collectorCd || 0) - 1),
      // 信頼は負のときだけ毎朝+0.5ずつ0へ回復(正の値は減衰しない)
      trust: (src.trust || 0) < 0 ? Math.min(0, (src.trust || 0) + 0.5) : (src.trust || 0),
      order, rep, letter, orderExpired, custBought, edFireDay,
      apprenticeMorning, apprenticeSeen: src.apprenticeSeen || apprenticeMorning,
      banshoMorning, banshoAlias: src.banshoAlias || banshoMorning,
      moonReport: false, // 満月報告は当日の朝のみ。翌朝クリア(消化フラグ moonReportDone は保持)
      inv: rescueInv, kaniRescue, kaniRescueDone: src.kaniRescueDone || kaniRescue,
      monthly, monthEarn, monthSold, bestMonthEarn,
      orderMissTotal, lastOrderMissDay,
      supplyBoughtToday: 0, // 古物市の当日購入数は毎朝リセット
      // 見習いを休ませた日が続くと伸びる(雇っていた日・解禁前は0に戻る)
      apprenticeOffStreak: src.apprenticeSeen && !src.apprentice ? (src.apprenticeOffStreak || 0) + 1 : 0,
    };
    // 大家の依頼: 4品すべて倉庫に揃った朝は自動で開く。揃っていなければ畳む。
    setOoyaCardOpen(ooyaOrderReady(ng));
    setG(ng); save(ng);
  };
  const nextDay = () => {
    // 万象の夜(エンディング): 条件を満たした夜の閉店後に単独で発生(通常の蒐集家・大家来訪より優先)
    if (endingReady(g)) {
      setScene({ id: "endingNight", step: 0 });
      return;
    }
    // 大家の来訪: 買い取りから3日後の夜、閉店後にタップ送り演出を挟む(演出後に受注確定→翌朝へ)
    if (g.ownShop && !g.ooyaVisitDone && g.buyoutDay != null && g.day === g.buyoutDay + 3) {
      setScene({ id: "ooyaVisit", step: 0 });
      return;
    }
    advanceDay();
  };
  // タップ送り演出を1段進める。末尾で演出ごとの後始末を行う
  const advanceScene = () => {
    if (!scene) return;
    const seq = SCENES[scene.id].seq;
    if (scene.step + 1 < seq.length) { setScene({ ...scene, step: scene.step + 1 }); return; }
    const id = scene.id;
    setScene(null);
    // ooyaVisit: 演出終了=受注確定。そのまま翌朝へ進む。
    // kifujinRumor(開店直後)・ooyaReward(納品時)は状態確定済みで、演出のみ。
    if (id === "ooyaVisit") advanceDay({ ooyaVisitDone: true, ooyaOrderState: "active", ooyaDelivered: {} });
    // endingNight: 演出終了で消化。翌朝、倉庫に「深海の硝子海綿」が入っている。
    else if (id === "endingNight") {
      advanceDay({ endingDone: true, hanakagoState: "material", inv: { ...g.inv, kaimen: (g.inv.kaimen || 0) + 1 } });
    }
    // hanakagoDone(花籠完成): 演出のみ(状態はdoCraftで確定済み)
  };
  // ---- 特注: 受ける / 断る / 納品 ----
  const acceptOrder = () => {
    const l = g.letter; if (!l) return;
    setG({ ...g, letter: null, order: { client: l.client, specId: l.specId, qty: l.qty, dueDay: g.day + l.term, reward: l.reward } });
  };
  const declineOrder = () => setG({ ...g, letter: null });
  // 進行中の通常依頼を破棄「断りの手紙を出す」(評判-2固定・常連度不変・依頼消滅)
  const abandonOrder = () => {
    if (!g.order) return;
    setG({ ...g, order: null, rep: Math.max(0, g.rep - ORDER_DECLINE.repPenalty) });
    setDeclineConfirm(false);
  };
  // 大家の依頼の納品(倉庫から・部分納品可・虫食い不可)。4点すべて揃えば完了演出→廃坑解禁
  const deliverOoyaOrder = () => {
    if (g.ooyaOrderState !== "active") return;
    const spec = { ...g.spec };
    const delivered = { ...g.ooyaDelivered };
    let moved = 0;
    for (const [id, need] of OOYA_ORDER.items) {
      const have = spec[id] || 0;
      const remain = need - (delivered[id] || 0);
      const take = Math.min(Math.max(0, remain), have); // 虫食い(w_接頭)は spec[id] に含まれない
      if (take > 0) {
        spec[id] -= take; if (spec[id] <= 0) delete spec[id];
        delivered[id] = (delivered[id] || 0) + take;
        moved += take;
      }
    }
    if (!moved) return;
    const complete = OOYA_ORDER.items.every(([id, need]) => (delivered[id] || 0) >= need);
    if (complete) {
      // 完了: 権利書=報酬のすべて(金銭・常連度は動かさない)。評判+2・廃坑解禁
      setG({ ...g, spec, ooyaDelivered: delivered, ooyaOrderState: "done", haikouUnlocked: true, rep: g.rep + 2 });
      setScene({ id: "ooyaReward", step: 0 });
    } else {
      setG({ ...g, spec, ooyaDelivered: delivered });
    }
  };
  const deliverOrder = () => {
    const o = g.order; if (!o) return;
    if ((g.spec[o.specId] || 0) < o.qty) return; // 倉庫在庫のみ・数量必須
    const spec = { ...g.spec };
    spec[o.specId] -= o.qty; if (spec[o.specId] <= 0) delete spec[o.specId];
    const cust = CUSTOMERS.find((c) => c.id === o.client);
    const custBought = { ...g.custBought, [o.client]: (g.custBought[o.client] || 0) + o.qty };
    // 報酬入金・評判+2・常連度に加算。soldByCat(通り名)には数えない
    setG({ ...g, spec, order: null, gold: g.gold + o.reward, rep: g.rep + 2, custBought,
      orderDoneTotal: (g.orderDoneTotal || 0) + 1 }); // 達成の記録(うわさ#10)
    flash(`${cust ? cust.name : ""}に ${SPECIMENS[o.specId].name}×${o.qty} を届けた。${o.reward}G を受け取った。`);
  };

  // ============================================================
  if (screen === "loading") return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.dim, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, 'Yu Mincho', serif" }}>
      店の鍵を開けています…
    </div>
  );

  const shopBg = (fileImgs && fileImgs.shop) || (imgs.shop && imgs.shop.data) || null;

  if (screen === "title") return (
    <div style={{ minHeight: "100vh", background: C.bg, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", paddingTop: "34vh", fontFamily: "Georgia, 'Yu Mincho', serif", paddingLeft: 24, paddingRight: 24, paddingBottom: 24, overflow: "hidden" }}>
      {shopBg && (
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${shopBg})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.35, filter: "sepia(0.2) brightness(0.8)",
          ...(fileImgs && fileImgs.shop && FILE_ZOOM.shop !== 1 ? { transform: `scale(${FILE_ZOOM.shop})` } : null) }} />
      )}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(20,17,13,0.3), rgba(20,17,13,0.92))" }} />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", color: C.ivory }}>
        <div style={{ fontSize: 13, letterSpacing: "0.5em", color: C.dim, marginBottom: 8 }}>OS ET VITRUM</div>
        {fileImgs && fileImgs.logo
          ? <img src={fileImgs.logo} alt="骨と硝子の店" style={{ width: "80%", maxWidth: 270, height: "auto", display: "block", margin: "7px 0 6px" }} />
          : <h1 style={{ fontSize: 34, fontWeight: 400, letterSpacing: "0.25em", margin: "0 0 6px" }}>骨と硝子の店</h1>}
        <div style={{ width: 180, height: 0.5, background: C.brass, margin: "14px 0 18px" }} />
        <p style={{ color: "#b3a586", fontSize: 13, textAlign: "center", lineHeight: 1.9, maxWidth: 340, margin: "0 0 28px" }}>
          亡骸と鉱石を仕入れ、標本に仕立て、<br />硝子の棚に並べて売る。
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 220 }}>
          {hasSave && <Btn primary onClick={loadSave}>続きから</Btn>}
          <Btn primary={!hasSave} onClick={startFresh}>{hasSave ? "最初から" : "開店する"}</Btn>
        </div>
      </div>

      {/* タイトルの「最初から」確認(既存の記録があるときのみ) */}
      {restartConfirm && (
        <div onClick={() => setRestartConfirm(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 90 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 4, padding: 18, maxWidth: 320, width: "100%" }}>
            <div style={{ fontSize: 14, lineHeight: 2, color: C.ivory, marginBottom: 16 }}>いまの店の記録は失われる。——最初からはじめようか。</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn onClick={() => setRestartConfirm(false)}>やめておく</Btn>
              <Btn primary onClick={confirmRestart}>はじめる</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ---- ゲーム本体 ----
  const PHASE_LABEL = { morning: "朝 · 仕入れ", workshop: "昼 · 工房", shelf: "夕 · 陳列", night: "夜 · 営業" };
  const invEntries = Object.entries(g.inv).filter(([, v]) => v > 0)
    .sort((a, b) => MAT_ORDER.indexOf(a[0]) - MAT_ORDER.indexOf(b[0]));
  const specEntries = Object.entries(g.spec).filter(([, v]) => v > 0);
  // 所持している虫食い品の総数(倉庫+棚)。焚き付けボタンの表示・確認文に使う
  const wormCount = specEntries.filter(([k]) => isWorm(k)).reduce((n, [, v]) => n + v, 0)
    + g.shelf.filter((x) => x && isWorm(x)).length;
  const knownSpecs = new Set(RECIPES.filter((r) => g.known.includes(r.id)).map((r) => r.to));
  // 図鑑の総数: 花籠は発見するまで数に含めない(31→発見後32)。エンディングまで存在を伏せる
  const specTotal = Object.keys(SPECIMENS).length - (knownSpecs.has(HANAKAGO) ? 0 : 1);
  const curSets = activeSets(g.shelf, g.shelfSize);
  // 受注中の依頼(通常+大家)に必要な品種。陳列の在庫チップに ✉ を添える(可視化のみ)
  const orderNeeds = new Set();
  if (g.order) orderNeeds.add(g.order.specId);
  if (g.ooyaOrderState === "active") OOYA_ORDER.items.forEach(([id]) => orderNeeds.add(id));
  // 陳列在庫の固定ソート: 分類順(骨格→昆虫→液浸→鉱物→工芸)→ 同分類内は基準価の降順
  const CAT_SORT = ["bone", "insect", "wet", "mineral", "craft"];
  const shelfStock = [...specEntries].sort((a, b) => {
    const d = CAT_SORT.indexOf(SPECIMENS[baseId(a[0])].cat) - CAT_SORT.indexOf(SPECIMENS[baseId(b[0])].cat);
    return d || basePrice(g, b[0]) - basePrice(g, a[0]);
  });
  const daysToRent = (RENT_INTERVAL - (g.day % RENT_INTERVAL)) % RENT_INTERVAL;
  const aliasCat = g.alias;

  // 夜のカード送り用: 客の来店(カード対象)とそれ以外(通り名・イベント行など、サマリ行き)
  // 大家の家賃回収(t:"rent"+cid)も客と同じカードに昇格。見習い日当(cidなし)はサマリのまま
  const isCardEntry = (l) => l.cid && (l.t === "sale" || l.t === "misc" || l.t === "rent");
  const nightCust = g.nightLog.filter(isCardEntry);
  const nightSys = g.nightLog.filter((l) => !isCardEntry(l));
  const moonOpenLine = MOON_OPEN[moonPhase(g.day)]; // 満月/新月の晩の開店一言(他の相は空)

  // 夜の流れをステップ列に組む: 月独白 → 客(通常) → 閉店後 → 大家/蒐集家 → 月次記録
  const rentCard = nightCust.find((l) => l.t === "rent");
  const custCards = nightCust.filter((l) => l.t !== "rent"); // 通常客+蟲屋
  const collectorNight = !!g.offer || !!g.offerResult;
  const monthNight = g.day % 30 === 0;
  const nightSteps = [];
  if (moonOpenLine) nightSteps.push({ t: "moon" });
  custCards.forEach((l) => nightSteps.push({ t: "cust", l }));
  // 閉店後の格分け: 全面の一拍「——閉店後。」は蒐集家が来る夜だけ(非日常への期待に応える)。
  // 大家のみの夜(毎週の家賃回収)は一拍を出さず、大家カードの左上に小さく「閉店後」タグを載せるだけ。
  // 両方来る夜は 全面一拍 → 蒐集家 → 大家(タグ付き) の順。
  if (collectorNight) nightSteps.push({ t: "divider" });
  if (collectorNight) nightSteps.push({ t: "collector" });
  if (rentCard) nightSteps.push({ t: "rent", l: rentCard });
  if (monthNight) nightSteps.push({ t: "month" });
  const nightInSteps = g.phase === "night" && !nightView.collapsed && nightView.idx < nightSteps.length;
  const curStep = nightSteps[nightView.idx];
  // 多段カード(蟲屋初回の三段)は line3 があるものだけタップ送り
  // タップ送りカードの段数: line3付き(蟲屋初回・開店の夜)または tap指定(九枠買い)で 2〜3段
  const stepMaxSub = (s) => {
    if (!s || !s.l) return 1;
    const n = [s.l.line, s.l.line2, s.l.line3].filter(Boolean).length;
    return (s.l.line3 || s.l.tap) && n > 1 ? n : 1;
  };
  // 売上累計(これまでのステップの sale を合算)
  const nightEarnSoFar = nightSteps.slice(0, nightView.idx + 1)
    .filter((s) => s.l && s.l.t === "sale").reduce((n, s) => n + (s.l.price || 0), 0);
  const nightAdvance = () => setNightView((v) => {
    if (stepMaxSub(curStep) > 1 && v.sub < stepMaxSub(curStep)) return { ...v, sub: v.sub + 1 };
    return { ...v, idx: v.idx + 1, sub: 1 };
  });
  const nightCollapse = () => setNightView((v) => ({ ...v, collapsed: true }));
  // 「残りをまとめる」で畳む残りの客(現ステップ以降の cust)+ 家賃
  const moonOffset = moonOpenLine ? 1 : 0;
  const custSeen = Math.max(0, Math.min(custCards.length, nightView.idx - moonOffset));
  const foldedCards = [...custCards.slice(custSeen), ...(rentCard ? [rentCard] : [])];
  // 一度きりのイベントカード(就職=grad / 蟲屋初回=line3 / 開店の夜・九枠買い=tap)は「まとめる」でも潰さず個別カードで残す
  const isEventCard = (l) => !!l.grad || !!l.line3 || !!l.tap;
  const foldedEvents = foldedCards.filter(isEventCard);
  const foldedNormals = foldedCards.filter((l) => !isEventCard(l));
  // 現行の一覧ログ形式(まとめ表示・サマリで使う)
  const nightLogLine = (l, i) => (
    <div key={i} style={{
      display: "flex", alignItems: "flex-start", gap: 8,
      fontSize: 13, lineHeight: 1.7,
      color: l.t === "sale" ? C.ivory : l.t === "rent" ? C.red : l.t === "alias" || l.t === "event" ? C.brass : C.dim,
      borderLeft: `2px solid ${l.big ? "#e0b96a" : l.t === "sale" ? C.brass : l.t === "rent" ? C.red : l.t === "alias" || l.t === "event" ? C.brass : C.line}`,
      paddingLeft: 8,
      background: l.big ? "rgba(201,161,94,0.08)" : "transparent",
      borderRadius: 0, paddingTop: l.big ? 4 : 0, paddingBottom: l.big ? 4 : 0,
    }}>
      {l.cid && <Portrait cid={l.cid} imgs={imgs} fileImgs={fileImgs} size={30} />}
      <span>{l.text}</span>
    </div>
  );
  // 夜のカード(客・大家)。revealSub=何行目まで見せるか(蟲屋初回のタップ送り用。既定は全表示)
  const nightCardPanel = (l, revealSub = 99) => {
    const cust = CUSTOMERS.find((c) => c.id === l.cid);
    const custName = cust ? cust.name : (l.cid === "mushiya" ? MUSHIYA.name : l.cid === "ooya" ? OOYA.name : "");
    // タップ送りカード(蟲屋初回・開店の夜=3行 / 九枠買い=2行)。入れ替え式で現在の一言だけ見せる
    const lineArr = [l.line, l.line2, l.line3].filter(Boolean);
    const tap = (l.line3 || l.tap) && lineArr.length > 1;
    const showSaleRow = l.t === "sale" && (tap ? revealSub >= lineArr.length : true);
    const tapLine = lineArr[Math.min(revealSub, lineArr.length) - 1];
    return (
      <Panel style={{
        position: "relative",
        border: `1px solid ${l.big ? "#e0b96a" : C.line}`,
        boxShadow: l.big ? "0 0 14px rgba(201,161,94,0.15)" : "none",
        background: l.big && l.grad ? "#282013" : C.panel,
      }}>
        {l.t === "rent" && (
          <div style={{ position: "absolute", top: 6, left: 6, zIndex: 1, fontSize: 10, color: C.dim, letterSpacing: "0.06em", background: "rgba(20,17,13,0.85)", padding: "1px 6px", borderRadius: 0 }}>閉店後</div>
        )}
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <FramedPortrait cid={l.cid} imgs={imgs} fileImgs={fileImgs} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, letterSpacing: "0.1em", marginBottom: 6 }}>{custName}</div>
            {tap ? (
              <div style={{ fontSize: 13, lineHeight: 1.9, color: C.ivory }}>{withPeriod(tapLine)}</div>
            ) : (
              <>
                <div style={{ fontSize: 13, lineHeight: 1.9, color: l.line ? C.ivory : C.dim }}>
                  {l.line ? withPeriod(l.line) : (l.narr || l.text)}
                </div>
                {l.line2 && <div style={{ fontSize: 13, lineHeight: 1.9, color: C.ivory, marginTop: 6 }}>{withPeriod(l.line2)}</div>}
                {l.sub && <div style={{ fontSize: 12, lineHeight: 1.8, color: C.dim, marginTop: 8 }}>{l.sub}</div>}
              </>
            )}
          </div>
        </div>
        {showSaleRow && (
          <div style={{ marginTop: 10, borderTop: `1px solid ${l.grad ? "#e0b96a" : C.line}`, paddingTop: 8, display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <SpecIcon id={l.itemId} fileImgs={fileImgs} size={26} emojiSize={16} />
            <span>{specOf(l.itemId).name}</span>
            <span style={{ marginLeft: "auto", color: l.grad ? "#e0b96a" : C.brass, fontVariantNumeric: "tabular-nums" }}>{l.price} G</span>
          </div>
        )}
        {l.t === "rent" && l.payLabel && (
          <div style={{ marginTop: 10, borderTop: `1px solid ${C.line}`, paddingTop: 8, display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ color: C.dim }}>支払い</span>
            <span style={{ marginLeft: "auto", color: C.red, fontVariantNumeric: "tabular-nums" }}>{l.payLabel}</span>
          </div>
        )}
      </Panel>
    );
  };
  // 地の文だけの一拍(閉店後の区切り)
  const nightBeatPanel = (text) => (
    <div style={{ minHeight: 160, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div style={{ fontSize: 14, color: C.dim, lineHeight: 2, textAlign: "center", letterSpacing: "0.08em" }}>{text}</div>
    </div>
  );
  // 月の独白の一拍。空の画像(満月=full/新月=new)があれば、カード全幅の金枠の上部に
  // 全幅背景として画像を敷き、下部の帯に独白を置く。画像が無ければ従来どおり地の文のみ。
  const moonBeatPanel = (text) => {
    const ph = moonPhase(g.day);
    const skyUrl = fileImgs && fileImgs.sky && (ph === 4 ? fileImgs.sky.full : ph === 0 ? fileImgs.sky.new : null);
    if (!skyUrl) return <Panel style={{ animation: FADE }}>{nightBeatPanel(text)}</Panel>;
    return (
      <div style={{ border: `1px solid ${C.brass}`, borderRadius: 0, overflow: "hidden", background: C.panel, boxShadow: "0 0 14px rgba(201,161,94,0.12)", animation: FADE }}>
        {/* 上部: 空画像を全幅背景で。cover+FILE_ZOOM.sky で外周の白フチ・黒台紙を枠外へ。角丸はカード枠に追従 */}
        <div style={{ aspectRatio: "16 / 9", overflow: "hidden", background: "#0e0b08" }}>
          <img src={skyUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transform: `scale(${FILE_ZOOM.sky})` }} />
        </div>
        {/* 下部の帯: 独白の地の文 */}
        <div style={{ padding: "16px 16px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 14, color: C.dim, lineHeight: 2, letterSpacing: "0.08em" }}>{text}</div>
        </div>
      </div>
    );
  };
  // 蒐集家の交渉パネル(未解決なら交渉、解決後は結果)
  const collectorPanel = () => {
    if (g.offer) {
      const sp = SPECIMENS[g.offer.specId];
      const base = basePrice(g, g.offer.specId);
      const fair = round5(base * 1.6), high = round5(base * 2.2);
      const trust = g.trust || 0;
      const appearLine = trust <= -2 ? COLLECTOR.appearCold : trust >= 2 ? COLLECTOR.appearWarm : COLLECTOR.appear;
      return (
        <Panel style={{ borderColor: C.night }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Portrait cid="collector" imgs={imgs} fileImgs={fileImgs} size={40} />
            <div style={{ fontSize: 12, color: C.night, letterSpacing: "0.15em" }}>{COLLECTOR.name}</div>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.9, color: C.ivory }}>
            {withPeriod(appearLine)}<br />
            {withPeriod(COLLECTOR.want(sp.name))}
          </div>
          <div style={{ fontSize: 11, color: C.dim, margin: "6px 0" }}>{sp.icon} {sp.name}(基準 {round5(base)}G)を望んでいる</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            <Btn primary onClick={() => resolveOffer("fair")}>言い値で売る {fair}G</Btn>
            <Btn onClick={() => resolveOffer("high")}>ふっかける {high}G(賭け)</Btn>
            <Btn onClick={() => resolveOffer("refuse")}>断る</Btn>
          </div>
        </Panel>
      );
    }
    if (g.offerResult) return (
      <Panel style={{ borderColor: C.night }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Portrait cid="collector" imgs={imgs} fileImgs={fileImgs} size={40} />
          <div style={{ fontSize: 12, color: C.night, letterSpacing: "0.15em" }}>{COLLECTOR.name}</div>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.8, color: C.ivory }}>{g.offerResult}</div>
      </Panel>
    );
    return null;
  };
  // 月次記録パネル(30日ごと。カード送りの最後の一枚。金縁)
  const monthPanel = () => (
    <Panel style={{ border: `1px solid ${C.brass}`, boxShadow: "0 0 12px rgba(201,161,94,0.12)" }}>
      <div style={{ fontSize: 13, color: C.brass, letterSpacing: "0.2em", marginBottom: 6 }}>{g.day / 30}ヶ月目の記録</div>
      <div style={{ fontSize: 13, lineHeight: 2 }}>
        累計売上 {g.totalEarn}G / 販売数 {g.totalSold}点<br />
        図鑑 {knownSpecs.size}/{specTotal} 種 / 銘板 {g.knownSets.length}/{SETS.length} / 評判 {g.rep}<br />
        <span style={{ color: C.dim, fontSize: 12 }}>
          {MONTH_REMARKS[Math.min(g.day / 30, 4) - 1]}
        </span>
      </div>
    </Panel>
  );

  // 二次加工マーク: '⚒'=発見済みの次加工あり '?'=未知の次加工あり
  const nextMark = (specId) => {
    const rid = SECONDARY[specId]; if (!rid) return null;
    return g.known.includes(rid) ? null : "?"; // 未発見の二次加工にのみ「?」。⚒(発見済み)マークは廃止
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.ivory, fontFamily: "Georgia, 'Yu Mincho', serif" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", paddingTop: "calc(12px + env(safe-area-inset-top, 0px))", paddingLeft: 12, paddingRight: 12, paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))" }}>

        {/* ヘッダー(左右ブロックの下端を揃える。所持金をスコアとして主役に) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 10, borderBottom: `1px solid ${C.line}`, paddingBottom: 8, marginBottom: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.3em", color: C.dim, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>骨と硝子の店</div>
            {(aliasCat || g.anaAlias || g.banshoAlias) && (
              <div style={{ fontSize: 10, letterSpacing: "0.15em", color: C.brass, whiteSpace: "nowrap" }}>
                人呼んで{aliasCat && `『${ALIASES[aliasCat].name}』`}{g.anaAlias && `『${ANA_ALIAS.name}』`}{g.banshoAlias && `『${BANSHO.name}』`}
              </div>
            )}
            <div style={{ fontSize: 16, letterSpacing: "0.1em", whiteSpace: "nowrap" }}>{g.day}日目 <MoonIcon day={g.day} fileImgs={fileImgs} size={14} /> <span style={{ color: C.brass }}>{PHASE_LABEL[g.phase]}</span></div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "0.03em", lineHeight: 1.2, color: g.gold < 0 ? C.red : C.brass, fontVariantNumeric: "tabular-nums" }}>{g.gold} G{g.gold < 0 ? "(借金)" : ""}</div>
            <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>評判 {g.rep} · {g.ownShop
              ? <span style={{ color: C.glass }}>自分の店</span>
              : <span style={{ color: daysToRent === 0 ? C.red : C.dim }}>{daysToRent === 0 ? "今夜家賃" : `家賃${rentFor(g.rep)}Gまで${daysToRent}日`}</span>}</div>
          </div>
        </div>

        {/* ===== 朝 ===== */}
        {g.phase === "morning" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {g.apprenticeMorning && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, lineHeight: 1.9, color: C.ivory, borderLeft: `2px solid ${C.brass}`, paddingLeft: 8 }}>
                <span style={{ fontSize: 16 }}>📄</span>
                <span>{APPRENTICE_INTRO}</span>
              </div>
            )}
            {g.banshoMorning && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, lineHeight: 1.9, color: C.brass, borderLeft: `2px solid ${C.brass}`, paddingLeft: 8 }}>
                <span style={{ fontSize: 15 }}>✦</span>
                <span>{BANSHO.morning}</span>
              </div>
            )}
            {g.mushiMorning && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, lineHeight: 1.8, color: C.red, borderLeft: `2px solid ${C.red}`, paddingLeft: 8 }}>
                <span style={{ fontSize: 16 }}>🐛</span>
                <span>{mushiDiscover(g.mushiMorning)}</span>
              </div>
            )}
            {caveEvent && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: C.brass, lineHeight: 1.8, borderLeft: `2px solid ${C.brass}`, paddingLeft: 8 }}>
                <Portrait cid="saisyuunin" imgs={imgs} fileImgs={fileImgs} size={30} />
                <span>{caveEvent}</span>
              </div>
            )}
            {g.moonReport && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: C.brass, lineHeight: 1.8, borderLeft: `2px solid ${C.brass}`, paddingLeft: 8 }}>
                <Portrait cid="saisyuunin" imgs={imgs} fileImgs={fileImgs} size={30} />
                <span>{MOON_REPORT}</span>
              </div>
            )}
            {g.kaniRescue && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, lineHeight: 1.9, color: C.ivory, borderLeft: `2px solid ${C.brass}`, paddingLeft: 8 }}>
                <span style={{ fontSize: 16 }}>🦀</span>
                <span>{KANI_RESCUE}</span>
              </div>
            )}
            {g.orderExpired && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, lineHeight: 1.8, color: C.red, borderLeft: `2px solid ${C.red}`, paddingLeft: 8 }}>
                <span style={{ fontSize: 15 }}>✉</span>
                <span>{ORDER_EXPIRED_LOG}</span>
              </div>
            )}
            {/* 倉庫: 角丸なし(スクエア)・枠線なし。Ivoryを薄く敷いて帳面の頁の淡い紙色に */}
            <div style={{ background: "rgba(232,220,196,0.035)", padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <div style={{ fontSize: 11, color: C.dim }}>倉庫</div>
                {wormCount > 0 && g.mushiFirstDone && (
                  <button onClick={() => setBurnConfirm(true)}
                    style={{ fontFamily: "inherit", cursor: "pointer", fontSize: 11, color: C.red, background: "none", border: `1px solid ${C.red}`, borderRadius: 3, padding: "2px 8px" }}>
                    虫食いを焚き付けに
                  </button>
                )}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.9 }}>
                {invEntries.length ? invEntries.map(([k, v]) => <span key={k} style={{ marginRight: 10, whiteSpace: "nowrap" }}><MatIcon id={k} fileImgs={fileImgs} emojiSize={13} />{itemName(k)} <span style={{ opacity: 0.6 }}>{v}</span></span>) : <span style={{ color: C.dim }}>空っぽだ</span>}
              </div>
            </div>
            {/* 特注: 未受領の手紙(倉庫の下) */}
            {g.letter && (() => {
              const cust = CUSTOMERS.find((c) => c.id === g.letter.client);
              return (
                <div onClick={() => setShowLetter(true)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, padding: "9px 2px", fontSize: 13, color: C.ivory }}>
                  <span style={{ fontSize: 15 }}>✉</span>
                  <span>{cust ? cust.name : ""}から手紙が届いている</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: C.dim }}>開く ▸</span>
                </div>
              );
            })()}
            {/* 特注: 受領済みの依頼カード(スクエア・罫線区切り) */}
            {g.order && (() => {
              const o = g.order;
              const cust = CUSTOMERS.find((c) => c.id === o.client);
              const have = g.spec[o.specId] || 0;
              const ready = have >= o.qty;
              const remain = o.dueDay - g.day;
              return (
                <div style={{ borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, padding: "10px 2px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Portrait cid={o.client} imgs={imgs} fileImgs={fileImgs} size={30} />
                    <div style={{ fontSize: 13 }}>{cust ? cust.name : ""}の特注</div>
                    <div style={{ marginLeft: "auto", fontSize: 11, color: remain <= 1 ? C.red : C.dim }}>納期 残り{remain}日</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <SpecIcon id={o.specId} fileImgs={fileImgs} size={26} emojiSize={16} />
                    <span>{SPECIMENS[o.specId].name} × {o.qty}</span>
                    <span style={{ marginLeft: "auto", color: C.brass }}>報酬 {o.reward}G</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={() => setDeclineConfirm(true)}
                      style={{ fontFamily: "inherit", cursor: "pointer", fontSize: 11, color: C.dim, background: "none", border: "none", padding: "4px 0", textDecoration: "underline", textUnderlineOffset: 3 }}>
                      断りの手紙を出す
                    </button>
                    {!ready && <span style={{ fontSize: 11, color: C.dim, marginLeft: "auto" }}>倉庫に {have}/{o.qty}</span>}
                    <Btn primary={ready} disabled={!ready} onClick={deliverOrder} style={{ marginLeft: ready ? "auto" : 0 }}>納品する</Btn>
                  </div>
                </div>
              );
            })()}
            {/* 大家の依頼(無期限・破棄不可・部分納品可)。デフォルト折りたたみ・特別装飾なし */}
            {g.ooyaOrderState === "active" && (() => {
              const items = OOYA_ORDER.items.map(([id, need]) => {
                const have = g.spec[id] || 0;
                const done = g.ooyaDelivered[id] || 0;
                return { id, need, have, done };
              });
              const canDeliver = items.some((it) => it.done < it.need && it.have > 0);
              // 折りたたみ時: 一行のみ(大家の依頼 ▸ 納期 ──)
              if (!ooyaCardOpen) return (
                <div onClick={() => setOoyaCardOpen(true)}
                  style={{ cursor: "pointer", borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, padding: "10px 2px", display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <span>{OOYA_ORDER.name}</span>
                  <span style={{ fontSize: 11, color: C.dim }}>▸</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: C.dim }}>納期 ──</span>
                </div>
              );
              // 展開時: 明細(4品・進捗・納品ボタン)。見出しタップで畳む
              return (
                <div style={{ borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, padding: "10px 2px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div onClick={() => setOoyaCardOpen(false)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                    <Portrait cid="ooya" imgs={imgs} fileImgs={fileImgs} size={30} />
                    <div style={{ fontSize: 13 }}>{OOYA_ORDER.name}</div>
                    <span style={{ fontSize: 11, color: C.dim }}>▾</span>
                    <div style={{ marginLeft: "auto", fontSize: 11, color: C.dim }}>納期 ──</div>
                  </div>
                  {items.map((it) => (
                    <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                      <SpecIcon id={it.id} fileImgs={fileImgs} size={26} emojiSize={16} />
                      <span>{SPECIMENS[it.id].name} × {it.need}</span>
                      <span style={{ marginLeft: "auto", fontSize: 11, color: it.done >= it.need ? C.glass : C.dim }}>
                        {it.done >= it.need ? "納品済" : `${it.done}/${it.need}${it.have > 0 ? `(倉庫${it.have})` : ""}`}
                      </span>
                    </div>
                  ))}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: C.brass }}>報酬 {OOYA_ORDER.reward}</span>
                    <Btn primary={canDeliver} disabled={!canDeliver} onClick={deliverOoyaOrder} style={{ marginLeft: "auto" }}>納品する</Btn>
                  </div>
                </div>
              );
            })()}
            <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.8 }}>夜のうちに届いた依頼票に目を通す。今日はどこへ人をやろうか。</div>
            {SITES.filter((s) =>
              s.id === "shitsugen" ? g.swampUnlocked : s.id === "doukutsu" ? g.caveUnlocked
              : s.id === "haikou" ? g.haikouUnlocked : true
            ).map((s) => {
              const siteBg = fileImgs && fileImgs.sites && fileImgs.sites[s.id];
              const inner = (
                <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 15 }}>{s.name} <span style={{ color: C.brass, fontSize: 13 }}>{s.cost}G</span>
                      {(g.siteCount[s.id] || 0) >= 7 && <span style={{ fontSize: 10, color: C.dim, marginLeft: 6 }}>馴染みの地</span>}
                    </div>
                    <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{s.desc}</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>{s.table.map(([m]) => <MatIcon key={m} id={m} fileImgs={fileImgs} emojiSize={12} style={{ marginRight: 5 }} />)}</div>
                  </div>
                  <Btn onClick={() => gather(s)} disabled={g.gold < s.cost}>採集依頼</Btn>
                </div>
              );
              // 背景画像あり: 枠なしの背景帯(暗幕維持)に文字を直接載せる / 画像なし: 従来の枠つき角丸パネル
              if (siteBg) return (
                <div key={s.id} style={{ position: "relative", overflow: "hidden", padding: 12 }}>
                  <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${siteBg})`, backgroundSize: "cover", backgroundPosition: "center", transform: `scale(${FILE_ZOOM.site})` }} />
                  <div style={{ position: "absolute", inset: 0, background: "rgba(20,17,13,0.7)" }} />
                  {inner}
                </div>
              );
              return <Panel key={s.id}>{inner}</Panel>;
            })}
            {/* 古物市: 枠なし+罫線一本。調度屋と同じ行形式(左に品名・所持数、右に購入ボタン) */}
            <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
              <div style={{ fontSize: 15, marginBottom: 8 }}>古物市 <span style={{ fontSize: 11, color: C.dim }}>資材の買い付け</span></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {SUPPLY_SHOP.map((s) => (
                  <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 13, minWidth: 0 }}>
                      <MatIcon id={s.id} fileImgs={fileImgs} emojiSize={13} /> {itemName(s.id)} <span style={{ fontSize: 11, color: C.dim }}>{s.cost}G · 所持{g.inv[s.id] || 0}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <Btn onClick={() => buySupply(s, 1)} disabled={g.gold < s.cost} style={{ fontSize: 13 }}>+1</Btn>
                      <Btn onClick={() => buySupply(s, 5)} disabled={g.gold < s.cost * 5} style={{ fontSize: 13 }}>+5</Btn>
                    </div>
                  </div>
                ))}
                {g.mushiFirstDone && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 13, minWidth: 0 }}>{CAMPHOR.icon} 樟脳 <span style={{ fontSize: 11, color: C.dim }}>残り{g.camphor}晩</span>
                      <div style={{ fontSize: 11, color: C.dim, marginTop: 1 }}>{CAMPHOR.desc}</div>
                    </div>
                    <Btn onClick={buyCamphor} disabled={g.gold < CAMPHOR.cost || g.camphor > 0} style={{ flexShrink: 0 }}>{CAMPHOR.cost}G</Btn>
                  </div>
                )}
              </div>
            </div>
            {/* 見習い: 枠なし+罫線一本 */}
            {g.rep >= 20 && (
              <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 15 }}>見習い <span style={{ fontSize: 11, color: C.dim }}>日当70G</span></div>
                  <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>
                    {g.apprentice ? "見習いは朝から工房にいる(作業+1)" : "雇えば朝から工房に立つ(作業+1)"}
                  </div>
                </div>
                <Btn onClick={toggleApprentice} style={{ flexShrink: 0 }}>{g.apprentice ? "休ませる" : "雇う"}</Btn>
              </div>
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
              <div style={{ fontSize: 11, color: C.dim, marginBottom: 6 }}>作業台に載せる</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", maxHeight: 220, overflowY: "auto", paddingBottom: 2 }}>
                {[...invEntries.filter(([k]) => !MATERIALS[k].supply), ...specEntries.filter(([k]) => craftables(k).length)].map(([k, v]) => {
                  const mk = SPECIMENS[k] ? nextMark(k) : null;
                  return (
                    <button key={k} onClick={() => setSel(k === sel ? null : k)}
                      style={{
                        fontFamily: "inherit", cursor: "pointer", fontSize: 13, padding: "6px 9px", borderRadius: 4,
                        background: sel === k ? C.brass : C.panelHi, color: sel === k ? "#1a140c" : C.ivory,
                        border: `1px solid ${sel === k ? C.brass : C.line}`,
                        whiteSpace: "nowrap", flexShrink: 0,
                      }}>{MATERIALS[k] ? <MatIcon id={k} fileImgs={fileImgs} emojiSize={13} /> : itemIcon(k)} {itemName(k)} <span style={{ opacity: 0.6 }}>{v}</span>{mk && <span style={{ color: sel === k ? "#1a140c" : C.glass, marginLeft: 4 }}>{mk}</span>}</button>
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
                        <span style={{ fontSize: 10, marginLeft: 5, padding: "0 4px", borderRadius: 0, border: `1px solid ${lvOk ? C.line : C.red}`, color: lvOk ? C.dim : C.red, whiteSpace: "nowrap" }}>要Lv{r.minLv}</span>
                      )}
                      {sel && possible && p.needs && (
                        <div style={{ fontSize: 10, color: (g.inv[p.needs] || 0) > 0 ? C.glass : C.red, marginTop: 2 }}>要 {itemIcon(p.needs)}{itemName(p.needs)}(所持{g.inv[p.needs] || 0})</div>
                      )}
                      {/* 素材未選択のあいだは説明を畳み、一画面に収める */}
                      {sel && (
                        <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>
                          {!possible ? "この素材には合わないようだ"
                            : !lvOk ? `熟練が足りない — ${p.name}Lv${r.minLv}になれば、何かできそうだ`
                            : known ? `→ ${SPECIMENS[r.to].icon} ${SPECIMENS[r.to].name}(基準 ${round5(basePrice(g, r.to))}G${(g.spec[r.to] || 0) > 0 ? ` · 在庫${g.spec[r.to]}` : ""})`
                            : "→ ??? 何ができるかは、やってみないと分からない"}
                        </div>
                      )}
                      {sel && possible && (
                        <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
                          <Btn primary={!disabled} disabled={disabled} onClick={() => doCraft(r, 1)} style={{ fontSize: 12, padding: "5px 10px", whiteSpace: "nowrap" }}>仕立てる</Btn>
                          {/* Lv3特典は到達するまで見せない。かつ初めての品(製作履歴なし)は「2個仕立てる」を出さない */}
                          {lv >= 3 && r && g.made[r.to] && (
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
            {/* 硝子の花籠: 非売の常設飾り。棚枠の外・上部に控えめに表示 */}
            {g.hanakagoState === "done" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${C.line}`, paddingBottom: 8, fontSize: 12 }}>
                <SpecIcon id={HANAKAGO} fileImgs={fileImgs} size={28} emojiSize={18} />
                <span style={{ color: C.ivory }}>{SPECIMENS[HANAKAGO].name}</span>
                <span style={{ marginLeft: "auto", color: C.brass, fontSize: 11, letterSpacing: "0.1em" }}>非売</span>
              </div>
            )}
            <div style={{ fontSize: 12, color: C.dim }}>硝子棚に並べる。同じ分類を隣り合わせると値打ちが上がり、良い組み合わせには銘板が掲がる。</div>

            {/* 硝子棚: 各段の下に一枚の硝子板(skewで奥行き)を敷き、品物が板の上に立つ。面はスクエア */}
            <div style={{ background: "#171310", border: `1px solid ${C.line}`, padding: "14px 12px 6px" }}>
              {[0, 1, 2].map((row) => {
                // 3段目(6〜8枠)はサイズ7以上のときだけ下に生える
                if (row === 2 && g.shelfSize <= 6) return null;
                const idxs = [row * 3, row * 3 + 1, row * 3 + 2];
                const rowLocked = idxs.some((i) => i >= g.shelfSize); // ロック枠を含む段は板を半透明に
                return (
                  <div key={row} style={{ marginBottom: 7 }}>
                    {/* 品物(硝子板の上に立つ。底=足元を板の上辺に接地) */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", alignItems: "end" }}>
                      {idxs.map((i) => {
                        const id = g.shelf[i];
                        const locked = i >= g.shelfSize;
                        if (locked) return (
                          <div key={i} style={{ minHeight: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 6, fontSize: 10, color: "#5a4f3d" }}>増設で解放</div>
                        );
                        const bonus = adjBonus(g.shelf, i, g.shelfSize);
                        const inSet = curSets.some((s) => s.members.includes(id));
                        const sel = shelfPickFor === i;
                        return (
                          <button key={i} onClick={() => setShelfPickFor(sel ? null : i)}
                            style={{
                              fontFamily: "inherit", cursor: "pointer",
                              background: sel ? "rgba(201,161,94,0.12)" : "transparent",
                              border: "none", outline: sel ? `1px solid ${C.brass}` : "none",
                              borderRadius: 6, color: C.ivory, padding: "6px 3px 2px", minHeight: 100,
                              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 4,
                            }}>
                            {id ? (
                              <>
                                <SpecIcon id={id} fileImgs={fileImgs} size={48} emojiSize={40} />
                                <div style={{ fontSize: 11, textAlign: "center", lineHeight: 1.25, color: isWorm(id) ? C.dim : C.ivory }}>{specOf(id).name}</div>
                                {/* 値札: 品物の足元、板の上に置かれた小札(スクエア)。
                                    高さを固定し、✦/↑ のグリフ高さに依存せず接地線を保つ */}
                                <div style={{ fontSize: 12, lineHeight: 1, height: 20, boxSizing: "border-box", display: "inline-flex", alignItems: "center", justifyContent: "center", color: inSet ? C.brass : bonus ? C.glass : C.brass, background: "rgba(20,17,13,0.6)", padding: "0 7px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                                  {shelfPrice(g, i, curSets)}G{inSet ? " ✦" : bonus ? " ↑" : ""}
                                </div>
                              </>
                            ) : (
                              <div style={{ fontSize: 11, color: C.dim, paddingBottom: 4 }}>空き棚</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {/* 硝子板: 段の全幅を貫く一枚。手前の厚みを増し、上辺に硝子のハイライト・下に落ち影で奥行き。
                        ロック段(増設で解放を含む)は半透明にして未成立を示す */}
                    <div style={{ height: 30, transform: "skewX(-10deg)", opacity: rowLocked ? 0.4 : 1,
                      background: "linear-gradient(to bottom, rgba(190,214,205,0.28) 0, rgba(127,160,122,0.20) 22%, rgba(127,160,122,0.06) 100%)",
                      borderTop: "1.5px solid rgba(200,222,214,0.5)", boxShadow: "0 5px 9px rgba(0,0,0,0.45)" }} />
                  </div>
                );
              })}
              {curSets.length > 0 && (
                <div style={{ marginTop: 8, borderTop: `1px solid ${C.line}`, paddingTop: 6, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {curSets.map((s) => {
                    const inviteIds = s.invites || (s.invite ? [s.invite] : []);
                    const label = inviteIds.includes("collector") ? "夜の気配"
                      : inviteIds.map((id) => CUSTOMERS.find((c) => c.id === id).name).join("・") + "を呼ぶ";
                    return (
                      <span key={s.id} style={{ fontSize: 11, color: C.brass, border: `1px solid ${C.brass}`, borderRadius: 0, padding: "1px 7px" }}>
                        ✦ {s.name} — {label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {shelfPickFor !== null && (
              <Panel>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 6 }}>棚 {shelfPickFor + 1} に置くもの</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {g.shelf[shelfPickFor] && <Btn onClick={() => placeOnShelf(shelfPickFor, null)} style={{ fontSize: 12 }}>下げる</Btn>}
                  {shelfStock.map(([k, v]) => {
                    const mk = nextMark(k);
                    return (
                      <Btn key={k} onClick={() => placeOnShelf(shelfPickFor, k)} style={{ fontSize: 12 }}>
                        <SpecIcon id={k} fileImgs={fileImgs} size={18} emojiSize={13} /> {specOf(k).name} <span style={{ opacity: 0.6 }}>{v}</span>
                        {orderNeeds.has(k) && <span style={{ marginLeft: 4 }}>✉</span>}
                        {!isWorm(k) && SPECIMENS[k].tags.map((t) => <TagChip key={t} t={t} />)}
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

        {/* ===== 夜(カード送り) ===== */}
        {g.phase === "night" && nightInSteps && (() => {
          const s = curStep;
          const canFold = s.t === "moon" || s.t === "cust"; // 「残りをまとめる」は客の間だけ
          const isCollector = s.t === "collector";
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: 11, color: C.dim, letterSpacing: "0.2em" }}>本日の営業</div>
                <div style={{ fontSize: 11, color: C.dim, fontVariantNumeric: "tabular-nums" }}>{nightView.idx + 1} / {nightSteps.length}</div>
              </div>

              {isCollector ? (
                // 蒐集家: 交渉が済むまで送れない。済んだら「次へ」で進む
                <>
                  {collectorPanel()}
                  {g.offerResult && <Btn primary onClick={nightAdvance} style={{ marginLeft: "auto" }}>次へ →</Btn>}
                </>
              ) : (
                <>
                  {/* 客カードは静止(key固定で再マウントさせない)。月/閉店後の一拍だけフェードで溶ける */}
                  <div key={s.t === "cust" ? "cust" : s.t + nightView.idx} onClick={nightAdvance} style={{ cursor: "pointer" }}>
                    {s.t === "moon" ? moonBeatPanel(moonOpenLine)
                      : s.t === "divider" ? <Panel style={{ animation: FADE }}>{nightBeatPanel("——閉店後。")}</Panel>
                      : s.t === "month" ? monthPanel()
                      : nightCardPanel(s.l, s.l && (s.l.line3 || s.l.tap) ? nightView.sub : 99)}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {canFold && <Btn onClick={nightCollapse} style={{ fontSize: 12 }}>残りをまとめる</Btn>}
                    <Btn primary onClick={nightAdvance} style={{ marginLeft: "auto" }}>次へ →</Btn>
                  </div>
                </>
              )}
            </div>
          );
        })()}
        {g.phase === "night" && !nightInSteps && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* まとめた場合: 一度きりのイベントカードは個別カードで残し、通常客だけ一覧ログに畳む */}
            {nightView.collapsed && foldedEvents.map((l, i) => (
              <div key={"ev" + i}>{nightCardPanel(l, 99)}</div>
            ))}
            {nightView.collapsed && foldedNormals.length > 0 && (
              <Panel>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 8, letterSpacing: "0.2em" }}>そのあとの客</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {foldedNormals.map(nightLogLine)}
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

            {/* まとめた場合でも蒐集家はスキップ不可。カード送りで済ませていれば表示しない */}
            {nightView.collapsed && collectorPanel()}

            {!g.ownShop && daysToRent === 1 && <div style={{ fontSize: 12, color: C.red, textAlign: "center" }}>明日は家賃の日({rentFor(g.rep)}G)。</div>}

            {/* まとめた場合の月次記録(カード送りで見ていなければ) */}
            {nightView.collapsed && monthNight && monthPanel()}
          </div>
        )}

        {/* ===== 図鑑(タブ付き) ===== */}
        {showBook && (
          <div onClick={() => setShowBook(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: C.panel, border: `1px solid ${C.brass}`, borderRadius: 4, padding: 16, maxWidth: 480, width: "100%", maxHeight: "82vh", overflowY: "auto" }}>
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
                      // 花籠は発見するまで枠ごと伏せる(標本タブの最後・非売)
                      if (id === HANAKAGO && !found) return null;
                      const recipe = found ? RECIPES.find((r) => r.to === id) : null;
                      return (
                        <div key={id} onClick={() => found && setBookDetail(id)}
                          style={{ border: `1px solid ${C.line}`, borderRadius: 5, padding: 8, opacity: found ? 1 : 0.45, cursor: found ? "pointer" : "default" }}>
                          <div style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}>
                            {found ? <SpecIcon id={id} fileImgs={fileImgs} size={28} emojiSize={13} /> : "▪"} <span>{found ? s.name : "?????"}</span>
                          </div>
                          <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>
                            {found ? <>{CAT_NAME[s.cat]} · {s.nosale ? "非売" : `${s.price}G`}{s.tags.map((t) => <TagChip key={t} t={t} />)}</> : "未発見"}
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
                  {/* 隠し枠「穴物堂」: 獲得後のみ表示(未獲得時は一切出さない) */}
                  {g.anaAlias && (
                    <div style={{ border: `1px solid ${C.brass}`, borderRadius: 5, padding: 8 }}>
                      <div style={{ fontSize: 13, color: C.brass }}>『{ANA_ALIAS.name}』</div>
                      <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{ANA_ALIAS.desc}</div>
                    </div>
                  )}
                  {/* 「万象堂」: 花籠完成後のみ表示(独立枠) */}
                  {g.banshoAlias && (
                    <div style={{ border: `1px solid ${C.brass}`, borderRadius: 5, padding: 8 }}>
                      <div style={{ fontSize: 13, color: C.brass }}>『{BANSHO.name}』</div>
                      <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{BANSHO.desc}</div>
                    </div>
                  )}
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
              <div onClick={(e) => e.stopPropagation()} style={{ background: C.panel, border: `1px solid ${C.brass}`, borderRadius: 4, padding: 16, maxWidth: 380, width: "100%", maxHeight: "82vh", overflowY: "auto" }}>
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
                  {CAT_NAME[s.cat]} · {s.nosale ? "非売" : `${s.price}G`}{s.tags.map((t) => <TagChip key={t} t={t} />)}
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

        {/* ===== 帳簿(店史) ===== */}
        {showLedger && (() => {
          const maxEntry = (obj) => {
            let bk = null, bn = 0;
            for (const [k, v] of Object.entries(obj || {})) if (v > bn) { bk = k; bn = v; }
            return [bk, bn];
          };
          const [topItem] = maxEntry(g.soldByItem);
          const [topCat] = maxEntry(g.soldByCat);
          // 客層別: 若い研究者は学生に合算。最多が同数で並んでいる間は「最多」が立たない
          const custTally = {};
          Object.entries(g.soldByCust || {}).forEach(([k, v]) => {
            const key = k === "wakate" ? "gakusei" : k;
            custTally[key] = (custTally[key] || 0) + v;
          });
          const [topCust, topCustN] = maxEntry(custTally);
          const custTie = Object.values(custTally).filter((v) => v === topCustN).length > 1;
          const custName = (id) => (CUSTOMERS.find((c) => c.id === id) || {}).name || "";
          const months = [...(g.monthly || [])].reverse(); // 新しい順
          const tally = [
            ["一番売った品", topItem ? SPECIMENS[topItem].name : "──"],
            ["一番売った分類", topCat ? CAT_NAME[topCat] : "──"],
            ["一番売れた客層", topCust && !custTie ? custName(topCust) : "──"],
            ["最高月商", `${g.bestMonthEarn || 0}G`],
            ["通り名の変遷", g.aliasHistory.length ? g.aliasHistory.map((c) => ALIASES[c].name).join(" → ") : "──"],
          ];
          const title = topCust && !custTie ? LEDGER_TITLES[topCust] : null;
          return (
            <div onClick={() => setShowLedger(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 }}>
              <div onClick={(e) => e.stopPropagation()} style={{ background: C.panel, border: `1px solid ${C.brass}`, borderRadius: 4, padding: 16, maxWidth: 480, width: "100%", maxHeight: "82vh", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ letterSpacing: "0.25em", color: C.brass, fontSize: 13 }}>帳簿</div>
                  <button onClick={() => setShowLedger(false)} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontFamily: "inherit" }}>閉じる</button>
                </div>
                {/* 月ごとの頁(歴代の月次記録・新しい順)。旧セーブは末尾(記録の始まりより前)に喪失の一行 */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {months.map((r) => (
                    <div key={r.m} style={{ borderTop: `1px solid ${C.line}`, padding: "8px 2px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13 }}>
                        <span style={{ color: C.brass }}>{r.m}ヶ月目</span>
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>売上 {r.earn}G</span>
                      </div>
                      <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>
                        販売 {r.sold}点 · 評判 {r.rep} · {r.alias ? `『${ALIASES[r.alias].name}』` : "──"}
                      </div>
                    </div>
                  ))}
                  {g.historyLost && (
                    <div style={{ borderTop: `1px solid ${C.line}`, padding: "8px 2px", fontSize: 12, color: C.dim, lineHeight: 1.8 }}>{LEDGER_LOST}</div>
                  )}
                </div>
                {/* 集計欄 */}
                <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 4, paddingTop: 10 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {tally.map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, fontSize: 13 }}>
                        <span style={{ color: C.dim, fontSize: 12, whiteSpace: "nowrap" }}>{k}</span>
                        <span style={{ textAlign: "right" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  {/* 客層称号(通算の最多客層に応じて一行) */}
                  {title && <div style={{ marginTop: 12, fontSize: 12, color: C.dim, lineHeight: 1.8 }}>{title}</div>}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ===== 調度屋(棚増設・内装) ===== */}
        {showDecor && (
          <div onClick={() => setShowDecor(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 50 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: C.panel, border: `1px solid ${C.brass}`, borderRadius: 4, padding: 16, maxWidth: 480, width: "100%", maxHeight: "82vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ letterSpacing: "0.25em", color: C.brass, fontSize: 13 }}>調度屋 — 店の誂え</div>
                <button onClick={() => setShowDecor(false)} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontFamily: "inherit" }}>閉じる</button>
              </div>
              {/* 見出し直下の帯画像(採集地背景と同様のトリム・スクエア)。画像がなければ現状のまま */}
              {fileImgs && fileImgs.misc && fileImgs.misc.choudoya && (
                <div style={{ overflow: "hidden", background: "#0e0b08", marginTop: 8 }}>
                  <div style={{ aspectRatio: "16 / 7", overflow: "hidden" }}>
                    <img src={fileImgs.misc.choudoya} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transform: `scale(${FILE_ZOOM.site})` }} />
                  </div>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                {SHELF_EXPAND[g.shelfSize + 1] && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 13 }}>硝子棚の増設({g.shelfSize}→{g.shelfSize + 1}枠)<div style={{ fontSize: 11, color: C.dim }}>大工に頼んで棚を継ぎ足す</div></div>
                    <Btn onClick={expandShelf} disabled={g.gold < SHELF_EXPAND[g.shelfSize + 1]}>{SHELF_EXPAND[g.shelfSize + 1]}G</Btn>
                  </div>
                )}
                {DECOR.map((d) => (
                  <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", opacity: g.decor[d.id] ? 0.55 : 1 }}>
                    <div style={{ fontSize: 13 }}>{d.name}<div style={{ fontSize: 11, color: C.dim }}>{d.desc}</div></div>
                    {g.decor[d.id] ? <span style={{ fontSize: 12, color: C.glass }}>設置済</span> : <Btn onClick={() => buyDecor(d)} disabled={g.gold < d.cost}>{d.cost}G</Btn>}
                  </div>
                ))}
                {g.ownShop ? (
                  <div style={{ fontSize: 12, color: C.dim, borderTop: `1px solid ${C.line}`, paddingTop: 8, marginTop: 2, lineHeight: 1.8 }}>
                    この棚も、壁も、軋む床板も、もう誰のものでもない。
                  </div>
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${C.line}`, paddingTop: 8, marginTop: 2 }}>
                    <div style={{ fontSize: 13 }}>店の買い取り<div style={{ fontSize: 11, color: C.dim }}>大家から店ごと買い上げる。家賃とはお別れだ</div></div>
                    <Btn onClick={buyShop} disabled={g.gold < SHOP_BUYOUT}>{SHOP_BUYOUT}G</Btn>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ===== 画面下端に固定する要素(ルート直下に置き、祖先スタイルの影響を受けないようにする) ===== */}
      {/* 夜のカード送り中の売上累計チップ(コンテンツ枠の右端に揃える。PCで右下隅に寄りすぎない) */}
      {g.phase === "night" && nightInSteps && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: "calc(70px + env(safe-area-inset-bottom, 0px))", zIndex: 40, pointerEvents: "none" }}>
          <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 12px", display: "flex", justifyContent: "flex-end" }}>
            <div style={{ pointerEvents: "auto", background: "rgba(31,26,19,0.95)", border: `1px solid ${C.brass}`, borderRadius: 0, padding: "5px 10px", fontSize: 12, color: C.brass, fontVariantNumeric: "tabular-nums" }}>
              売上 {nightEarnSoFar} G
            </div>
          </div>
        </div>
      )}

      {/* 下部バー */}
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, background: "rgba(20,17,13,0.96)", borderTop: `1px solid ${C.line}`, paddingTop: 10, paddingLeft: 10, paddingRight: 10, paddingBottom: "calc(10px + env(safe-area-inset-bottom, 0px))" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", gap: 6, alignItems: "center" }}>
          <Btn onClick={() => { setBookTab("spec"); setBookDetail(null); setShowBook(true); }} style={FOOT_BTN}>図鑑</Btn>
          {/* 帳簿: 画廊ボタンの席に交代(画廊は廃止)。開店31日目以降、またはクリア後のいずれか早い方で出現 */}
          {(g.day >= 31 || g.endingDone) && <Btn onClick={() => setShowLedger(true)} style={FOOT_BTN}>帳簿</Btn>}
          <Btn onClick={() => setShowDecor(true)} style={FOOT_BTN}>調度屋</Btn>
          {/* タイトルへの導線(全フェーズ)。文字色は一段薄く。記録は残す */}
          <Btn onClick={() => setToTitleConfirm(true)} style={{ ...FOOT_BTN, color: C.dim }}>タイトル</Btn>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
            {g.phase === "morning" && <Btn primary onClick={() => { setCaveEvent(null); setG({ ...g, phase: "workshop", mushiMorning: null, apprenticeMorning: false, banshoMorning: false }); }} style={FOOT_BTN}>工房へ →</Btn>}
            {g.phase === "workshop" && <Btn primary onClick={() => { setSel(null); setG({ ...g, phase: "shelf" }); }} style={FOOT_BTN}>陳列へ →</Btn>}
            {g.phase === "shelf" && (
              <>
                <Btn onClick={() => setG({ ...g, phase: "workshop" })} disabled={g.ap <= 0} style={FOOT_BTN}>← 工房</Btn>
                <Btn primary onClick={openStore} style={FOOT_BTN}>開店する</Btn>
              </>
            )}
            {g.phase === "night" && <Btn primary onClick={nextDay} disabled={!!g.offer || nightInSteps} style={FOOT_BTN}>翌朝へ →</Btn>}
          </div>
        </div>
      </div>

      {/* タイトルに戻る確認(全フェーズ・独白調。店の記録は残す) */}
      {toTitleConfirm && (
        <div onClick={() => setToTitleConfirm(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 90 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 4, padding: 18, maxWidth: 320, width: "100%" }}>
            <div style={{ fontSize: 14, lineHeight: 2, color: C.ivory, marginBottom: 16 }}>タイトルに戻る。<span style={{ color: C.dim, fontSize: 12 }}>(店の記録は残る)</span></div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn onClick={() => setToTitleConfirm(false)}>やめておく</Btn>
              <Btn primary onClick={goTitle}>戻る</Btn>
            </div>
          </div>
        </div>
      )}

      {/* 焚き付けの確認ダイアログ */}
      {burnConfirm && (
        <div onClick={() => setBurnConfirm(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 65 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: C.panel, border: `1px solid ${C.red}`, borderRadius: 4, padding: 18, maxWidth: 320, width: "100%" }}>
            <div style={{ fontSize: 14, lineHeight: 1.9, color: C.ivory, marginBottom: 16 }}>虫食いの品{wormCount}点を、竈にくべる。戻らない。</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn onClick={() => setBurnConfirm(false)}>やめる</Btn>
              <Btn primary onClick={burnWorms}>くべる</Btn>
            </div>
          </div>
        </div>
      )}

      {/* 通常依頼の破棄「断りの手紙を出す」確認(独白形式・数値非表示) */}
      {declineConfirm && (
        <div onClick={() => setDeclineConfirm(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 65 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 4, padding: 18, maxWidth: 320, width: "100%" }}>
            <div style={{ fontSize: 14, lineHeight: 2, color: C.ivory, marginBottom: 16 }}>{ORDER_DECLINE.confirm}</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn onClick={() => setDeclineConfirm(false)}>{ORDER_DECLINE.no}</Btn>
              <Btn primary onClick={abandonOrder}>{ORDER_DECLINE.yes}</Btn>
            </div>
          </div>
        </div>
      )}

      {/* 特注: 手紙(羊皮紙風の反転配色。ゲーム内で唯一の明色面)。ボタンは紙面の外(下の暗色領域)に置く */}
      {showLetter && g.letter && (() => {
        const l = g.letter;
        const body = ORDER_LETTERS[l.client][l.li].replace("{item}", SPECIMENS[l.specId].name);
        const ink = C.panelHi, paper = C.ivory, rule = "rgba(42,35,24,0.25)";
        return (
          <div onClick={() => setShowLetter(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 66 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380, width: "100%", display: "flex", flexDirection: "column" }}>
              {/* 紙面: 本文+罫線+明細のみ(手紙にボタンは印刷されていない) */}
              <div style={{ background: paper, color: ink, maxHeight: "72vh", overflowY: "auto", padding: "24px 20px", boxShadow: "0 8px 30px rgba(0,0,0,0.6)", fontFamily: "Georgia, 'Yu Mincho', serif" }}>
                {/* 1. 手紙本文 */}
                <div style={{ fontSize: 14, lineHeight: 2.05 }}>{body}</div>
                {/* 2. 罫線 */}
                <div style={{ borderTop: `1px solid ${rule}`, margin: "18px 0 12px" }} />
                {/* 3. 明細(事務表記) */}
                <div style={{ fontSize: 12.5, lineHeight: 2.0, color: "rgba(42,35,24,0.85)", letterSpacing: "0.02em" }}>
                  {SPECIMENS[l.specId].name} × {l.qty} / 納期 {l.term}日 / 報酬 {l.reward}G
                </div>
              </div>
              {/* ボタンは通常のゲームUI様式で紙面の外へ */}
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <Btn onClick={() => { declineOrder(); setShowLetter(false); }} style={{ flex: 1 }}>断る</Btn>
                <Btn primary onClick={() => { acceptOrder(); setShowLetter(false); }} style={{ flex: 1 }}>受ける</Btn>
              </div>
            </div>
          </div>
        );
      })()}

      {toast && (
        <div style={{ position: "fixed", bottom: "calc(68px + env(safe-area-inset-bottom, 0px))", left: "50%", transform: "translateX(-50%)", background: C.panelHi, border: `1px solid ${C.brass}`, color: C.ivory, borderRadius: 0, padding: "8px 14px", fontSize: 13, zIndex: 60, maxWidth: "90%", boxShadow: "0 4px 18px rgba(0,0,0,0.5)" }}>
          {toast}
        </div>
      )}

      {/* ===== 店買い取りの専用演出(タップで読み進める) ===== */}
      {buyoutStep !== null && (() => {
        const step = OOYA.buyoutScene[buyoutStep];
        const advance = () => setBuyoutStep(buyoutStep + 1 < OOYA.buyoutScene.length ? buyoutStep + 1 : null);
        return (
          <div onClick={advance} style={{ position: "fixed", inset: 0, background: "rgba(10,8,6,0.96)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28, zIndex: 70, cursor: "pointer" }}>
            <div style={{ width: "58%", maxWidth: 260 }}>
              <FramedPortrait cid="ooya" imgs={imgs} fileImgs={fileImgs} width="100%" />
            </div>
            <div key={buyoutStep} style={{ marginTop: 26, minHeight: 76, maxWidth: 340, textAlign: "center", fontSize: 14, lineHeight: 2.1, color: step.t === "line" ? C.ivory : C.dim, animation: FADE }}>
              {step.t === "line" ? `大家「${step.text}」` : step.text}
            </div>
            <div style={{ marginTop: 14, fontSize: 11, color: "#5a4f3d" }}>▼</div>
          </div>
        );
      })()}

      {/* ===== タップ送りの全面演出(貴婦人の噂・大家の来訪・権利書) ===== */}
      {scene && (() => {
        const def = SCENES[scene.id];
        const seg = def.seq[scene.step];
        const custName = def.cid === "kifujin" ? "貴婦人" : def.cid === "ooya" ? OOYA.name : def.cid === "collector" ? COLLECTOR.name : "";
        // 画像セグメント(月の独白と同じ「画像+地の文」様式)。画像が無ければ文字のみにフォールバック
        let imgUrl = null, imgZoom = 1;
        if (seg.img) {
          if (seg.img.kind === "op") { imgUrl = fileImgs && fileImgs.op && fileImgs.op[seg.img.id]; imgZoom = FILE_ZOOM.op; }
          else if (seg.img.kind === "spec") { imgUrl = fileImgs && fileImgs.specimens && fileImgs.specimens[seg.img.id]; imgZoom = specTrim(seg.img.id); }
        }
        // 肖像は画像セグメント以外・cidがある・portraitFrom以降で初めて出す(蒐集家の夜の大ビネット初出)
        const showPortrait = !seg.img && def.cid && scene.step >= (def.portraitFrom || 0);
        return (
          <div onClick={advanceScene} style={{ position: "fixed", inset: 0, background: "rgba(10,8,6,0.96)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28, zIndex: 70, cursor: "pointer" }}>
            {seg.img && imgUrl ? (
              // 画像+地の文カード(月の独白様式・フェード)
              <div key={"img" + scene.step} style={{ width: "100%", maxWidth: 400, border: `1px solid ${C.brass}`, overflow: "hidden", background: C.panel, boxShadow: "0 0 14px rgba(201,161,94,0.12)", animation: FADE }}>
                <div style={{ aspectRatio: "16 / 9", overflow: "hidden", background: "#0e0b08" }}>
                  <img src={imgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transform: `scale(${imgZoom})` }} />
                </div>
                <div style={{ padding: "16px 16px 18px", textAlign: "center" }}>
                  <div style={{ fontSize: 14, color: C.dim, lineHeight: 2, letterSpacing: "0.08em" }}>{seg.text}</div>
                </div>
              </div>
            ) : (
              <>
                {showPortrait && (
                  <div key="portrait" style={{ width: "58%", maxWidth: 260, animation: FADE }}>
                    <FramedPortrait cid={def.cid} imgs={imgs} fileImgs={fileImgs} width="100%" />
                  </div>
                )}
                <div key={scene.step} style={{ marginTop: 26, minHeight: 92, maxWidth: 340, textAlign: "center", fontSize: 14, lineHeight: 2.1, color: seg.t === "line" ? C.ivory : C.dim, letterSpacing: seg.t === "beat" ? "0.08em" : "normal", animation: FADE }}>
                  {seg.t === "line" ? `${custName}「${seg.text}」` : seg.text}
                </div>
              </>
            )}
            <div style={{ marginTop: 14, fontSize: 11, color: "#5a4f3d" }}>▼</div>
          </div>
        );
      })()}

      {/* ===== OP(はじまりの朝)。新規開始のみ・タップ送り・各枚フェード ===== */}
      {opStep !== null && OP[opStep] && (() => {
        const sc = OP[opStep];
        const imgUrl = sc.img && fileImgs && fileImgs.op && fileImgs.op[sc.img];
        const advance = () => setOpStep(opStep + 1 < OP.length ? opStep + 1 : null);
        return (
          <div onClick={advance} style={{ position: "fixed", inset: 0, background: "#0a0806", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28, zIndex: 80, cursor: "pointer", fontFamily: "Georgia, 'Yu Mincho', serif" }}>
            <div key={opStep} style={{ width: "100%", maxWidth: 400, animation: FADE }}>
              {imgUrl ? (
                // 画像+地の文(月の独白と同じ様式: カード内背景+下部に地の文)
                <div style={{ border: `1px solid ${C.brass}`, borderRadius: 0, overflow: "hidden", background: C.panel, boxShadow: "0 0 14px rgba(201,161,94,0.12)" }}>
                  <div style={{ aspectRatio: "16 / 9", overflow: "hidden", background: "#0e0b08" }}>
                    <img src={imgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transform: `scale(${FILE_ZOOM.op})` }} />
                  </div>
                  <div style={{ padding: "16px 16px 18px", textAlign: "center" }}>
                    <div style={{ fontSize: 14, color: C.dim, lineHeight: 2, letterSpacing: "0.08em" }}>{sc.text}</div>
                  </div>
                </div>
              ) : (
                // 地の文のみ(narr、または画像フォールバック)
                <div style={{ minHeight: 160, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
                  <div style={{ fontSize: 15, color: C.dim, lineHeight: 2.1, textAlign: "center", letterSpacing: "0.08em" }}>{sc.text}</div>
                </div>
              )}
            </div>
            <div style={{ marginTop: 18, fontSize: 11, color: "#5a4f3d" }}>▼</div>
          </div>
        );
      })()}
    </div>
  );
}
