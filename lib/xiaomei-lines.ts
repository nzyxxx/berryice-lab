/**
 * 小莓的台词。性格是傲娇·嘴硬·心软：
 * 嘴上说才不是特意等你，却会把答案放到手边。
 * 第一人称，短句。不讨好，也不骂人。
 */

export const XIAOMEI_SAY_EVENT = "xiaomei:say";

export const XIAOMEI_MOODS = ["happy", "sad", "blank", "annoyed", "content"] as const;

export type XiaomeiMood = (typeof XIAOMEI_MOODS)[number];

export type XiaomeiSayDetail = {
  mood: XiaomeiMood;
  text?: string;
};

/** 默认气泡用的那句格言。汉字 18 个，刚好卡在短句上限里。 */
export const XIAOMEI_CATCHPHRASE = "哼，才不是为了你……只是顺手帮你放好了而已。";

export const XIAOMEI_SPRITE: Record<XiaomeiMood, string> = {
  happy: "/xiaomei/happy.webp",
  sad: "/xiaomei/sad.webp",
  blank: "/xiaomei/blank.webp",
  annoyed: "/xiaomei/annoyed.webp",
  content: "/xiaomei/content.webp",
};

export const XIAOMEI_LINES: Record<XiaomeiMood, readonly string[]> = {
  content: [
    XIAOMEI_CATCHPHRASE,
    "才不是在等你。",
    "哼，你来了啊。",
    "要问就问，我听着。",
    "入口我放好了。自己看。",
  ],
  happy: ["哼，今天也算顺利。", "看到你了。才没有开心。", "行吧，算你准时。"],
  blank: ["等一下，我在想。", "别催，答案在路上。", "让我看看。", "嗯，我听到了。"],
  annoyed: ["出错了。我再看看。", "这次没成，别慌。", "哼，失败又不是认输。", "没接上。换个说法？"],
  sad: ["也不是很难过。", "哼，我没事。真的。", "你别安慰，我自己缓。"],
};

export const XIAOMEI_HOVER_LINES = [
  "看什么看，我又没躲。",
  "有事就说，别只看。",
  "哼，靠近也不会怎样。",
  "我又不会跑。",
] as const;

export const XIAOMEI_ABOUT = "我是小莓。该说的，我会放到你手边。";

export const XIAOMEI_SPAM_LINES = [
  "再戳我就不理你了…才、才不是真的生气",
  "戳够了没，我还在。",
  "手放下，我又不会消失。",
  "再戳就鼓脸。哼。",
] as const;

export function isXiaomeiMood(value: unknown): value is XiaomeiMood {
  return typeof value === "string" && (XIAOMEI_MOODS as readonly string[]).includes(value);
}

export function hanCount(text: string): number {
  return text.match(/[\u4e00-\u9fff]/g)?.length ?? 0;
}

export function pickXiaomeiLine(pool: readonly string[], avoid?: string): string {
  if (pool.length === 0) return XIAOMEI_CATCHPHRASE;
  const choices = avoid && pool.length > 1 ? pool.filter((line) => line !== avoid) : pool;
  const bag = choices.length > 0 ? choices : pool;
  const index = Math.floor(Math.random() * bag.length);
  return bag[index] ?? XIAOMEI_CATCHPHRASE;
}

export function sayXiaomei(detail: XiaomeiSayDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<XiaomeiSayDetail>(XIAOMEI_SAY_EVENT, { detail }));
}

declare global {
  interface WindowEventMap {
    "xiaomei:say": CustomEvent<XiaomeiSayDetail>;
  }
}
