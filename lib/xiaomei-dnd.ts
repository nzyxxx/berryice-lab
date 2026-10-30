/**
 * 免打扰。只压她主动开口：环境碎碎念、进页打招呼、悬停、页面事件。
 * 忙时闭嘴仍走思考状态，不在这里重做。点她、喂她、让她说、打开聊天，都不经过这道闸。
 * 只存在这台浏览器。
 */

export const XIAOMEI_DND_KEY = "berryice.xiaomei.dnd";
export const XIAOMEI_DND_EVENT = "xiaomei-dnd";

/** 她自己开口的气泡来源。菜单里点「让她说」也记成 mutter，那一下不在调度器里拦。 */
export const XIAOMEI_PROACTIVE_SPEECH = ["mutter", "greet", "hover", "event"] as const;

/** 用户刚点过或刚喂过，免打扰不收这些气泡。 */
export const XIAOMEI_DIRECT_SPEECH = ["click", "about", "spam", "feed"] as const;

export function dndFromStored(raw: string | null): boolean {
  return raw === "1";
}

/** 开着就不要排下一次环境碎碎念。关着、空值、别的字符串都当关。 */
export function dndBlocksAmbient(dnd: boolean): boolean {
  return dnd === true;
}

/**
 * 打开免打扰时，把还挂着的主动气泡收掉。
 * 点按、喂食、关于、连点，留到它自己消失。
 */
export function dndSilencesSource(source: string, dnd: boolean): boolean {
  if (!dndBlocksAmbient(dnd)) return false;
  return (XIAOMEI_PROACTIVE_SPEECH as readonly string[]).includes(source);
}

let dndCache: { raw: string | null; value: boolean } = { raw: null, value: false };

export function subscribeXiaomeiDnd(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(XIAOMEI_DND_EVENT, onChange);
  return () => window.removeEventListener(XIAOMEI_DND_EVENT, onChange);
}

export function readXiaomeiDnd(): boolean {
  if (typeof window === "undefined") return false;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(XIAOMEI_DND_KEY);
  } catch {
    raw = null;
  }
  if (dndCache.raw === raw) return dndCache.value;
  dndCache = { raw, value: dndFromStored(raw) };
  return dndCache.value;
}

export function writeXiaomeiDnd(next: boolean): void {
  const raw = next ? "1" : "0";
  if (typeof window === "undefined") {
    dndCache = { raw, value: next };
    return;
  }
  try {
    localStorage.setItem(XIAOMEI_DND_KEY, raw);
  } catch {
    /* 这次先按着，刷新后可能回来。 */
  }
  dndCache = { raw, value: next };
  window.dispatchEvent(new Event(XIAOMEI_DND_EVENT));
}
