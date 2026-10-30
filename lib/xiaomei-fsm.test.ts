import assert from "node:assert/strict";
import test from "node:test";

import {
  XIAOMEI_PULSE_MS,
  XIAOMEI_SLEEP_AFTER_MS,
  XIAOMEI_SLEEP_BLANK_MS,
  XIAOMEI_SLEEP_YAWN_MS,
  XIAOMEI_STATE_PRIORITY,
  XIAOMEI_WAKE_MS,
  activeLayer,
  bubbleFlipPlacement,
  createCelebrateEdge,
  isVisuallySleeping,
  nextSleepPhase,
  pickPriorityState,
  placeBubbleBox,
  resolveBaseKind,
  sceneBucket,
  sceneBucketAllowsIdleHappy,
  quietChatCue,
  shouldCelebrate,
  shouldEnterSleep,
  shouldStartCelebratePulse,
  shouldSuppressIdleChatter,
  sleepPhaseFace,
  statePriorityOrder,
  underlayAfterOverlay,
  wakeFromInteraction,
  blinkArmDelayMs,
  canChangeAfterHold,
  XIAOMEI_BLINK_ARM_MS,
  XIAOMEI_MIN_HOLD_MS,
} from "./xiaomei-fsm.ts";
import { XIAOMEI_SCENE_LINES } from "./xiaomei-lines.ts";

test("优先级表文法单源：行序 drag>pulse>transient>wake>pinned>activity>micro>sleep>idle", () => {
  assert.deepEqual(statePriorityOrder(), [
    "drag",
    "pulse",
    "transient",
    "wake",
    "pinned",
    "activity",
    "micro",
    "sleep",
    "idle",
  ]);
  assert.equal(XIAOMEI_STATE_PRIORITY[0], "drag");
  assert.equal(XIAOMEI_STATE_PRIORITY[XIAOMEI_STATE_PRIORITY.length - 1], "idle");

  assert.equal(pickPriorityState({ dragging: true, sleeping: true, chatPinned: true }), "drag");
  assert.equal(pickPriorityState({ pulseActive: true, chatPinned: true, sleeping: true }), "pulse");
  assert.equal(pickPriorityState({ transientActive: true, chatPinned: true }), "transient");
  assert.equal(pickPriorityState({ waking: true, chatPinned: true, sleeping: true }), "wake");
  assert.equal(pickPriorityState({ chatPinned: true, activityActive: true, sleeping: true }), "pinned");
  assert.equal(pickPriorityState({ activityActive: true, microActive: true, sleeping: true }), "activity");
  assert.equal(pickPriorityState({ microActive: true, sleeping: true }), "micro");
  assert.equal(pickPriorityState({ sleeping: true }), "sleep");
  assert.equal(pickPriorityState({}), "idle");
});

test("睡眠三连：久闲入睡，交互醒觉并重置 idleSince，不会立刻回睡", () => {
  const t0 = 1_000_000;
  assert.equal(
    shouldEnterSleep({ idleSince: t0, now: t0 + XIAOMEI_SLEEP_AFTER_MS - 1, sleepPhase: "awake" }),
    false,
  );
  assert.equal(
    shouldEnterSleep({ idleSince: t0, now: t0 + XIAOMEI_SLEEP_AFTER_MS, sleepPhase: "awake" }),
    true,
  );
  assert.equal(
    shouldEnterSleep({
      idleSince: t0,
      now: t0 + XIAOMEI_SLEEP_AFTER_MS * 2,
      sleepPhase: "awake",
      reducedMotion: true,
    }),
    false,
  );
  assert.equal(
    shouldEnterSleep({
      idleSince: t0,
      now: t0 + XIAOMEI_SLEEP_AFTER_MS * 2,
      sleepPhase: "awake",
      chatPinned: true,
    }),
    false,
  );

  assert.equal(nextSleepPhase("awake", 0), "yawn");
  assert.equal(nextSleepPhase("yawn", XIAOMEI_SLEEP_YAWN_MS - 1), "yawn");
  assert.equal(nextSleepPhase("yawn", XIAOMEI_SLEEP_YAWN_MS), "blank");
  assert.equal(nextSleepPhase("blank", XIAOMEI_SLEEP_BLANK_MS), "sleep");
  assert.equal(nextSleepPhase("sleep", 99999), "sleep");
  assert.equal(nextSleepPhase("wake", XIAOMEI_WAKE_MS - 1), "wake");
  assert.equal(nextSleepPhase("wake", XIAOMEI_WAKE_MS), "awake");

  assert.equal(sleepPhaseFace("yawn"), "pose_yawn");
  assert.equal(sleepPhaseFace("blank"), "blank");
  assert.equal(sleepPhaseFace("sleep"), "mood_sleepy");
  assert.equal(sleepPhaseFace("wake"), "pose_stretch");
  assert.equal(sleepPhaseFace("awake"), null);

  assert.equal(isVisuallySleeping("sleep"), true);
  assert.equal(isVisuallySleeping("yawn"), true);
  assert.equal(isVisuallySleeping("awake"), false);

  const woke = wakeFromInteraction({ visuallySleeping: true });
  assert.equal(woke.sleeping, false);
  assert.equal(woke.wake, true);
  assert.equal(woke.idleSinceReset, true);

  const alreadyUp = wakeFromInteraction({ visuallySleeping: false });
  assert.equal(alreadyUp.sleeping, false);
  assert.equal(alreadyUp.wake, false);
  assert.equal(alreadyUp.idleSinceReset, true);
});

test("Base/Overlay/Pulse：罩层结束回到最新底座，不盲回 idle", () => {
  assert.equal(underlayAfterOverlay("thinking"), "thinking");
  assert.equal(underlayAfterOverlay("done"), "done");
  assert.equal(underlayAfterOverlay("error"), "error");
  assert.equal(underlayAfterOverlay("sleep"), "sleep");
  assert.equal(underlayAfterOverlay("idle"), "idle");

  assert.equal(resolveBaseKind({ chatOpen: true, status: "thinking", sleepPhase: "awake" }), "thinking");
  assert.equal(resolveBaseKind({ chatOpen: true, status: "done", sleepPhase: "sleep" }), "done");
  assert.equal(resolveBaseKind({ chatOpen: false, status: "idle", sleepPhase: "sleep" }), "sleep");
  assert.equal(resolveBaseKind({ chatOpen: false, status: "idle", sleepPhase: "awake" }), "idle");

  assert.equal(activeLayer({ dragging: true, pulseActive: true }), "overlay");
  assert.equal(activeLayer({ pulseActive: true }), "pulse");
  assert.equal(activeLayer({ transientActive: true }), "overlay");
  assert.equal(activeLayer({}), "base");
  assert.ok(XIAOMEI_PULSE_MS >= 1000 && XIAOMEI_PULSE_MS <= 2000);
});

test("真回合边沿庆祝：只在 thinking→done 成功边沿一次；取消/出错不 cheer", () => {
  assert.equal(
    shouldCelebrate({ prevStatus: "thinking", nextStatus: "done" }),
    "cheer",
  );
  assert.equal(
    shouldCelebrate({ prevStatus: "thinking", nextStatus: "done", replyMood: "annoyed" }),
    "sigh",
  );
  assert.equal(shouldCelebrate({ prevStatus: "thinking", nextStatus: "error" }), null);
  assert.equal(shouldCelebrate({ prevStatus: "thinking", nextStatus: "done", aborted: true }), null);
  assert.equal(
    shouldCelebrate({ prevStatus: "thinking", nextStatus: "done", alreadyCelebrated: true }),
    null,
  );
  assert.equal(shouldCelebrate({ prevStatus: "idle", nextStatus: "done" }), null);
  assert.equal(shouldCelebrate({ prevStatus: "done", nextStatus: "done" }), null);
  assert.equal(shouldCelebrate({ prevStatus: "error", nextStatus: "done" }), null);

  const edge = createCelebrateEdge();
  assert.equal(edge.observe("idle"), null);
  assert.equal(edge.observe("thinking"), null);
  assert.equal(edge.observe("done", { replyMood: "happy" }), "cheer");
  assert.equal(edge.observe("done", { replyMood: "happy" }), null);
  assert.equal(edge.observe("thinking"), null);
  assert.equal(edge.observe("error"), null);
  assert.equal(edge.observe("thinking"), null);
  assert.equal(edge.observe("done", { aborted: true }), null);
});

test("忙时闭嘴：思考不抽甜句、不挂音符；庆祝窗口不重开", () => {
  assert.equal(shouldSuppressIdleChatter("thinking"), true);
  assert.equal(shouldSuppressIdleChatter("done"), false);
  assert.equal(shouldSuppressIdleChatter("error"), false);
  assert.equal(shouldSuppressIdleChatter("idle"), false);

  assert.equal(quietChatCue({ status: "thinking", celebrate: "cheer", chatOpen: true }), null);
  assert.equal(quietChatCue({ status: "done", celebrate: "cheer", chatOpen: true }), "cheer");
  assert.equal(quietChatCue({ status: "done", celebrate: null, chatOpen: true }), null);
  assert.equal(quietChatCue({ status: "error", celebrate: null, chatOpen: true }), "sigh");
  assert.equal(quietChatCue({ status: "idle", celebrate: "cheer", chatOpen: false }), "cheer");

  assert.equal(shouldStartCelebratePulse("cheer", false), true);
  assert.equal(shouldStartCelebratePulse("cheer", true), false);
  assert.equal(shouldStartCelebratePulse(null, false), false);
  assert.equal(shouldStartCelebratePulse(null, true), false);
});

test("场景桶钉脸钉词：thinking 不许开心 idle；done/error 各有池", () => {
  const thinking = sceneBucket("thinking");
  assert.equal(thinking.mood, "blank");
  assert.equal(thinking.face, "mood_thinking");
  assert.deepEqual(thinking.lines, XIAOMEI_SCENE_LINES.thinking);
  assert.equal(sceneBucketAllowsIdleHappy("thinking"), false);
  assert.equal(sceneBucketAllowsIdleHappy("error"), false);
  assert.equal(sceneBucketAllowsIdleHappy("done"), true);

  const done = sceneBucket("done", "happy");
  assert.equal(done.mood, "happy");
  assert.ok(done.lines.every((line) => !/蓝莓/.test(line)));
  const err = sceneBucket("error");
  assert.equal(err.mood, "annoyed");
  assert.ok(err.lines.length >= 3);
});

test("气泡锚点只翻上下，不拽角色坐标", () => {
  assert.equal(
    bubbleFlipPlacement({ spaceAbove: 200, spaceBelow: 40, bubbleHeight: 96 }),
    "up",
  );
  assert.equal(
    bubbleFlipPlacement({ spaceAbove: 40, spaceBelow: 200, bubbleHeight: 96 }),
    "down",
  );
  // 变高：上方不够就翻下，输出仍不含 companion 位移。
  // 短气泡：上方够用且更大 → up。变高后上方不够、下方够 → 只翻 down，不改角色坐标。
  const shortBox = placeBubbleBox({ spaceAbove: 200, spaceBelow: 80, bubbleHeight: 64 });
  const tallBox = placeBubbleBox({ spaceAbove: 80, spaceBelow: 200, bubbleHeight: 160 });
  assert.equal(shortBox.placement, "up");
  assert.equal(tallBox.placement, "down");
  assert.equal(shortBox.movesCompanion, false);
  assert.equal(tallBox.movesCompanion, false);
  assert.equal("x" in tallBox, false);
  assert.equal("y" in tallBox, false);
  assert.equal("companion" in tallBox, false);
});

test("Round4 防闪：最短驻留与眨眼武装区间", () => {
  assert.equal(canChangeAfterHold(0, XIAOMEI_MIN_HOLD_MS - 1), false);
  assert.equal(canChangeAfterHold(0, XIAOMEI_MIN_HOLD_MS), true);
  assert.equal(blinkArmDelayMs(0), XIAOMEI_BLINK_ARM_MS.min);
  assert.equal(blinkArmDelayMs(1), XIAOMEI_BLINK_ARM_MS.max);
  assert.ok(blinkArmDelayMs(0.5) > XIAOMEI_BLINK_ARM_MS.min);
  assert.ok(blinkArmDelayMs(0.5) < XIAOMEI_BLINK_ARM_MS.max);
});
