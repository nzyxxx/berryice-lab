/**
 * 小莓妹的短动作和表情微变。纯计算，不碰 DOM、不挂 rAF。
 * 眨眼、哈欠、伸懒腰、音符、欢呼、叹气叠在现有五张脸上。
 * 喝水、点心、打伞是 SVG 道具；转圈是水平翻转，散步是左右走动。
 * 不新切立绘，也不换别人的外形。
 * 菜单关上、没有台词时，十秒里大约三拍，几乎每拍都在动。
 * 间隔长过最长的一拍。同一种动作或微表情不连播。
 */

import { moodForChatStatus, type XiaomeiMood } from "./xiaomei-lines";

export const XIAOMEI_IDLE_BEATS = [
  "blink",
  "yawn",
  "stretch",
  "note",
  "cheer",
  "sigh",
  "glance",
  "smile",
  "drink",
  "snack",
  "umbrella",
  "spin",
  "walk",
] as const;

export type XiaomeiIdleBeat = (typeof XIAOMEI_IDLE_BEATS)[number];

/** 带小道具的拍。转圈和散步只动身体。 */
export const XIAOMEI_ACTION_BEATS = ["drink", "snack", "umbrella", "spin", "walk"] as const;

export type XiaomeiActionBeat = (typeof XIAOMEI_ACTION_BEATS)[number];

/** 叠在现有脸上的轻量拍。不换立绘。 */
export const XIAOMEI_MICRO_BEATS = ["blink", "yawn", "stretch", "note", "cheer", "sigh"] as const;

export type XiaomeiCueKind = (typeof XIAOMEI_MICRO_BEATS)[number];

export type XiaomeiPropKind = "cup" | "snack" | "umbrella";

/** 和 app/globals.css 里的 animation-duration 对齐。改一边要改另一边。 */
export const XIAOMEI_BEAT_MS = {
  blink: 900,
  yawn: 1700,
  stretch: 1800,
  note: 1500,
  cheer: 1400,
  sigh: 1600,
  glance: 1600,
  smile: 1500,
  drink: 2300,
  snack: 2100,
  umbrella: 2200,
  spin: 2000,
  walk: 2400,
} as const;

/** 一拍里先闪邻接表情，再落到这拍的脸。短于最短的拍，第二帧才看得见。 */
export const XIAOMEI_TRAIL_MS = 520;

/** 长过最长的一拍，两拍不会叠。上限按住，十秒里至少能排进三拍。 */
export const XIAOMEI_IDLE_GAP_MS = { min: 2500, max: 3200 } as const;

/** 不饿：微表情占多数，喝水到散步仍占四成。饿了点心变多。 */
const REST_CUTS: readonly { beat: XiaomeiIdleBeat; until: number }[] = [
  { beat: "blink", until: 0.1 },
  { beat: "yawn", until: 0.18 },
  { beat: "stretch", until: 0.26 },
  { beat: "note", until: 0.33 },
  { beat: "cheer", until: 0.4 },
  { beat: "sigh", until: 0.46 },
  { beat: "glance", until: 0.52 },
  { beat: "smile", until: 0.58 },
  { beat: "drink", until: 0.67 },
  { beat: "snack", until: 0.76 },
  { beat: "umbrella", until: 0.84 },
  { beat: "spin", until: 0.92 },
  { beat: "walk", until: 1 },
];

const HUNGRY_CUTS: readonly { beat: XiaomeiIdleBeat; until: number }[] = [
  { beat: "blink", until: 0.08 },
  { beat: "yawn", until: 0.14 },
  { beat: "stretch", until: 0.2 },
  { beat: "note", until: 0.25 },
  { beat: "cheer", until: 0.29 },
  { beat: "sigh", until: 0.36 },
  { beat: "glance", until: 0.4 },
  { beat: "smile", until: 0.44 },
  { beat: "snack", until: 0.62 },
  { beat: "drink", until: 0.72 },
  { beat: "umbrella", until: 0.8 },
  { beat: "walk", until: 0.9 },
  { beat: "spin", until: 1 },
];

export type XiaomeiTrailContext = XiaomeiIdleBeat | "click" | "feed";

function unitRoll(roll: number): number {
  if (!Number.isFinite(roll)) return 0;
  if (roll <= 0) return 0;
  if (roll >= 1) return 1;
  return roll;
}

function pickBeat(roll: number, hungry: boolean): XiaomeiIdleBeat {
  const table = hungry ? HUNGRY_CUTS : REST_CUTS;
  for (const row of table) {
    if (roll < row.until) return row.beat;
  }
  return table[table.length - 1]?.beat ?? "smile";
}

function isActionBeat(beat: XiaomeiIdleBeat): beat is XiaomeiActionBeat {
  return beat === "drink" || beat === "snack" || beat === "umbrella" || beat === "spin" || beat === "walk";
}

function isMicroBeat(beat: XiaomeiIdleBeat): beat is XiaomeiCueKind {
  return (
    beat === "blink" ||
    beat === "yawn" ||
    beat === "stretch" ||
    beat === "note" ||
    beat === "cheer" ||
    beat === "sigh"
  );
}

/** 同一种动作或微表情不连播。看一眼、笑可以重复。 */
function avoidRepeat(beat: XiaomeiIdleBeat, previous: XiaomeiIdleBeat | null): XiaomeiIdleBeat {
  if (beat !== previous) return beat;
  if (isActionBeat(beat)) {
    const index = XIAOMEI_ACTION_BEATS.indexOf(beat);
    return XIAOMEI_ACTION_BEATS[(index + 1) % XIAOMEI_ACTION_BEATS.length] ?? "drink";
  }
  if (isMicroBeat(beat)) {
    const index = XIAOMEI_MICRO_BEATS.indexOf(beat);
    return XIAOMEI_MICRO_BEATS[(index + 1) % XIAOMEI_MICRO_BEATS.length] ?? "blink";
  }
  return beat;
}

/**
 * 下一拍待机。roll 取 [0, 1]。
 * 不饿时微表情更多。饿的时候点心更常出现，喝水、伞、转圈、散步仍留着。
 */
export function nextIdleBeat(roll: number, previous: XiaomeiIdleBeat | null, hungry: boolean): XiaomeiIdleBeat {
  return avoidRepeat(pickBeat(unitRoll(roll), hungry), previous);
}

export function idleGapMs(roll: number): number {
  const unit = unitRoll(roll);
  const { min, max } = XIAOMEI_IDLE_GAP_MS;
  return Math.round(min + unit * (max - min));
}

function leadMood(settled: XiaomeiMood): XiaomeiMood {
  if (settled === "happy") return "content";
  if (settled === "content") return "blank";
  if (settled === "annoyed" || settled === "sad") return "blank";
  return "content";
}

/** 两帧。待机不主动切到难过；点击和投喂的落点跟这句台词走。 */
export function expressionTrail(
  context: XiaomeiTrailContext,
  settled: XiaomeiMood,
): readonly [XiaomeiMood, XiaomeiMood] {
  if (context === "blink") return ["blank", "content"];
  if (context === "yawn") return ["blank", "content"];
  if (context === "stretch") return ["content", "happy"];
  if (context === "note") return ["blank", "content"];
  if (context === "cheer") return ["content", "happy"];
  if (context === "sigh") return ["blank", "annoyed"];
  if (context === "glance") return ["content", "blank"];
  if (context === "smile") return ["blank", "happy"];
  if (context === "drink") return ["blank", "content"];
  if (context === "snack") return ["content", "happy"];
  if (context === "umbrella") return ["content", "happy"];
  if (context === "spin") return ["blank", "happy"];
  if (context === "walk") return ["content", "blank"];
  return [leadMood(settled), settled];
}

export function xiaomeiMotionClass(beat: XiaomeiIdleBeat | null, dragging: boolean): string | null {
  if (dragging) return null;
  if (beat === "blink") return "xiaomei-blink";
  if (beat === "yawn") return "xiaomei-yawn";
  if (beat === "stretch") return "xiaomei-stretch";
  if (beat === "note") return "xiaomei-note";
  if (beat === "cheer") return "xiaomei-cheer";
  if (beat === "sigh") return "xiaomei-sigh";
  if (beat === "drink") return "xiaomei-drink";
  if (beat === "snack") return "xiaomei-snack";
  if (beat === "umbrella") return "xiaomei-umbrella";
  if (beat === "spin") return "xiaomei-spin";
  if (beat === "walk") return "xiaomei-walk";
  if (beat === "glance") return "xiaomei-glance";
  return "xiaomei-float";
}

export function xiaomeiCueKind(beat: XiaomeiIdleBeat | null): XiaomeiCueKind | null {
  if (beat && isMicroBeat(beat)) return beat;
  return null;
}

/** 聊天状态脸旁边的轻量记号。思考是音符，说完开心是欢呼，没接上是叹气。 */
export function xiaomeiChatCue(
  chatOpen: boolean,
  status: "idle" | "thinking" | "done" | "error",
  replyMood: "happy" | "annoyed",
): XiaomeiCueKind | null {
  if (!chatOpen || status === "idle") return null;
  if (status === "thinking") return "note";
  if (status === "error") return "sigh";
  if (status === "done") return replyMood === "happy" ? "cheer" : "sigh";
  return null;
}

export function xiaomeiPropKind(beat: XiaomeiIdleBeat | null): XiaomeiPropKind | null {
  if (beat === "drink") return "cup";
  if (beat === "snack") return "snack";
  if (beat === "umbrella") return "umbrella";
  return null;
}

/**
 * 聊天中的状态脸优先。引子脸只盖过台词一帧。
 * 没人说话时才用待机拍；悬浮是最后的兜底。
 */
export function resolveXiaomeiFace(input: {
  chatOpen: boolean;
  status: "idle" | "thinking" | "done" | "error";
  replyMood: "happy" | "annoyed";
  speechMood: XiaomeiMood | null;
  moodPin: XiaomeiMood | null;
  leadMood: XiaomeiMood | null;
  beatMood: XiaomeiMood | null;
  hover: boolean;
}): XiaomeiMood {
  if (input.chatOpen && input.status !== "idle") return moodForChatStatus(input.status, input.replyMood);
  if (input.chatOpen) return "content";
  if (input.leadMood) return input.leadMood;
  if (input.speechMood) return input.speechMood;
  if (input.moodPin) return input.moodPin;
  if (input.beatMood) return input.beatMood;
  if (input.hover) return "annoyed";
  return "content";
}
