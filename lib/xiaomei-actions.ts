/**
 * 小莓妹的短动作和表情微变。纯计算，不碰 DOM、不挂 rAF。
 * 喝水、点心、打伞叠在现有围裙半身像上；转圈是水平翻转，散步是左右轻移。
 * 不新切五张表情，也不换别人的外形。
 * 待机间隔比原先的 9–14 秒密，但动作只占少数拍，同一种动作不连播。
 */

import { moodForChatStatus, type XiaomeiMood } from "./xiaomei-lines";

export const XIAOMEI_IDLE_BEATS = ["glance", "smile", "drink", "snack", "umbrella", "spin", "walk"] as const;

export type XiaomeiIdleBeat = (typeof XIAOMEI_IDLE_BEATS)[number];

/** 带小道具的拍。转圈和散步只动身体。 */
export const XIAOMEI_ACTION_BEATS = ["drink", "snack", "umbrella", "spin", "walk"] as const;

export type XiaomeiActionBeat = (typeof XIAOMEI_ACTION_BEATS)[number];

export type XiaomeiPropKind = "cup" | "snack" | "umbrella";

/** 和 app/globals.css 里的 animation-duration 对齐。改一边要改另一边。 */
export const XIAOMEI_BEAT_MS = {
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

/** 比旧的 9000ms 下限密，仍长过最长的一拍，两拍不会叠在一起。 */
export const XIAOMEI_IDLE_GAP_MS = { min: 4800, max: 7600 } as const;

const REST_CUTS: readonly { beat: XiaomeiIdleBeat; until: number }[] = [
  { beat: "smile", until: 0.36 },
  { beat: "glance", until: 0.68 },
  { beat: "drink", until: 0.76 },
  { beat: "snack", until: 0.84 },
  { beat: "umbrella", until: 0.9 },
  { beat: "spin", until: 0.95 },
  { beat: "walk", until: 1 },
];

const HUNGRY_CUTS: readonly { beat: XiaomeiIdleBeat; until: number }[] = [
  { beat: "smile", until: 0.26 },
  { beat: "glance", until: 0.52 },
  { beat: "snack", until: 0.68 },
  { beat: "drink", until: 0.78 },
  { beat: "umbrella", until: 0.86 },
  { beat: "walk", until: 0.93 },
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

/** 同一种动作不连播。换成动作环里的下一种，表情拍可以重复。 */
function avoidRepeat(beat: XiaomeiIdleBeat, previous: XiaomeiIdleBeat | null): XiaomeiIdleBeat {
  if (beat !== previous || !isActionBeat(beat)) return beat;
  const index = XIAOMEI_ACTION_BEATS.indexOf(beat);
  return XIAOMEI_ACTION_BEATS[(index + 1) % XIAOMEI_ACTION_BEATS.length] ?? "drink";
}

/**
 * 下一拍待机。roll 取 [0, 1]。
 * 不饿时表情占多数。饿的时候点心更常出现，喝水、伞、转圈、散步仍留着。
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
  if (beat === "drink") return "xiaomei-drink";
  if (beat === "snack") return "xiaomei-snack";
  if (beat === "umbrella") return "xiaomei-umbrella";
  if (beat === "spin") return "xiaomei-spin";
  if (beat === "walk") return "xiaomei-walk";
  if (beat === "glance") return "xiaomei-glance";
  return "xiaomei-float";
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
