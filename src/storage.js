// ストレージ両対応ラッパー
// - window.storage があればそれを使う(Claudeアーティファクト環境)
// - なければ localStorage を同じ async API 形状でラップする
//   get(key) → {value} / set(key,val) / delete(key) / 存在しないキーは例外
// ゲームコードはこのラッパーだけを呼ぶこと。

const localWrapper = {
  async get(key) {
    const v = window.localStorage.getItem(key);
    if (v === null) throw new Error(`storage: key not found: ${key}`);
    return { value: v };
  },
  async set(key, value) {
    window.localStorage.setItem(key, String(value));
    return { key, value: String(value) };
  },
  async delete(key) {
    window.localStorage.removeItem(key);
  },
};

// 実体は呼び出しのたびに解決する(window.storage の注入タイミングに依存しないため)
function backend() {
  if (typeof window !== "undefined" && window.storage) return window.storage;
  return localWrapper;
}

export const storage = {
  get: (key) => backend().get(key),
  set: (key, value) => backend().set(key, value),
  delete: (key) => backend().delete(key),
};
