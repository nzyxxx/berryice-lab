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
 * 活动边沿钉忙。跟立绘最短驻留（XIAOMEI_MIN_HOLD_MS，脸的防闪）不是同一只计数器。
 * 打字停手后再钉约 1.2s；流式答完后再钉约 1.5s。
 */
export const XIAOMEI_TYPE_BUSY_HOLD_MS = 1200;
export const XIAOMEI_STREAM_BUSY_HOLD_MS = 1500;

export type XiaomeiBusyHoldKind = "typing" | "stream";

/** 这只 until 只服务活动边沿，调用方不得拿它去挡换脸。 */
export function busyHoldUntil(kind: XiaomeiBusyHoldKind, atMs: number): number {
  const span = kind === "typing" ? XIAOMEI_TYPE_BUSY_HOLD_MS : XIAOMEI_STREAM_BUSY_HOLD_MS;
  if (!Number.isFinite(atMs)) return span;
  return atMs + span;
}

export function busyHoldActive(untilMs: number, nowMs: number): boolean {
  if (!Number.isFinite(untilMs) || !Number.isFinite(nowMs)) return false;
  return nowMs < untilMs;
}

const PRIORITY_RANK: Record<XiaomeiPriorityState, number> = {
  drag: 80,
  pulse: 70,
  transient: 60,
  wake: 50,
  pinned: 40,
  activity: 30,
  micro: 20,
  sleep: 10,
  idle: 0,
};

/** 待机钩子里的占位：醒 > 睡 > 强制活动 > 点击引子 > 正在播的微动 > 空。 */
export function schedulingHolder(input: {
  sleepPhase: XiaomeiSleepPhase;
  forced?: boolean;
  lead?: boolean;
  active?: boolean;
}): XiaomeiPriorityState {
  if (input.sleepPhase === "wake") return "wake";
  if (isVisuallySleeping(input.sleepPhase)) return "sleep";
  if (input.forced) return "activity";
  if (input.lead) return "transient";
  if (input.active) return "micro";
  return "idle";
}

/**
 * 态/mood 切换门。随机低优先拍在驻留未满时一律不进，哪怕它自己的档看起来不低。
 * 非随机且优先级更高（出错、钉脸、醒）可以立刻打断。
 */
export function admitScheduledSwitch(input: {
  holder: XiaomeiPriorityState | null;
  heldSinceMs: number;
  nowMs: number;
  incoming: XiaomeiPriorityState;
  randomBeat?: boolean;
  minHoldMs?: number;
}): boolean {
  if (!input.holder) return true;
  const held = canChangeAfterHold(input.heldSinceMs, input.nowMs, input.minHoldMs);
  if (input.randomBeat) return held;
  const holderRank = PRIORITY_RANK[input.holder];
  const incomingRank = PRIORITY_RANK[input.incoming];
  if (incomingRank > holderRank) return true;
  return held;
}

/** 同一句用户话连续失败。新的一句从 0 再计；成功清零。 */
export function nextFailureStreak(input: { streak: number; sameTurn: boolean; failed: boolean }): number {
  if (!input.failed) return 0;
  const prior = input.sameTurn && Number.isFinite(input.streak) ? Math.max(0, Math.floor(input.streak)) : 0;
  return prior + 1;
}

/** 1 次仍是叹气；同一回合 ≥2 升到更烦，不再同一强度。 */
export function errorIntensity(consecutiveFailures: number): "sigh" | "annoyed" {
  const n = Number.isFinite(consecutiveFailures) ? consecutiveFailures : 0;
  return n >= 2 ? "annoyed" : "sigh";
}

/** 指针在身上停够才有一次小概率看一眼 / 轻笑，之后进入冷却。 */
export const XIAOMEI_HOVER_DWELL_MS = 1500;
export const XIAOMEI_HOVER_COOLDOWN_MS = 30_000;
export const XIAOMEI_HOVER_CHANCE = 0.35;

export function hoverAttentionDecision(input: {
  dwellMs: number;
  sinceLastMs: number;
  roll: number;
  blocked?: boolean;
}): "glance" | "smile" | null {
  if (input.blocked) return null;
  if (!Number.isFinite(input.dwellMs) || input.dwellMs < XIAOMEI_HOVER_DWELL_MS) return null;
  if (!Number.isFinite(input.sinceLastMs) || input.sinceLastMs < XIAOMEI_HOVER_COOLDOWN_MS) return null;
  const roll = !Number.isFinite(input.roll) ? 1 : Math.min(1, Math.max(0, input.roll));
  if (roll >= XIAOMEI_HOVER_CHANCE) return null;
  return roll < XIAOMEI_HOVER_CHANCE / 2 ? "glance" : "smile";
}

/** 凝视只动瞳孔和微倾。movesPlace 恒为 false：身体锚点不跟光标。 */
export const XIAOMEI_GAZE_MAX_PX = 3;
export const XIAOMEI_GAZE_MAX_TILT = 2.5;

export type XiaomeiAttentionSource = "pointer" | "composer" | "dialogue" | "none";

export type XiaomeiGaze = {
  pupilX: number;
  pupilY: number;
  tiltDeg: number;
  movesPlace: false;
};

function clampGaze(n: number, limit: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(-limit, Math.min(limit, n));
}

export function attentionGaze(input: {
  source: XiaomeiAttentionSource;
  dx?: number;
  dy?: number;
  reducedMotion?: boolean;
}): XiaomeiGaze {
  if (input.reducedMotion || input.source === "none") {
    return { pupilX: 0, pupilY: 0, tiltDeg: 0, movesPlace: false };
  }
  const dx = clampGaze(input.dx ?? 0, 120);
  const dy = clampGaze(input.dy ?? 0, 120);
  let pupilX = (dx / 120) * XIAOMEI_GAZE_MAX_PX;
  let pupilY = (dy / 120) * XIAOMEI_GAZE_MAX_PX;
  let tiltDeg = (dx / 120) * XIAOMEI_GAZE_MAX_TILT;
  if (input.source === "composer") {
    pupilY = XIAOMEI_GAZE_MAX_PX * 0.85;
    tiltDeg = Math.sign(dx || 1) * 1.2;
  } else if (input.source === "dialogue") {
    pupilY = -XIAOMEI_GAZE_MAX_PX * 0.45;
    tiltDeg = Math.sign(dx || -1) * 1.5;
  }
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    pupilX: round(clampGaze(pupilX, XIAOMEI_GAZE_MAX_PX)),
    pupilY: round(clampGaze(pupilY, XIAOMEI_GAZE_MAX_PX)),
    tiltDeg: round(clampGaze(tiltDeg, XIAOMEI_GAZE_MAX_TILT)),
    movesPlace: false,
  };
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

/** 忙时闭嘴：思考中不抽待机甜句，也不挂音符脉冲。 */
export function shouldSuppressIdleChatter(status: XiaomeiChatStatus): boolean {
  return status === "thinking";
}

/**
 * 忙时不给记号。完成只复用已经算出的边沿脉冲，不因为 status===done 再欢呼一次。
 * 出错且没有在播的庆祝时，给一次叹气。
 */
export function quietChatCue(input: {
  status: XiaomeiChatStatus;
  celebrate: "cheer" | "sigh" | null;
  chatOpen: boolean;
  /** 同一回合连续失败。缺省或 1 仍是叹气；≥2 换成鼓一下，不跟叹气同一强度。 */
  errorStreak?: number;
}): "cheer" | "sigh" | "pout" | null {
  if (shouldSuppressIdleChatter(input.status)) return null;
  if (input.celebrate) return input.celebrate;
  if (input.chatOpen && input.status === "error") {
    return errorIntensity(input.errorStreak ?? 0) === "annoyed" ? "pout" : "sigh";
  }
  return null;
}

/** 脉冲窗口还开着就不要重启。没有新脉冲、窗口也空，才清掉。 */
export function shouldStartCelebratePulse(pulse: "cheer" | "sigh" | null, pulseBusy: boolean): boolean {
  return pulse !== null && !pulseBusy;
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
