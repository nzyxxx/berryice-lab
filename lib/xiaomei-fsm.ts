/**
 * 小莓妹 Round3 时序文法：睡眠醒觉、Base/Overlay/Pulse、优先级表、真回合边沿庆祝。
 * 纯计算，不碰 DOM / rAF。只借调度 / 分层 / 边沿方法，绝不抄外部宠像素或品牌口头禅。
 */

import { XIAOMEI_MIN_HOLD_MS, type XiaomeiFace } from "./xiaomei-faces";
import {
  moodForChatStatus,
  XIAOMEI_SCENE_LINES,
  type XiaomeiMood,
} from "./xiaomei-lines";
import { xiaomeiChatFace } from "./xiaomei-actions";

/** 空闲多久才开始入睡三连。角标站得久才睡，避免刚放下就打盹。 */
export const XIAOMEI_SLEEP_AFTER_MS = 60_000;

/** 哈欠进睡：先打哈欠，再空白一下，再进睡脸。 */
export const XIAOMEI_SLEEP_YAWN_MS = 1700;
export const XIAOMEI_SLEEP_BLANK_MS = 600;

/** 醒觉过渡：伸懒腰拍长，跟 XIAOMEI_BEAT_MS.stretch 对齐。 */
export const XIAOMEI_WAKE_MS = 1800;

/** 完成/出错脉冲窗口。跟场景钉脸接近，略短一点。 */
export const XIAOMEI_PULSE_MS = 1400;

/** 最短驻留见 xiaomei-faces.XIAOMEI_MIN_HOLD_MS；此处再导出给调度侧。 */
export { XIAOMEI_MIN_HOLD_MS };

/** 待机眨眼武装：拉开间隔，避免眼皮连眨像闪。 */
export const XIAOMEI_BLINK_ARM_MS = { min: 1600, max: 4000 } as const;

export function blinkArmDelayMs(roll: number): number {
  const unit = !Number.isFinite(roll) || roll <= 0 ? 0 : roll >= 1 ? 1 : roll;
  const { min, max } = XIAOMEI_BLINK_ARM_MS;
  return Math.round(min + unit * (max - min));
}

/** 是否已过最短驻留，可接受下一次低优先态切。 */
export function canChangeAfterHold(heldSinceMs: number, nowMs: number, minHoldMs = XIAOMEI_MIN_HOLD_MS): boolean {
  if (!Number.isFinite(heldSinceMs) || !Number.isFinite(nowMs)) return true;
  return nowMs - heldSinceMs >= minHoldMs;
}

/**
 * 优先级表（文法单源）。行序即优先级：越靠前越高。
 * drag > pulse > transient > wake > pinned(chat) > activity > micro > sleep > idle
 * 单测锁行序；加态只改这张表。
 */
export const XIAOMEI_STATE_PRIORITY = [
  "drag",
  "pulse",
  "transient",
  "wake",
  "pinned",
  "activity",
  "micro",
  "sleep",
  "idle",
] as const;

export type XiaomeiPriorityState = (typeof XIAOMEI_STATE_PRIORITY)[number];

export type XiaomeiSleepPhase = "awake" | "yawn" | "blank" | "sleep" | "wake";

export type XiaomeiLayerKind = "base" | "overlay" | "pulse";

export type XiaomeiChatStatus = "idle" | "thinking" | "done" | "error";

export type XiaomeiBaseKind = "idle" | "sleep" | "thinking" | "done" | "error" | "chat";

/** 场景桶：thinking/done/error 钉死 mood + 台词池，禁止思考时抽开心 idle 句。 */
export type XiaomeiSceneBucket = {
  status: Exclude<XiaomeiChatStatus, "idle">;
  mood: XiaomeiMood;
  face: XiaomeiFace;
  lines: readonly string[];
};

export type XiaomeiPriorityFlags = {
  dragging?: boolean;
  pulseActive?: boolean;
  transientActive?: boolean;
  waking?: boolean;
  chatPinned?: boolean;
  activityActive?: boolean;
  microActive?: boolean;
  sleeping?: boolean;
};

/** 遍历优先级表，返回首个命中的态。 */
export function pickPriorityState(flags: XiaomeiPriorityFlags): XiaomeiPriorityState {
  if (flags.dragging) return "drag";
  if (flags.pulseActive) return "pulse";
  if (flags.transientActive) return "transient";
  if (flags.waking) return "wake";
  if (flags.chatPinned) return "pinned";
  if (flags.activityActive) return "activity";
  if (flags.microActive) return "micro";
  if (flags.sleeping) return "sleep";
  return "idle";
}

/** 单测用：表序必须与约定一致。 */
export function statePriorityOrder(): readonly XiaomeiPriorityState[] {
  return XIAOMEI_STATE_PRIORITY;
}

/**
 * 空闲是否该入睡。减动效 / 聊天钉住 / 已在睡或醒 → 不睡。
 * now - idleSince >= SLEEP_AFTER_MS 才进。
 */
export function shouldEnterSleep(input: {
  idleSince: number;
  now: number;
  sleepPhase: XiaomeiSleepPhase;
  reducedMotion?: boolean;
  chatPinned?: boolean;
  dragging?: boolean;
}): boolean {
  if (input.reducedMotion) return false;
  if (input.chatPinned) return false;
  if (input.dragging) return false;
  if (input.sleepPhase !== "awake") return false;
  if (!Number.isFinite(input.idleSince) || !Number.isFinite(input.now)) return false;
  return input.now - input.idleSince >= XIAOMEI_SLEEP_AFTER_MS;
}

/**
 * 任意交互：重置空闲起点；若视觉上在睡（含哈欠/空白进睡），附加醒觉。
 * 交互后 sleeping 恒 false，避免放下立刻回睡。
 */
export function wakeFromInteraction(input: {
  visuallySleeping: boolean;
}): { sleeping: false; wake: boolean; idleSinceReset: true } {
  return {
    sleeping: false,
    wake: input.visuallySleeping === true,
    idleSinceReset: true,
  };
}

export function isVisuallySleeping(phase: XiaomeiSleepPhase): boolean {
  return phase === "yawn" || phase === "blank" || phase === "sleep";
}

/** 入睡三连的下一相。 */
export function nextSleepPhase(
  phase: XiaomeiSleepPhase,
  elapsedInPhaseMs: number,
): XiaomeiSleepPhase {
  if (phase === "awake") return "yawn";
  if (phase === "yawn") {
    return elapsedInPhaseMs >= XIAOMEI_SLEEP_YAWN_MS ? "blank" : "yawn";
  }
  if (phase === "blank") {
    return elapsedInPhaseMs >= XIAOMEI_SLEEP_BLANK_MS ? "sleep" : "blank";
  }
  if (phase === "wake") {
    return elapsedInPhaseMs >= XIAOMEI_WAKE_MS ? "awake" : "wake";
  }
  return "sleep";
}

/** 睡/醒相用哪张脸。无新立绘：哈欠/伸懒腰/困脸复用现有帧。 */
export function sleepPhaseFace(phase: XiaomeiSleepPhase): XiaomeiFace | null {
  if (phase === "yawn") return "pose_yawn";
  if (phase === "blank") return "blank";
  if (phase === "sleep") return "mood_sleepy";
  if (phase === "wake") return "pose_stretch";
  return null;
}

/**
 * Base / Overlay / Pulse：罩层结束后回到最新底座，绝不盲回 idle。
 */
export function underlayAfterOverlay(base: XiaomeiBaseKind): XiaomeiBaseKind {
  return base;
}

export function resolveBaseKind(input: {
  chatOpen: boolean;
  status: XiaomeiChatStatus;
  sleepPhase: XiaomeiSleepPhase;
}): XiaomeiBaseKind {
  if (input.chatOpen && input.status === "thinking") return "thinking";
  if (input.chatOpen && input.status === "done") return "done";
  if (input.chatOpen && input.status === "error") return "error";
  if (input.chatOpen) return "chat";
  if (input.sleepPhase === "sleep" || input.sleepPhase === "yawn" || input.sleepPhase === "blank") {
    return "sleep";
  }
  return "idle";
}

export function activeLayer(input: {
  dragging?: boolean;
  pulseActive?: boolean;
  transientActive?: boolean;
}): XiaomeiLayerKind {
  if (input.dragging || input.transientActive) return "overlay";
  if (input.pulseActive) return "pulse";
  return "base";
}

/**
 * 真回合边沿：仅 thinking→done 且非取消/断线时庆祝一次。
 * 重复 done、error、idle、cancel 都不 cheer。
 */
export function shouldCelebrate(input: {
  prevStatus: XiaomeiChatStatus;
  nextStatus: XiaomeiChatStatus;
  aborted?: boolean;
  alreadyCelebrated?: boolean;
  replyMood?: "happy" | "annoyed";
}): "cheer" | "sigh" | null {
  if (input.aborted) return null;
  if (input.alreadyCelebrated) return null;
  if (input.prevStatus !== "thinking") return null;
  if (input.nextStatus === "error") return null;
  if (input.nextStatus !== "done") return null;
  return input.replyMood === "annoyed" ? "sigh" : "cheer";
}

/**
 * 边沿检测器：宿主每次 status 变化喂一次，内部记 prev。
 * 首帧只建位不触发。
 */
export function createCelebrateEdge() {
  let prev: XiaomeiChatStatus | null = null;
  let celebrated = false;
  return {
    observe(
      next: XiaomeiChatStatus,
      opts?: { aborted?: boolean; replyMood?: "happy" | "annoyed" },
    ): "cheer" | "sigh" | null {
      if (prev === null) {
        prev = next;
        celebrated = false;
        return null;
      }
      if (next === "thinking") {
        celebrated = false;
      }
      const pulse = shouldCelebrate({
        prevStatus: prev,
        nextStatus: next,
        aborted: opts?.aborted,
        alreadyCelebrated: celebrated,
        replyMood: opts?.replyMood,
      });
      if (pulse) celebrated = true;
      prev = next;
      return pulse;
    },
    reset() {
      prev = null;
      celebrated = false;
    },
  };
}

/** Round2 Knife B 折叠：场景桶钉 mood + face + 台词池。 */
export function sceneBucket(
  status: Exclude<XiaomeiChatStatus, "idle">,
  replyMood: "happy" | "annoyed" | "content" = "happy",
): XiaomeiSceneBucket {
  return {
    status,
    mood: moodForChatStatus(status, replyMood),
    face: xiaomeiChatFace(status, replyMood === "content" ? "happy" : replyMood),
    lines: XIAOMEI_SCENE_LINES[status],
  };
}

/** 思考中禁止抽 idle 开心句：桶内句不得与 idle 池撞车成「开心待机」。 */
export function sceneBucketAllowsIdleHappy(status: XiaomeiChatStatus): boolean {
  return status === "idle" || status === "done";
}

/**
 * 气泡只翻上下，不返回、不改写角色坐标。
 * 上方够高优先上；不够翻下；两侧都紧时仍只选翻面，由调用方夹 maxHeight。
 */
export function bubbleFlipPlacement(input: {
  spaceAbove: number;
  spaceBelow: number;
  bubbleHeight: number;
  gap?: number;
}): "up" | "down" {
  const gap = input.gap ?? 8;
  const need = Math.max(0, input.bubbleHeight) + gap;
  const above = Math.max(0, input.spaceAbove);
  const below = Math.max(0, input.spaceBelow);
  if (above >= need && below < need) return "up";
  if (below >= need && above < need) return "down";
  return above >= below ? "up" : "down";
}

/**
 * 气泡几何：只动气泡盒。输出不含 companion x/y，调用方不得用此结果改 place.pos。
 */
export function placeBubbleBox(input: {
  spaceAbove: number;
  spaceBelow: number;
  bubbleHeight: number;
  gap?: number;
}): { placement: "up" | "down"; maxHeight: number; movesCompanion: false } {
  const placement = bubbleFlipPlacement(input);
  const room = placement === "up" ? input.spaceAbove : input.spaceBelow;
  const gap = input.gap ?? 8;
  return {
    placement,
    maxHeight: Math.max(0, room - gap),
    movesCompanion: false,
  };
}
