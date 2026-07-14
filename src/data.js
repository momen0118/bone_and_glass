// ============================================================
// 骨と硝子の店 — Os et Vitrum — データ定義
// (仕様・数値・文言の決定権は設計者にある。勝手に変えないこと)
// ============================================================

export const SAVE_KEY = "bone_glass_save_v1";   // v1のセーブを引き継ぐ
export const IMG_KEY = "bg_images_v1";

// ---------- 色 ----------
export const C = {
  bg: "#14110d", panel: "#1f1a13", panelHi: "#2a2318",
  line: "#4a3b28", brass: "#c9a15e", ivory: "#e8dcc4",
  dim: "#8a7a5f", glass: "#7fa07a", red: "#b06a5a",
  night: "#8fa3b8", // 蒐集家の色
};

// ---------- 素材・資材 ----------
export const MATERIALS = {
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
export const MAT_ORDER = ["tori","chou","kabuto","koke","sakana","kai","kani","kurage","koumori","hebi","suisho","ammo","kaeru","tokage","ga","hikarigoke","fukurou","bin","waku","daiza"];

// ---------- 標本 ----------
export const CAT_NAME = { bone: "骨格", insect: "昆虫", wet: "液浸", mineral: "鉱物", craft: "工芸" };
export const TAG_NAME = { rare: "珍", fancy: "華", scholar: "学" };

export const SPECIMENS = {
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
export const PROCESSES = {
  boil:     { name: "煮沸洗浄", desc: "亡骸を煮て、骨だけを取り出す" },
  dry:      { name: "乾燥展翅", desc: "形を整え、静かに乾かす" },
  preserve: { name: "硝子封入", desc: "硝子瓶に封じて保存する", needs: "bin" },
  frame:    { name: "額装",     desc: "額縁に収めて飾り立てる", needs: "waku" },
  polish:   { name: "研磨",     desc: "磨き上げて輝きを出す" },
  assemble: { name: "組立",     desc: "台座の上に骨を組み上げる", needs: "daiza" },
};
export const procLevel = (exp) => (exp >= 12 ? 3 : exp >= 4 ? 2 : 1);

// ---------- レシピ (minLv: 必要熟練) ----------
export const RECIPES = [
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
export const SPEC_PROC = {};
RECIPES.forEach((r) => { SPEC_PROC[r.to] = r.proc; });
// 二次加工が存在する品(from側に立つ標本)
export const SECONDARY = {};
RECIPES.forEach((r) => { if (SPECIMENS[r.from]) SECONDARY[r.from] = r.id; });

// ---------- 採集地 ----------
export const SITES = [
  { id: "mori",  name: "近くの森", cost: 40, desc: "鳥・虫・苔。手堅い採集地",
    table: [ ["tori", 3], ["chou", 4], ["kabuto", 4], ["koke", 3] ] },
  { id: "umibe", name: "入り江", cost: 50, desc: "魚・貝・蟹。稀に海月",
    table: [ ["sakana", 4], ["kai", 4], ["kani", 3], ["kurage", 1] ] },
  { id: "doukutsu", name: "石灰洞窟", cost: 85, desc: "蝙蝠・蛇・鉱石。費用は嵩む",
    table: [ ["koumori", 2], ["hebi", 3], ["suisho", 3], ["ammo", 2] ] },
  { id: "shitsugen", name: "霧の湿原", cost: 150, minRep: 10, desc: "蛙・蜥蜴・蛾、稀に梟。遠出になる",
    table: [ ["kaeru", 3], ["tokage", 3], ["ga", 3], ["hikarigoke", 2], ["fukurou", 1] ] },
];

export const SUPPLY_SHOP = [
  { id: "bin", cost: 25 }, { id: "waku", cost: 45 }, { id: "daiza", cost: 55 },
];

// ---------- 店の設え ----------
export const SHELF_EXPAND = { 7: 800, 8: 1200, 9: 1800 };
export const DECOR = [
  { id: "lamp",   name: "真鍮の吊りランプ", icon: "🕯️", cost: 600,  desc: "店先が明るくなり、客足が増す(来客+1)" },
  { id: "velvet", name: "天鵞絨の敷布",     icon: "🟥", cost: 900,  desc: "華やかな品が映える(華タグの売価+10%)" },
  { id: "window", name: "大硝子窓",         icon: "🪟", cost: 1500, desc: "往来から棚が見える(購入率+5%)" },
];

// ---------- 客 ----------
export const CUSTOMERS = [
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

export const COLLECTOR = {
  id: "collector", name: "外套の蒐集家", icon: "🕯️",
  appear: "……夜分に失礼。硝子の光が見えたものでね。",
  want: (n) => `その『${n}』……私の許でこそ、あれは意味を持つ。`,
  dealFair: "賢明だ。……良い夜を。",
  dealHigh: "ふ……面白い店主だ。払おう。",
  dealFail: "……欲をかいたな。縁がなかった。",
  refuse: "……そうか。気が変わったら、灯りを点けておくといい。",
};

// ---------- 銘板セット ----------
export const SETS = [
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
export const ALIASES = {
  bone:    { name: "骸骨堂", invite: ["gakusha"] },
  insect:  { name: "胡蝶堂", invite: ["kifujin"] },
  wet:     { name: "玻璃堂", invite: ["koujika"] },
  mineral: { name: "星石堂", invite: ["gakusha", "koujika"] },
  craft:   { name: "匣庭堂", invite: ["gakusei"] },
};

export const PRICE_MODES = {
  strong:   { name: "強気", mult: 1.3, buy: 0.72, repBonus: 0, desc: "売価+30%・客足は鈍る" },
  normal:   { name: "標準", mult: 1.0, buy: 1.0,  repBonus: 0, desc: "基準の値付け" },
  discount: { name: "勉強", mult: 0.8, buy: 1.25, repBonus: 1, desc: "売価-20%・売れやすく評判も上がる" },
};

export const RENT = 100, RENT_INTERVAL = 7, MAX_AP = 3;
