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

// ---------- 標本の一言説明(図鑑の詳細ビュー用) ----------
export const SPEC_LORE = {
  s_torikotsu: "掌にのるほど小さい。嘴の先まで欠けなく取り出すのが腕の見せどころ。",
  s_zenshin: "飛ぶための骨は、驚くほど軽い。台座の上で永遠に羽ばたきかけている。",
  s_tenshi: "翅の粉は指で触れれば二度と戻らない。息を止めて針を打つ。",
  s_chougaku: "額に収めた春。壁に掛ければ、部屋に季節がひとつ増える。",
  s_kabuto: "鎧のような艶は乾いてなお失われない。小さな騎士の亡骸。",
  s_kabutogaku: "黒鉄の輝きを真鍮が縁取る。書斎の机上によく似合う。",
  s_terra: "硝子の中の小さな森。水をやらずとも、しばらく緑のまま。",
  s_gyoshin: "琥珀の液の中で、鱗は今も光を返す。",
  s_kuragebin: "浮いているのか沈んでいるのか。硝子の中の、ほどけかけた月。",
  s_kaimigaki: "磨けば波の記憶が浮かぶ。はじめての客は、まずこれを買っていく。",
  s_kani: "怒った姿のまま乾かすのがこつ。鋏の角度で値が変わる。",
  s_koumori: "翼を広げれば、傘の骨によく似ている。夜の設計図。",
  s_hebibin: "とぐろのまま眠らせる。瓶の中で、まだ何かを待つ形。",
  s_hebikotsu: "連なる椎骨は数百。並べ直すだけで一日が終わる。",
  s_suisho: "地の底で数万年。灯りを移せば、店じゅうが少し明るくなる。",
  s_ammo: "螺旋は太古の海の日記。断面を磨けば章が読める。",
  s_kaerubin: "跳ねる寸前の姿で封じられた。湿原の使者。",
  s_kaerukotsu: "跳躍のための後肢は、体の倍も長い。骨だけになるとよく分かる。",
  s_tokagebin: "尾の先まで綺麗に残った個体は珍しい。好事家が目の色を変える。",
  s_ga: "枯葉と見分けがつかない。展翅して初めて、蛾だったと分かる。",
  s_gagaku: "額の中の秋。本物の枯葉と並べても、誰も気づかない。",
  s_fukuroukotsu: "大きな眼窩は夜を見るための窓。学者が最も欲しがる骨。",
  s_fukurouzen: "音もなく飛ぶ翼の設計を、骨は全て覚えている。店の誇り。",
  s_hikariterra: "月の無い晩、棚の隅で仄かに灯る。売るのが少し惜しい。",
  s_kaigaku: "波打ち際をひと箱に。貴婦人の客間で評判だという。",
  s_kanikoura: "磨き上げれば武具の面のよう。存外、頑丈である。",
};

// ---------- 虫食い・樟脳・蟲屋 ----------
// 虫食い品は元標本IDに接頭辞 "w_" を付けたIDで、通常の spec / shelf にそのまま格納する
export const WORM = "w_";
export const isWorm = (id) => typeof id === "string" && id.startsWith(WORM);
export const wormId = (id) => WORM + id;
export const baseId = (id) => (isWorm(id) ? id.slice(WORM.length) : id);
// 乾燥系(骨格・昆虫・工芸)だけが食われる。液浸・鉱物は対象外
export const WORM_CATS = ["bone", "insect", "craft"];
// 標本の解決: 虫食い品は「虫食い◯◯」名・基準価50%・worm フラグ付き。通常品はそのまま
export function specOf(id) {
  if (isWorm(id)) {
    const b = SPECIMENS[baseId(id)];
    return b ? { ...b, name: "虫食い" + b.name, price: Math.round(b.price * 0.5), worm: true } : null;
  }
  return SPECIMENS[id];
}
// 樟脳(消耗品。倉庫で焚いて虫を防ぐ。晩数で管理し在庫には入れない。所持は1個=5晩まで)
export const CAMPHOR = { cost: 100, nights: 5, icon: "💠", desc: "倉庫で焚けば虫を寄せつけない(5晩)", toast: "樟脳を焚いた(5晩)" };
export const mushiDiscover = (name) => `倉庫の木箱から、小さな羽音がした。——${name}が虫に食われている。`;
// 蟲屋(虫食い品だけを愛でる救済客)
export const MUSHIYA = {
  id: "mushiya", name: "蟲屋", icon: "🐛",
  buy: ["穴の開き方に、味がある", "完品など、どこの店にもある", "虫の仕事もまた、自然の造形よ"],
  empty: "……仕舞い込んだか。売り物は、棚に置くものだぞ",
  firstLeave: "……湧かせたくないなら、樟脳を焚くことだ。なに、私はどちらでも構わんが",
  // 初回来店の三段構成(二段目のみ棚の虫食い有無で分岐)
  firstAppear: "……いい羽音がしていたのでね。湧いた店には、匂いで分かる",
  firstBuy: "ほう。……穴の開き方に、味がある。これは私が引き取ろう",
  firstNone: "食われた品は、しまい込まずに並べておくことだ。私のような者が、買いに来る",
};
// 隠し通り名「穴物堂」(蟲屋への累計売却数で獲得。通常の通り名とは独立した隠し枠)
export const ANA_ALIAS = {
  name: "穴物堂", threshold: 10,
  noise: "街の噂 — この店は『穴物堂』と呼ばれはじめた。",
  desc: "虫食いを愛した店の証",
};

// ---------- 月齢(14日周期・7相。各相2晩。1日目=三日月、満月は7〜8日目) ----------
export const MOON_PHASES = ["新月", "三日月", "上弦", "十三夜", "満月", "下弦", "有明"];
// 相番号: 0新月 1三日月 2上弦 3十三夜 4満月 5下弦 6有明。日数から決定的に算出(保存不要)
export const moonPhase = (day) => (Math.floor((day - 1) / 2) + 1) % 7;
// 開店時の一言(両端の相のみ。他の相は何も出さない)
export const MOON_OPEN = { 4: "月が明るい。往来に人の影が多い。", 0: "月のない晩だ。通りは静かで、暗い。" };
// 満月の晩に活性化する採集(採集地 → 抽選重みを2倍にする素材)
export const MOON_BOOST = { umibe: ["kurage"], shitsugen: ["ga", "hikarigoke", "fukurou"], doukutsu: ["koumori"] };

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
  { id: "shitsugen", name: "霧の湿原", cost: 150, desc: "蛙・蜥蜴・蛾、稀に梟。遠出になる",
    table: [ ["kaeru", 3], ["tokage", 3], ["ga", 3], ["hikarigoke", 2], ["fukurou", 1] ] },
];

export const SUPPLY_SHOP = [
  { id: "bin", cost: 25 }, { id: "waku", cost: 45 }, { id: "daiza", cost: 55 },
];

// ---------- 店の設え ----------
export const SHELF_EXPAND = { 7: 800, 8: 1200, 9: 1800 };
export const DECOR = [
  { id: "lamp",   name: "真鍮の吊りランプ", icon: "🕯️", cost: 1200, desc: "店先が明るくなり、客足が増す(来客+1)" },
  { id: "velvet", name: "天鵞絨の敷布",     icon: "🟥", cost: 1800, desc: "華やかな品が映える(華タグの売価+10%)" },
  { id: "window", name: "大硝子窓",         icon: "🪟", cost: 2800, desc: "往来から棚が見える(購入率+5%)" },
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
  { id: "gakusha", name: "老学者", icon: "🧐", minRep: 8, budget: 420, floor: 100, weight: 3,
    likesTags: ["scholar"], likesCats: ["bone", "mineral"],
    lines: {
      buy: ["ふむ、保存状態がよろしい", "研究室に置きたい", "この骨の並び…実に正確だ"],
      regular: ["君の仕事は信用できる", "弟子にもこの店を教えた"],
      friend: ["論文の謝辞に店の名を書いておいたよ", "君は良い標本師になったな"],
      pass: ["うちの研究室に既にあるのでな", "分類に少々疑問が残る。出直そう"],
      poor: ["研究費の申請が通ってからだ……"],
      big: ["これは学術的発見に等しい"],
    } },
  { id: "koujika", name: "好事家", icon: "🎩", minRep: 16, budget: 520, floor: 150, weight: 3,
    likesTags: ["rare"], likesCats: [],
    lines: {
      buy: ["珍しいものはあるかね", "よそでは見ない品だ", "私の部屋に飾るとしよう"],
      regular: ["今夜も掘り出し物の匂いがする", "友人には教えたくない店だ"],
      friend: ["私の蒐集室の半分は、この店の品だよ"],
      pass: ["ふむ……本物かね? いや、疑って悪かった", "今宵は心が動かなかった"],
      poor: ["金貨が足りん。屋敷から取ってくるべきだったか"],
      big: ["この出会いに乾杯したい気分だ"],
    } },
  { id: "kifujin", name: "貴婦人", icon: "🪞", minRep: 26, budget: 650, floor: 200, weight: 2,
    likesTags: ["fancy"], likesCats: [],
    lines: {
      buy: ["あら、綺麗…", "客間に映えそうだわ", "包んでちょうだい"],
      regular: ["お友達にもこの店を教えましたのよ", "あなたの棚は、いつ見ても素敵"],
      friend: ["主人には内緒の楽しみですの"],
      pass: ["素敵だけど、客間には少し大きすぎるわね", "今日は見に来ただけですの"],
      poor: ["あら……お財布を忘れてきたみたい"],
      big: ["今夜の夜会で自慢しますわ"],
    } },
  // 学生の就職イベント(gakuseiGraduated)以降に客プールへ加わる
  { id: "wakate", name: "若い研究者", icon: "🎓", minRep: 0, budget: 420, weight: 2, flag: "gakuseiGraduated",
    likesTags: ["scholar"], likesCats: ["bone"],
    lines: {
      buy: ["約束、果たしに来ました", "研究室の棚に、この店の品を", "給料日なので"],
      regular: ["後輩たちにも教えてます、この店"],
      friend: ["僕の研究の原点は、この店の頭骨なんです"],
      pass: ["論文の締切が……また来ます"],
      poor: ["学生時代の癖で、つい値札から見ちゃうな"],
      big: ["初任給、こういうことに使いたかったんです"],
    } },
];

// 就職イベント後、学生(後輩)の buy に加わる一言
export const GAKUSEI_KOUHAI_LINE = "先輩に教わったんです、この店";
// 学生の就職イベント(棚に商品が1点以上ある夜に発生。最も高い品を予算無視で購入)
export const GAKUSEI_GRAD = {
  threshold: 30, // 学生への累計販売がこの回数に達した後、次の来店で発生
  line: "就職しました。……約束、覚えてますか",
  line2: "初任給です。──一番いいものを、ください",
  sub: "春から研究室に入るらしい。少しいい外套を着ていた。",
};
// 湿原の解禁(老学者への累計販売)
export const SWAMP_UNLOCK = {
  threshold: 5,
  text: "老学者「君の腕なら、霧の湿原の品も扱えるだろう。採集人に紹介状を書いておいた。」",
};
// 洞窟の解禁(森・入り江への採集依頼の累計)
export const CAVE_UNLOCK = {
  threshold: 5,
  text: "採集人「洞窟の下見をしてきた。次からは請けられる。」",
};

// ---------- 大家 ----------
export const OOYA = {
  id: "ooya", name: "大家", icon: "🗝️",
  normal: ["今週の分だ。耳を揃えてもらおうか。", "あいよ、家賃日だ。"], // 平常の家賃日(表示率50%)
  raise150: "景気が良さそうじゃないか、ええ?",
  raise200: "立派な店になったもんだ。なら家賃も立派にしないとなあ?",
  broke: "おいおい、硝子より先に財布が空か? ツケといてやるが、覚えとけよ。",
  // 店の買い取りの専用演出(タップで順に読み進める。line=セリフ / narr=地の文)
  buyoutScene: [
    { t: "line", text: "……本気か。まあ、金は金だ。" },
    { t: "narr", text: "大家は長い時間をかけて、金を数えた。" },
    { t: "line", text: "…………ふん。これでもう、ここに来る理由がなくなっちまったな。" },
    { t: "narr", text: "鍵束が、初めて自分の掌に載った。" },
  ],
};
export const SHOP_BUYOUT = 15000;

export const COLLECTOR = {
  id: "collector", name: "外套の蒐集家", icon: "🕯️",
  appear: "……夜分に失礼。硝子の光が見えたものでね。",
  appearCold: "……。(黙って品を指した)",          // trust ≦ -2
  appearWarm: "……また来た。この店の灯りは、覚えやすい。", // trust ≧ 2
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
