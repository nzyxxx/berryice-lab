/**
 * 小莓妹的短动作和表情微变。纯计算，不碰 DOM、不挂 rAF。
 * 眨眼是四帧全身换图。十二张新情绪跟五张旧脸一样换 src。
 * 喝水是端杯再抿，不再用跳动的 SVG 杯子。点心、伞仍是道具。
 * 转圈是水平翻转，散步是左右走动。
 * 菜单关上、没有台词时，十秒里大约三拍，几乎每拍都在动。
 * 间隔长过最长的一拍。同一种动作或微表情不连播。
 */

import { type XiaomeiDrinkPose, type XiaomeiFace } from "./xiaomei-faces";
import { type XiaomeiMood } from "./xiaomei-lines";

export const XIAOMEI_IDLE_BEATS = [
  "blink",
  "blink2",
  "slowblink",
  "yawn",
  "stretch",
  "peek",
  "nod",
  "tilt",
  "pout",
  "note",
  "cheer",
  "sigh",
  "glance",
  "smile",
  "sip",
  "drink",
  "hold",
  "wipe",
  "snack",
  "hum",
  "sway",
  "umbrella",
  "spin",
  "walk",
] as const;

export type XiaomeiIdleBeat = (typeof XIAOMEI_IDLE_BEATS)[number];

/** 带道具或整段身体位移的拍。转圈和散步只动身体。 */
export const XIAOMEI_ACTION_BEATS = ["drink", "sip", "hold", "wipe", "snack", "hum", "sway", "umbrella", "spin", "walk"] as const;

export type XiaomeiActionBeat = (typeof XIAOMEI_ACTION_BEATS)[number];

/** 不连播的脸部拍。看一眼、笑可以重复。 */
export const XIAOMEI_MICRO_BEATS = [
  "blink",
  "blink2",
  "slowblink",
  "yawn",
  "stretch",
  "peek",
  "nod",
  "tilt",
  "pout",
  "note",
  "cheer",
  "sigh",
] as const;

/** 叠在现有脸上的记号。音符和欢呼仍先藏着，不拿来连播。 */
export const XIAOMEI_CUE_BEATS = ["blink", "blink2", "slowblink", "yawn", "stretch", "note", "hum", "cheer", "sigh"] as const;

export type XiaomeiCueKind = (typeof XIAOMEI_CUE_BEATS)[number];

export type XiaomeiPropKind = "cup" | "snack" | "umbrella";

/** 杯子和点心怎么拿。伞不在这里，贴纸先不画。 */
export type XiaomeiPropPose = "raise" | "sip" | "hold" | "bite";

/** 和 app/globals.css 里的 animation-duration 对齐。改一边要改另一边。 */
export const XIAOMEI_BEAT_MS = {
  blink: 900,
  blink2: 1100,
  slowblink: 1400,
  yawn: 1700,
  stretch: 1800,
  peek: 1500,
  nod: 1200,
  tilt: 1600,
  pout: 1400,
  note: 1500,
  cheer: 1400,
  sigh: 1600,
  glance: 1600,
  smile: 1500,
  sip: 1600,
  drink: 2300,
  hold: 2000,
  wipe: 1500,
  snack: 2100,
  hum: 1800,
  sway: 2200,
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
  { beat: "blink", until: 0.05 },
  { beat: "blink2", until: 0.09 },
  { beat: "slowblink", until: 0.14 },
  { beat: "yawn", until: 0.19 },
  { beat: "stretch", until: 0.24 },
  { beat: "peek", until: 0.29 },
  { beat: "glance", until: 0.34 },
  { beat: "nod", until: 0.39 },
  { beat: "tilt", until: 0.45 },
  { beat: "smile", until: 0.51 },
  { beat: "pout", until: 0.56 },
  { beat: "sigh", until: 0.6 },
  { beat: "note", until: 0.63 },
  { beat: "cheer", until: 0.64 },
  { beat: "hum", until: 0.68 },
  { beat: "sip", until: 0.72 },
  { beat: "drink", until: 0.77 },
  { beat: "hold", until: 0.82 },
  { beat: "wipe", until: 0.86 },
  { beat: "snack", until: 0.9 },
  { beat: "sway", until: 0.93 },
  { beat: "umbrella", until: 0.95 },
  { beat: "spin", until: 0.96 },
  { beat: "walk", until: 1 },
];

const HUNGRY_CUTS: readonly { beat: XiaomeiIdleBeat; until: number }[] = [
  { beat: "blink", until: 0.04 },
  { beat: "slowblink", until: 0.08 },
  { beat: "yawn", until: 0.12 },
  { beat: "sigh", until: 0.16 },
  { beat: "pout", until: 0.2 },
  { beat: "glance", until: 0.25 },
  { beat: "peek", until: 0.3 },
  { beat: "snack", until: 0.5 },
  { beat: "sip", until: 0.58 },
  { beat: "drink", until: 0.66 },
  { beat: "hold", until: 0.7 },
  { beat: "hum", until: 0.74 },
  { beat: "sway", until: 0.78 },
  { beat: "wipe", until: 0.82 },
  { beat: "umbrella", until: 0.86 },
  { beat: "walk", until: 0.94 },
  { beat: "spin", until: 1 },
];

export type XiaomeiTrailContext = XiaomeiIdleBeat | "click" | "feed" | "pet" | "mutter";

/**
 * 站立眨眼。睁眼是待机底，所以第一帧和结束后的底图接得上。
 * 四帧一共约三分之一秒，间隔另排，避免连闪。
 */
export const XIAOMEI_BLINK_CYCLE = ["blink_open", "blink_half", "blink_closed", "blink_half"] as const;

export const XIAOMEI_BLINK_FRAME_MS = [90, 70, 110, 70] as const;

export const XIAOMEI_BLINK_CYCLE_MS = XIAOMEI_BLINK_FRAME_MS.reduce((sum, ms) => sum + ms, 0);

/** 端着看清，再抿一口。两段加起来等于喝水这一拍。 */
export const XIAOMEI_DRINK_HOLD_MS = 1100;

export function blinkFaceAt(elapsedMs: number): (typeof XIAOMEI_BLINK_CYCLE)[number] | null {
  if (!Number.isFinite(elapsedMs)) return null;
  if (elapsedMs < 0) return XIAOMEI_BLINK_CYCLE[0];
  let cursor = 0;
  for (let index = 0; index < XIAOMEI_BLINK_CYCLE.length; index += 1) {
    cursor += XIAOMEI_BLINK_FRAME_MS[index] ?? 0;
    if (elapsedMs < cursor) return XIAOMEI_BLINK_CYCLE[index] ?? null;
  }
  return null;
}

export function drinkFaceAt(elapsedMs: number): XiaomeiDrinkPose | null {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return "pose_drink_hold";
  if (elapsedMs < XIAOMEI_DRINK_HOLD_MS) return "pose_drink_hold";
  if (elapsedMs < XIAOMEI_BEAT_MS.drink) return "pose_drink_sip";
  return null;
}

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
  return (XIAOMEI_ACTION_BEATS as readonly XiaomeiIdleBeat[]).includes(beat);
}

function isMicroBeat(beat: XiaomeiIdleBeat): beat is (typeof XIAOMEI_MICRO_BEATS)[number] {
  return (XIAOMEI_MICRO_BEATS as readonly XiaomeiIdleBeat[]).includes(beat);
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

const REACTION_LEAD = {
  click: {
    happy: "mood_wink",
    content: "mood_shy",
    annoyed: "mood_puff",
    sad: "mood_cry",
    blank: "mood_thinking",
  },
  feed: {
    happy: "mood_eager",
    content: "mood_soft",
    annoyed: "mood_puff",
    sad: "mood_cry",
    blank: "mood_surprised",
  },
  pet: {
    happy: "mood_love",
    content: "mood_shy",
    annoyed: "mood_puff",
    sad: "mood_soft",
    blank: "mood_thinking",
  },
  mutter: {
    happy: "mood_smug",
    content: "mood_cool",
    annoyed: "mood_puff",
    sad: "mood_soft",
    blank: "mood_thinking",
  },
} as const satisfies Record<"click" | "feed" | "pet" | "mutter", Record<XiaomeiMood, XiaomeiFace>>;

/** 两帧。待机不切难过脸；点击、投喂、摸头、碎碎念的落点跟这句台词走。 */
export function expressionTrail(
  context: XiaomeiTrailContext,
  settled: XiaomeiMood,
): readonly [XiaomeiFace, XiaomeiFace] {
  if (context === "blink" || context === "blink2" || context === "slowblink") return ["blink_open", "blink_half"];
  if (context === "yawn") return ["mood_sleepy", "blink_closed"];
  if (context === "stretch") return ["mood_eager", "happy"];
  if (context === "peek") return ["mood_thinking", "blank"];
  if (context === "nod") return ["mood_soft", "happy"];
  if (context === "tilt") return ["mood_cool", "content"];
  if (context === "pout") return ["mood_puff", "annoyed"];
  if (context === "note") return ["mood_thinking", "blank"];
  if (context === "cheer") return ["mood_love", "mood_eager"];
  if (context === "sigh") return ["mood_sleepy", "mood_soft"];
  if (context === "glance") return ["mood_cool", "mood_thinking"];
  if (context === "smile") return ["mood_smug", "mood_wink"];
  if (context === "sip" || context === "drink") return ["pose_drink_hold", "pose_drink_sip"];
  if (context === "hold") return ["pose_drink_hold", "content"];
  if (context === "wipe") return ["mood_puff", "content"];
  if (context === "hum") return ["mood_soft", "happy"];
  if (context === "sway") return ["mood_cool", "happy"];
  if (context === "snack") return ["mood_eager", "happy"];
  if (context === "umbrella") return ["mood_cool", "content"];
  if (context === "spin") return ["mood_surprised", "mood_eager"];
  if (context === "walk") return ["mood_shy", "blank"];
  return [REACTION_LEAD[context][settled], settled];
}

export function xiaomeiMotionClass(beat: XiaomeiIdleBeat | null, dragging: boolean): string | null {
  if (dragging) return null;
  if (beat === "blink" || beat === "blink2" || beat === "slowblink") return "xiaomei-float";
  if (beat === "drink" || beat === "sip" || beat === "hold") return null;
  if (beat === "yawn") return "xiaomei-yawn";
  if (beat === "stretch") return "xiaomei-stretch";
  if (beat === "peek") return "xiaomei-peek";
  if (beat === "nod") return "xiaomei-nod";
  if (beat === "tilt") return "xiaomei-tilt";
  if (beat === "pout") return "xiaomei-pout";
  if (beat === "note") return "xiaomei-note";
  if (beat === "cheer") return "xiaomei-cheer";
  if (beat === "sigh") return "xiaomei-sigh";
  if (beat === "wipe") return "xiaomei-wipe";
  if (beat === "snack") return "xiaomei-snack";
  if (beat === "hum") return "xiaomei-hum";
  if (beat === "sway") return "xiaomei-sway";
  if (beat === "umbrella") return "xiaomei-umbrella";
  if (beat === "spin") return "xiaomei-spin";
  if (beat === "walk") return "xiaomei-walk";
  if (beat === "glance") return "xiaomei-glance";
  return "xiaomei-float";
}

export function xiaomeiCueKind(beat: XiaomeiIdleBeat | null): XiaomeiCueKind | null {
  if (beat === "blink" || beat === "blink2" || beat === "slowblink" || beat === "yawn") return null;
  if (beat === "stretch" || beat === "note" || beat === "hum" || beat === "cheer" || beat === "sigh") return beat;
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
  if (beat === "snack") return "snack";
  if (beat === "umbrella") return "umbrella";
  return null;
}

/** 点心怎么拿。喝水改全身姿势，不再叠杯子。 */
export function xiaomeiPropPose(beat: XiaomeiIdleBeat | null): XiaomeiPropPose | null {
  if (beat === "snack") return "bite";
  return null;
}

/** 聊天时盖上的脸。想用思考，说完开心用期待，没接上用鼓脸。台词情绪仍走原来的五张。 */
export function xiaomeiChatFace(
  status: "thinking" | "done" | "error",
  replyMood: "happy" | "annoyed" | "content" = "happy",
): XiaomeiFace {
  if (status === "thinking") return "mood_thinking";
  if (status === "error") return "mood_puff";
  return replyMood === "happy" ? "mood_eager" : "mood_cool";
}

/**
 * 聊天中的状态脸优先，喝水姿势盖过台词，眨眼只盖站立的空档。
 * 引子脸盖过台词一帧。没人说话时才用待机拍。
 * 什么都没有时站在睁眼的 blink_open 上，眨眼才接得上。
 */
export function resolveXiaomeiFace(input: {
  chatOpen: boolean;
  status: "idle" | "thinking" | "done" | "error";
  replyMood: "happy" | "annoyed";
  speechMood: XiaomeiMood | null;
  moodPin: XiaomeiMood | null;
  leadMood: XiaomeiFace | null;
  beatMood: XiaomeiFace | null;
  poseFace?: XiaomeiFace | null;
  blinkFace?: XiaomeiFace | null;
  hover: boolean;
}): XiaomeiFace {
  if (input.chatOpen && input.status !== "idle") return xiaomeiChatFace(input.status, input.replyMood);
  if (input.poseFace) return input.poseFace;
  if (input.chatOpen) return "content";
  if (input.leadMood) return input.leadMood;
  if (input.speechMood) return input.speechMood;
  if (input.moodPin) return input.moodPin;
  if (input.beatMood) return input.beatMood;
  if (input.blinkFace) return input.blinkFace;
  if (input.hover) return "annoyed";
  return "blink_open";
}
