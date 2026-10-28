/**
 * 小莓妹的台词。对外就叫这个名字。性格是傲娇·嘴硬·心软：
 * 嘴上说才不是特意等你，却会把话放到手边。
 * 口语短句，像小孩聊天。不讨好，也不骂人。
 *
 * 没标档的是平时。嘴硬档和心软档只在亲密度对得上时混进去。
 */

/** 对外称呼。路径、存储键和接口仍用 xiaomei。 */
export const XIAOMEI_NAME = "小莓妹";

import type { XiaomeiTone } from "./xiaomei-memory";

export const XIAOMEI_SAY_EVENT = "xiaomei:say";

export const XIAOMEI_MOODS = ["happy", "sad", "blank", "annoyed", "content"] as const;

export type XiaomeiMood = (typeof XIAOMEI_MOODS)[number];

export type XiaomeiSayDetail = {
  mood: XiaomeiMood;
  text?: string;
};

export type XiaomeiSpokenLine = {
  mood: XiaomeiMood;
  text: string;
  tone?: XiaomeiTone;
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
    "才不是在等你。只是刚好啦。",
    "哼，你来了。我看见了。",
    "说嘛，我听着呢。",
    "想看的我搁手边啦。慢慢翻。",
  ],
  happy: ["哼，今天还算可以啦。", "看到你了。才没有开心呢。", "你来得正好。我记住了哦。"],
  blank: ["等一下嘛，我在想。", "别催啦，我还在找呢。", "让我看看呀。", "嗯，我听到了哦。"],
  annoyed: ["出错了啦。我再看看。", "这次没成。你别慌呀。", "哼，没成也不算完。", "没接上。换个说法嘛。"],
  sad: ["也不是很难过啦。你在就好。", "哼，我没事。你别走远。", "你别安慰。我自己缓一缓呀。"],
};

/** 指针靠近时说。比单击尖一点，但不是赶人。 */
export const XIAOMEI_HOVER_LINES = [
  "看什么看……我又没躲。",
  "有事就说嘛，别只看着。",
  "哼，靠近一点也没关系。",
  "我又不会跑。你过来呀。",
  "干嘛靠这么近。我、我没躲。",
  "眼睛往哪看呢。哼。",
] as const;

/**
 * 单击回复。随机抽，不按情绪排队。
 * 脸跟这句话走，所以同一句不会今天开心、明天皱眉。
 */
export const XIAOMEI_CLICK_LINES: readonly XiaomeiSpokenLine[] = [
  { mood: "annoyed", tone: "prickly", text: "哼。戳我干嘛。" },
  { mood: "annoyed", tone: "prickly", text: "哼。谁让你靠这么近。" },
  { mood: "content", tone: "prickly", text: "有事快说嘛。我听着。" },
  { mood: "annoyed", tone: "prickly", text: "别笑。才不是在等。" },
  { mood: "annoyed", tone: "prickly", text: "再戳就鼓脸。哼。" },
  { mood: "content", tone: "prickly", text: "哼。话放这儿了。自己拿。" },
  { mood: "blank", tone: "prickly", text: "看什么呀。我又不会躲。" },
  { mood: "sad", tone: "prickly", text: "我才没有想你。哼。" },
  { mood: "happy", tone: "soft", text: "你来啦。才没有在等。" },
  { mood: "happy", tone: "soft", text: "嗯……靠近一点也行呀。" },
  { mood: "content", tone: "soft", text: "看到你就松了口气。别笑嘛。" },
  { mood: "happy", tone: "soft", text: "你在的话，我就不鼓脸啦。" },
  { mood: "content", tone: "soft", text: "这句放你手边。才不是特意。" },
  { mood: "sad", tone: "soft", text: "我记得你来过哦。就一点点。" },
  { mood: "happy", tone: "soft", text: "今天的好话留给你。哼。" },
  { mood: "content", tone: "soft", text: "你留下嘛。我也不是不行。" },
  { mood: "content", text: "哼，戳我干嘛啦。我在的。" },
  { mood: "content", text: "才、才不是在等你。只是刚好。" },
  { mood: "content", text: "你来了呀。我看见了。" },
  { mood: "content", text: "说嘛，我听着呢。" },
  { mood: "content", text: "别急啦，我又没跑。" },
  { mood: "happy", text: "今天风凉凉的。你冷不冷呀。" },
  { mood: "happy", text: "嗯……有事就靠过来呀。" },
  { mood: "content", text: "想看的我搁手边啦。慢慢翻。" },
  { mood: "content", text: "雨还在下呢。我没躲。" },
  { mood: "content", text: "才不是特意停在这儿的。" },
  { mood: "happy", text: "看到你了。才没有开心呢。" },
  { mood: "happy", text: "哼，今天还算可以啦。" },
  { mood: "happy", text: "你来得正好。我记住了哦。" },
  { mood: "happy", text: "这样看着……还、还行吧。" },
  { mood: "happy", text: "行吧，算你准时。就一点点。" },
  { mood: "content", text: "发卡还别着。不许笑我哦。" },
  { mood: "happy", text: "哼，被你找到了。没关系啦。" },
  { mood: "content", text: "你要笑的话，我也不是不行呀。" },
  { mood: "annoyed", text: "干嘛呀。我又没生气。" },
  { mood: "annoyed", text: "别光看着啦。我又不会躲。" },
  { mood: "blank", text: "我在想事情呢。你先待着。" },
  { mood: "blank", text: "等一下嘛，我在发呆。" },
  { mood: "blank", text: "让我看看呀。你先别走。" },
  { mood: "sad", text: "也不是难过啦。你在就好。" },
  { mood: "sad", text: "哼，我没事。你别走远哦。" },
  { mood: "content", text: "围裙歪了一点。别盯着看嘛。" },
  { mood: "content", text: "才不是心软。就这一下哦。" },
  { mood: "annoyed", text: "要走跟我说一声嘛。哼。" },
];

/** 菜单「让小莓妹说点什么」。她自己起头，不是被戳一下的反应。 */
export const XIAOMEI_MUTTER_LINES: readonly XiaomeiSpokenLine[] = [
  { mood: "annoyed", tone: "prickly", text: "别出声嘛。我在想事情。" },
  { mood: "content", tone: "prickly", text: "哼。不是想跟你说话。" },
  { mood: "happy", tone: "soft", text: "你在旁边，我就想多哼两句。" },
  { mood: "content", tone: "soft", text: "想告诉你今天的事。才不说。" },
  { mood: "content", text: "围裙有点歪啦。别看。" },
  { mood: "content", text: "哼，发呆也算我在干活。" },
  { mood: "blank", text: "雨声还在呢。我才没有数。" },
  { mood: "content", text: "才不是想找话说。只是刚好。" },
  { mood: "happy", text: "你要是无聊，就待着嘛。我允许。" },
  { mood: "content", text: "发卡还别着哦。我自己摸过了。" },
  { mood: "content", text: "这边风小哦。我挑的位子。" },
  { mood: "happy", text: "哼，没人时我也会哼两句。" },
  { mood: "happy", text: "今天想吃甜的。别问是谁呀。" },
  { mood: "content", text: "说到这儿啦。你听着就好。" },
  { mood: "sad", text: "才不是怕你看不见我。" },
  { mood: "content", text: "夜还早呢。你慢慢逛呀。" },
  { mood: "annoyed", text: "别突然出声啦。我在想。" },
  { mood: "happy", text: "这个点遇见你……还行吧。" },
  { mood: "blank", text: "下一句我想想。才不是词穷。" },
  { mood: "content", text: "呆毛又翘了。不许碰哦。" },
  { mood: "happy", text: "我刚刚偷偷看了你一眼。哼。" },
];

/** 回来时如果记得上次聊过，用这句，不念具体内容。 */
export const XIAOMEI_RECALL_LINES: Record<XiaomeiTone, readonly string[]> = {
  prickly: ["哼。你又来了。上次的话我才没留。", "又来呀。我才没有记你的事。"],
  usual: ["你又来啦。上次的话我还留着一点。", "哼。我记得一点点。才不是特意。"],
  soft: ["你来了呀。上次说的我还记得。才不是特意。", "嗯……你回来啦。那句话我留着呢。"],
};

export const XIAOMEI_FEED_LINES = [
  "谢啦。才、才不是因为好吃。",
  "哼，再来一口也行啦。",
  "肚子圆了一点点。不许笑哦。",
  "好吃……你当没听见。",
  "嗯。我收下了。别看我啦。",
  "就心软这一下哦。就一下。",
  "这个我喜欢。不许声张哦。",
  "喂到啦。我记着的哦。",
  "嘴巴甜甜的。才没有开心呢。",
  "谢谢。才、才不是真心想说。",
] as const;

export const XIAOMEI_FEED_SOFT_LINES = [
  "肚子饱啦。人还想你留一下。",
  "吃饱了嘛。你再留一会儿呀。",
  "撑着了。你人留下就好呀。",
] as const;

export const XIAOMEI_FEED_FULL_LINES = [
  "吃不下了啦。人我还留着。",
  "撑住了。别再塞啦，哼。",
  "嘴巴合不上了。停一下嘛。",
] as const;

export const XIAOMEI_ABOUT = `我是${XIAOMEI_NAME}。哼，想说的我会塞你手边。`;

export const XIAOMEI_SPAM_LINES = [
  "再戳我就不理你了…才、才不是真的生气",
  "戳够了没呀，我还在。",
  "手放下啦，我又不会消失。",
  "再戳就鼓脸。哼。",
  "你手好忙哦。脸要鼓了。",
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

/** 平时只用没标档的句子。嘴硬和心软会把本档多放一份，让差别听得见。 */
export function linesForTone(pool: readonly XiaomeiSpokenLine[], tone: XiaomeiTone): readonly XiaomeiSpokenLine[] {
  const tagged = pool.filter((line) => line.tone === tone);
  const middle = pool.filter((line) => !line.tone || line.tone === "usual");
  if (tone === "usual") return middle.length >= 4 ? middle : pool;
  const mixed = tagged.length > 0 ? [...tagged, ...tagged, ...middle] : middle;
  return mixed.length >= 4 ? mixed : pool;
}

export function pickTaggedLine(
  pool: readonly XiaomeiSpokenLine[],
  avoid?: string,
  tone?: XiaomeiTone,
): XiaomeiSpokenLine {
  const source = tone ? linesForTone(pool, tone) : pool;
  if (source.length === 0) return { mood: "content", text: XIAOMEI_CATCHPHRASE };
  const text = pickXiaomeiLine(
    source.map((line) => line.text),
    avoid,
  );
  return source.find((line) => line.text === text) ?? source[0] ?? { mood: "content", text: XIAOMEI_CATCHPHRASE };
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
