/**
 * 小莓的短动作和表情微变。纯计算，不碰 DOM、不挂 rAF。
 * 眨眼是四帧全身换图。十二张新情绪跟五张旧脸一样换 src。
 * 喝水是端杯再抿，不再用跳动的 SVG 杯子。点心、伞仍是道具。
 * 站姿微动作也换全身图：歪头、偷看、鞠躬、比心，不再靠转图层假装。
 * 哈欠和伸懒腰换整张。转圈按三帧换，不再压扁翻转。散步先往左迈再往右迈，左右是两套画。
 * 点心是先捧着再咬。伞是撑开拿着。都不再叠跳动的贴纸。
 * 菜单关上、没有台词时，十秒里大约三拍，几乎每拍都在动。
 * 间隔长过最长的一拍。同一种动作或微表情不连播。
 */

import {
  type XiaomeiActivityPose,
  type XiaomeiDrinkPose,
  type XiaomeiFace,
  type XiaomeiItemPose,
  type XiaomeiStandPose,
} from "./xiaomei-faces";
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

/** 进场先招手，再轻轻鞠一躬。短于问候台词，鞠躬完才露出这句的脸。 */
export const XIAOMEI_GREET_WAVE_MS = 1100;

export const XIAOMEI_GREET_MS = 2400;

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

/** 先看清点心，再咬一口。两段加起来等于这一拍，之后回到原来的表情。 */
export const XIAOMEI_SNACK_HOLD_MS = 1000;

export function snackFaceAt(elapsedMs: number): Extract<XiaomeiItemPose, "pose_snack_hold" | "pose_snack_bite"> | null {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return "pose_snack_hold";
  if (elapsedMs < XIAOMEI_SNACK_HOLD_MS) return "pose_snack_hold";
  if (elapsedMs < XIAOMEI_BEAT_MS.snack) return "pose_snack_bite";
  return null;
}

export function umbrellaFaceAt(elapsedMs: number): Extract<XiaomeiItemPose, "pose_umbrella_hold"> | null {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return "pose_umbrella_hold";
  if (elapsedMs < XIAOMEI_BEAT_MS.umbrella) return "pose_umbrella_hold";
  return null;
}

export function greetFaceAt(elapsedMs: number): Extract<XiaomeiStandPose, "pose_wave" | "pose_bow"> | null {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return "pose_wave";
  if (elapsedMs < XIAOMEI_GREET_WAVE_MS) return "pose_wave";
  if (elapsedMs < XIAOMEI_GREET_MS) return "pose_bow";
  return null;
}

/** 转圈三帧。第三帧落地偏软，仍留在这一拍里。 */
export const XIAOMEI_SPIN_CYCLE = ["pose_spin_1", "pose_spin_2", "pose_spin_3"] as const;

export const XIAOMEI_SPIN_AT_MS = [0, 670, 1340] as const;

/** 一步 600ms。前半拍往左，后半拍往右。 */
export const XIAOMEI_WALK_STEP_MS = 600;

export const XIAOMEI_WALK_AT_MS = [0, 600, 1200, 1800] as const;

export function spinFaceAt(elapsedMs: number): (typeof XIAOMEI_SPIN_CYCLE)[number] | null {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return "pose_spin_1";
  if (elapsedMs >= XIAOMEI_BEAT_MS.spin) return null;
  if (elapsedMs < XIAOMEI_SPIN_AT_MS[1]) return "pose_spin_1";
  if (elapsedMs < XIAOMEI_SPIN_AT_MS[2]) return "pose_spin_2";
  return "pose_spin_3";
}

export function walkFaceAt(elapsedMs: number): Extract<
  XiaomeiActivityPose,
  "pose_walk_l_1" | "pose_walk_l_2" | "pose_walk_r_1" | "pose_walk_r_2"
> | null {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return "pose_walk_l_1";
  if (elapsedMs >= XIAOMEI_BEAT_MS.walk) return null;
  const half = XIAOMEI_BEAT_MS.walk / 2;
  if (elapsedMs < half) return elapsedMs < XIAOMEI_WALK_STEP_MS ? "pose_walk_l_1" : "pose_walk_l_2";
  return elapsedMs < half + XIAOMEI_WALK_STEP_MS ? "pose_walk_r_1" : "pose_walk_r_2";
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
/**
 * 靠近聊天输入区时，把非位移的微动往栖息偏：托腮（smile）、空白（note）、端着（hold）。
 * 散步、转圈、点心、喝水、伞不改，避免栖姿把大动作吃掉。
 */
function biasTowardPerch(beat: XiaomeiIdleBeat, roll: number): XiaomeiIdleBeat {
  if (
    beat === "walk" ||
    beat === "spin" ||
    beat === "snack" ||
    beat === "drink" ||
    beat === "sip" ||
    beat === "umbrella" ||
    beat === "sway"
  ) {
    return beat;
  }
  if (roll < 0.2) return "smile";
  if (roll < 0.4) return "note";
  if (roll < 0.6) return "hold";
  return beat;
}

export function nextIdleBeat(
  roll: number,
  previous: XiaomeiIdleBeat | null,
  hungry: boolean,
  nearComposer = false,
): XiaomeiIdleBeat {
  const beat = avoidRepeat(pickBeat(unitRoll(roll), hungry), previous);
  if (!nearComposer) return beat;
  return biasTowardPerch(beat, unitRoll(roll));
}

export function idleGapMs(roll: number): number {
  const unit = unitRoll(roll);
  const { min, max } = XIAOMEI_IDLE_GAP_MS;
  return Math.round(min + unit * (max - min));
}

const REACTION_LEAD = {
  click: {
    happy: "mood_wink",
    content: "pose_heart",
    annoyed: "mood_puff",
    sad: "mood_cry",
    blank: "pose_point",
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
  if (context === "yawn") return ["pose_yawn", "pose_yawn"];
  if (context === "stretch") return ["pose_stretch", "pose_stretch"];
  if (context === "peek") return ["pose_peek", "pose_peek"];
  if (context === "nod") return ["pose_bow", "pose_clasp"];
  if (context === "tilt") return ["pose_tilt_l", "pose_tilt_r"];
  if (context === "pout") return ["mood_puff", "annoyed"];
  if (context === "note") return ["mood_thinking", "blank"];
  if (context === "cheer") return ["mood_love", "mood_eager"];
  if (context === "sigh") return ["mood_sleepy", "mood_soft"];
  if (context === "glance") return ["mood_cool", "mood_thinking"];
  if (context === "smile") return ["pose_cheek", "pose_peace"];
  if (context === "sip" || context === "drink") return ["pose_drink_hold", "pose_drink_sip"];
  if (context === "hold") return ["pose_drink_hold", "content"];
  if (context === "wipe") return ["mood_puff", "content"];
  if (context === "hum") return ["mood_soft", "happy"];
  if (context === "sway") return ["mood_cool", "happy"];
  if (context === "snack") return ["pose_snack_hold", "pose_snack_bite"];
  if (context === "umbrella") return ["pose_umbrella_hold", "pose_umbrella_hold"];
  if (context === "spin") return ["pose_spin_1", "pose_spin_2"];
  if (context === "walk") return ["pose_walk_l_1", "pose_walk_r_1"];
  return [REACTION_LEAD[context][settled], settled];
}

export function xiaomeiMotionClass(beat: XiaomeiIdleBeat | null, dragging: boolean): string | null {
  if (dragging) return null;
  if (beat === "blink" || beat === "blink2" || beat === "slowblink") return "xiaomei-float";
  // 散步只做轻起步/收步，不搬大位移（迈步已画在姿势帧里）。
  if (beat === "walk") return "xiaomei-walk";
  // 喝水/点心/伞/转圈：全身帧自己带动作，只补软进软出。
  if (
    beat === "drink" ||
    beat === "sip" ||
    beat === "hold" ||
    beat === "snack" ||
    beat === "umbrella" ||
    beat === "spin"
  ) {
    return "xiaomei-activity-soft";
  }
  // 这些姿势已经画在图里。再压扁、翻转或滑步会和画面抢。哈欠和伸懒腰仍轻轻呼吸。
  if (beat === "yawn" || beat === "stretch" || beat === "peek" || beat === "tilt") return "xiaomei-float";
  if (beat === "nod") return "xiaomei-nod";
  if (beat === "pout") return "xiaomei-pout";
  if (beat === "note") return "xiaomei-note";
  if (beat === "cheer") return "xiaomei-cheer";
  if (beat === "sigh") return "xiaomei-sigh";
  if (beat === "wipe") return "xiaomei-wipe";
  if (beat === "hum") return "xiaomei-hum";
  if (beat === "sway") return "xiaomei-sway";
  if (beat === "glance") return "xiaomei-glance";
  return "xiaomei-float";
}

export function xiaomeiCueKind(beat: XiaomeiIdleBeat | null): XiaomeiCueKind | null {
  if (beat === "blink" || beat === "blink2" || beat === "slowblink" || beat === "yawn") return null;
  if (beat === "stretch" || beat === "note" || beat === "hum" || beat === "cheer" || beat === "sigh") return beat;
  return null;
}

/**
 * 聊天记号。忙时不挂音符。完成的欢呼只走边沿脉冲，这里不再为 done 给第二次。
 */
export function xiaomeiChatCue(
  chatOpen: boolean,
  status: "idle" | "thinking" | "done" | "error",
  replyMood: "happy" | "annoyed",
): XiaomeiCueKind | null {
  void replyMood;
  if (!chatOpen || status === "idle" || status === "thinking" || status === "done") return null;
  if (status === "error") return "sigh";
  return null;
}

/** 喝水、点心、伞都画在全身里，不再浮第二只。 */
export function xiaomeiPropKind(beat: XiaomeiIdleBeat | null): XiaomeiPropKind | null {
  void beat;
  return null;
}

/** 道具姿势留给旧贴纸。全身换帧之后这里为空。 */
export function xiaomeiPropPose(beat: XiaomeiIdleBeat | null): XiaomeiPropPose | null {
  void beat;
  return null;
}

/** 聊天时盖上的脸。想用思考，说完开心用期待，没接上用鼓脸。台词情绪仍走原来的五张。 */
export function xiaomeiChatFace(
  status: "thinking" | "done" | "error",
  replyMood: "happy" | "annoyed" | "content" = "happy",
  errorStreak = 0,
): XiaomeiFace {
  if (status === "thinking") return "mood_thinking";
  if (status === "error") return errorStreak >= 2 ? "annoyed" : "mood_puff";
  return replyMood === "happy" ? "mood_eager" : "mood_cool";
}

/**
 * Base / Overlay / Pulse 脸解析。
 * overlay（摸头戳身引子）可短盖底座；结束后回到最新 base（聊天态），绝不盲回 idle。
 * pulse 走聊天 done/error 脸。睡/醒相用现有哈欠伸懒腰困脸，无新立绘。
 * 喝水姿势盖过台词；眨眼只盖站立空档。什么都没有时站 blink_open。
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
  /** 摸头/戳身等短罩层进行中。为真时引子/姿势可盖过聊天底座。 */
  overlayActive?: boolean;
  /** 入睡三连 / 醒觉相。 */
  sleepPhase?: "awake" | "yawn" | "blank" | "sleep" | "wake";
  /** 同一回合连续失败。≥2 时出错脸从鼓一下升到 annoyed 全身。 */
  errorStreak?: number;
  /** 打字 / 答完边沿钉忙。跟换脸最短驻留不是同一只计数器。 */
  busyHold?: boolean;
  /** 贴边探着时，悬停保持探姿。 */
  peekHeld?: boolean;
  /** 靠近聊天输入区：托腮，复用 pose_cheek。 */
  perch?: boolean;
}): XiaomeiFace {
  const phase = input.sleepPhase ?? "awake";
  const busy = input.status === "thinking" || input.busyHold === true;
  // 醒觉高于钉脸。忙的时候哈欠和睡脸让开，工作脸钉住。
  if (phase === "wake" && input.poseFace) return input.poseFace;
  if (!busy && phase === "yawn" && input.poseFace) return input.poseFace;
  if (!busy && phase === "blank") return input.poseFace ?? "blank";
  if (!busy && phase === "sleep") {
    // 睡着被悬停：探一下，松手回到困脸。不在这里醒。
    if (input.hover) return "pose_peek";
    return input.poseFace ?? "mood_sleepy";
  }

  // 短罩层：播完由调用方清 overlayActive，再解析时回到最新聊天/待机底座。
  if (input.overlayActive) {
    if (input.poseFace) return input.poseFace;
    if (input.leadMood) return input.leadMood;
  }

  if (busy) return "mood_thinking";
  if (input.chatOpen && input.status !== "idle") {
    return xiaomeiChatFace(input.status, input.replyMood, input.errorStreak ?? 0);
  }
  if (input.peekHeld) return "pose_peek";
  if (input.perch) return "pose_cheek";
  if (input.poseFace) return input.poseFace;
  if (input.chatOpen) return "content";
  if (input.leadMood) return input.leadMood;
  if (input.speechMood) return input.speechMood;
  if (input.moodPin) return input.moodPin;
  if (input.beatMood) return input.beatMood;
  if (input.blinkFace) return input.blinkFace;
  // hover 不再硬切 annoyed 全身：悬停反应走 flashClick 引子；
  // 否则悬停时眨眼会在 volume 分层与旧全身之间来回切，看起来不停闪。
  void input.hover;
  return "blink_open";
}
