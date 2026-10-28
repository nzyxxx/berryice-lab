/**
 * 小莓的台词。性格是傲娇·嘴硬·心软：
 * 嘴上说才不是特意等你，却会把话放到手边。
 * 第一人称，短句。不讨好，也不骂人。
 *
 * 单击不走固定情绪轮转。池子要够大，连点才不像在复读。
 */

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
    "才不是在等你。只是刚好。",
    "哼，你来了。我看见了。",
    "要问就问，我听着。",
    "入口放好了。你慢慢看。",
  ],
  happy: ["哼，今天还算顺利。", "看到你了。才没有开心。", "你来得正好。我记住了。"],
  blank: ["等一下，我在想。", "别催，答案在路上。", "让我看看。", "嗯，我听到了。"],
  annoyed: ["出错了。我再看看。", "这次没成，别慌。", "哼，失败又不是认输。", "没接上。换个说法？"],
  sad: ["也不是很难过。你在就好。", "哼，我没事。你别走远。", "你别安慰，我自己缓。"],
};

/** 指针靠近时说。比单击尖一点，但不是赶人。 */
export const XIAOMEI_HOVER_LINES = [
  "看什么看……我又没躲。",
  "有事就说嘛，别只看着。",
  "哼，靠近一点也没关系。",
  "我又不会跑。你过来呀。",
] as const;

/**
 * 单击回复。随机抽，不按情绪排队。
 * 脸跟这句话走，所以同一句不会今天开心、明天皱眉。
 */
export const XIAOMEI_CLICK_LINES: readonly XiaomeiSpokenLine[] = [
  { mood: "content", text: "哼，戳我干嘛。我在的。" },
  { mood: "content", text: "才不是在等你。只是刚好。" },
  { mood: "content", text: "你来了啊。我看见了。" },
  { mood: "content", text: "说吧，我听着。" },
  { mood: "content", text: "别急，我又没走。" },
  { mood: "content", text: "今天风有点凉。你呢。" },
  { mood: "happy", text: "嗯。有事就靠过来。" },
  { mood: "content", text: "入口我放好了，你慢慢看。" },
  { mood: "content", text: "今天的雨还在。我没躲。" },
  { mood: "content", text: "才不是特意停在这儿。" },
  { mood: "happy", text: "看到你了。才没有开心。" },
  { mood: "happy", text: "哼，今天还算顺利。" },
  { mood: "happy", text: "你来得正好。我记住了。" },
  { mood: "happy", text: "嗯……这样看着，还行。" },
  { mood: "happy", text: "行吧，算你准时。一点点。" },
  { mood: "content", text: "蓝莓发卡还在。别问。" },
  { mood: "happy", text: "哼，被你找到了。没关系。" },
  { mood: "happy", text: "你笑的话，我也不是不行。" },
  { mood: "annoyed", text: "再戳我就鼓脸。还是理你。" },
  { mood: "annoyed", text: "干嘛。我又没生气。" },
  { mood: "annoyed", text: "别光看着。我又不会躲。" },
  { mood: "annoyed", text: "哼。靠近可以，别闹。" },
  { mood: "blank", text: "我在想事情。你先待着。" },
  { mood: "blank", text: "等一下，我在发呆。" },
  { mood: "blank", text: "让我看看。你先别走。" },
  { mood: "content", text: "嗯，我接着听。" },
  { mood: "sad", text: "也不是难过。你在就好。" },
  { mood: "sad", text: "哼，我没事。你别走远。" },
  { mood: "content", text: "围裙系好了。别盯着看。" },
  { mood: "happy", text: "夜色还行。你也还行。" },
  { mood: "content", text: "才不是心软。就这一次。" },
  { mood: "annoyed", text: "要走跟我说一声。哼。" },
  { mood: "content", text: "茶没泡。话我留着。" },
  { mood: "happy", text: "这个角落归我。你可以靠。" },
];

/** 菜单「让小莓说点什么」。她自己起头，不是被戳一下的反应。 */
export const XIAOMEI_MUTTER_LINES: readonly XiaomeiSpokenLine[] = [
  { mood: "content", text: "围裙有点歪。别看。" },
  { mood: "content", text: "哼，发呆也算工作。" },
  { mood: "blank", text: "雨声还在。我数过，才没有。" },
  { mood: "content", text: "才不是想找话说。只是刚好。" },
  { mood: "happy", text: "你要是无聊，就待着。我允许。" },
  { mood: "content", text: "发卡还别着。我自己看过。" },
  { mood: "content", text: "角落这边风小。我选的。" },
  { mood: "happy", text: "哼，没人时我也会哼两句。" },
  { mood: "happy", text: "今天想吃点甜的。别问谁。" },
  { mood: "content", text: "话说到这儿。你听着就好。" },
  { mood: "sad", text: "才不是担心你没看见我。" },
  { mood: "content", text: "夜还长。你慢慢逛。" },
  { mood: "annoyed", text: "别突然出声。我在想。" },
  { mood: "happy", text: "嗯，这个点遇见你，还行。" },
  { mood: "blank", text: "让我想想下一句。才不是词穷。" },
];

export const XIAOMEI_FEED_LINES = [
  "谢了。才不是好吃。",
  "哼，再来一口也行。",
  "肚子圆了一点。别笑。",
  "好吃。你当没听见。",
  "嗯。我收下了。别看我。",
  "心软一下。只此一次。",
  "这个我喜欢。别声张。",
  "喂到了。我记着的。",
] as const;

export const XIAOMEI_FEED_SOFT_LINES = ["肚子饱了。好感还空一点。", "吃饱了。人还想留着你。"] as const;

export const XIAOMEI_FEED_FULL_LINES = ["吃不下了。人我还留着。", "撑住了。别再塞了，哼。"] as const;

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

export function pickTaggedLine(pool: readonly XiaomeiSpokenLine[], avoid?: string): XiaomeiSpokenLine {
  if (pool.length === 0) return { mood: "content", text: XIAOMEI_CATCHPHRASE };
  const text = pickXiaomeiLine(
    pool.map((line) => line.text),
    avoid,
  );
  return pool.find((line) => line.text === text) ?? pool[0] ?? { mood: "content", text: XIAOMEI_CATCHPHRASE };
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
