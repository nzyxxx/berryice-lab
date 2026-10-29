import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  XIAOMEI_BEAT_MS,
  XIAOMEI_IDLE_GAP_MS,
  XIAOMEI_TRAIL_MS,
  expressionTrail,
  idleGapMs,
  nextIdleBeat,
  resolveXiaomeiFace,
  xiaomeiMotionClass,
  xiaomeiPropKind,
  type XiaomeiIdleBeat,
} from "./xiaomei-actions.ts";
import { XIAOMEI_MOODS, type XiaomeiMood } from "./xiaomei-lines.ts";

const PROP_ACTIONS = ["drink", "snack", "umbrella"] as const;
const ACTION_BEATS = ["drink", "snack", "umbrella", "spin", "walk"] as const;
const IDLE: readonly XiaomeiIdleBeat[] = ["glance", "smile", "drink", "snack", "umbrella", "spin", "walk"];

test("短动作都是短拍，间隔比旧的九秒密，也不会两拍叠上", () => {
  for (const ms of Object.values(XIAOMEI_BEAT_MS)) {
    assert.ok(ms <= 2600);
    assert.ok(XIAOMEI_TRAIL_MS < ms);
  }
  const longest = Math.max(...Object.values(XIAOMEI_BEAT_MS));
  assert.ok(XIAOMEI_IDLE_GAP_MS.min > longest);
  assert.ok(XIAOMEI_IDLE_GAP_MS.min < 9000);
  assert.ok(XIAOMEI_IDLE_GAP_MS.max > XIAOMEI_IDLE_GAP_MS.min);
  assert.equal(idleGapMs(0), XIAOMEI_IDLE_GAP_MS.min);
  assert.equal(idleGapMs(1), XIAOMEI_IDLE_GAP_MS.max);
  assert.equal(idleGapMs(Number.NaN), XIAOMEI_IDLE_GAP_MS.min);
  assert.equal(idleGapMs(-4), XIAOMEI_IDLE_GAP_MS.min);
  const mid = idleGapMs(0.5);
  assert.ok(mid > XIAOMEI_IDLE_GAP_MS.min && mid < XIAOMEI_IDLE_GAP_MS.max);
});

test("待机下一拍：不饿多看表情，饿了点心变多，同一种动作不连播", () => {
  assert.equal(nextIdleBeat(0, null, false), "smile");
  assert.equal(nextIdleBeat(0.359, null, false), "smile");
  assert.equal(nextIdleBeat(0.36, null, false), "glance");
  assert.equal(nextIdleBeat(0.679, null, false), "glance");
  assert.equal(nextIdleBeat(0.68, null, false), "drink");
  assert.equal(nextIdleBeat(0.759, null, false), "drink");
  assert.equal(nextIdleBeat(0.76, null, false), "snack");
  assert.equal(nextIdleBeat(0.839, null, false), "snack");
  assert.equal(nextIdleBeat(0.84, null, false), "umbrella");
  assert.equal(nextIdleBeat(0.899, null, false), "umbrella");
  assert.equal(nextIdleBeat(0.9, null, false), "spin");
  assert.equal(nextIdleBeat(0.949, null, false), "spin");
  assert.equal(nextIdleBeat(0.95, null, false), "walk");
  assert.equal(nextIdleBeat(1, null, false), "walk");
  assert.equal(nextIdleBeat(Number.NaN, null, false), "smile");

  assert.equal(nextIdleBeat(0, null, true), "smile");
  assert.equal(nextIdleBeat(0.259, null, true), "smile");
  assert.equal(nextIdleBeat(0.26, null, true), "glance");
  assert.equal(nextIdleBeat(0.519, null, true), "glance");
  assert.equal(nextIdleBeat(0.52, null, true), "snack");
  assert.equal(nextIdleBeat(0.679, null, true), "snack");
  assert.equal(nextIdleBeat(0.68, null, true), "drink");
  assert.equal(nextIdleBeat(0.779, null, true), "drink");
  assert.equal(nextIdleBeat(0.78, null, true), "umbrella");
  assert.equal(nextIdleBeat(0.859, null, true), "umbrella");
  assert.equal(nextIdleBeat(0.86, null, true), "walk");
  assert.equal(nextIdleBeat(0.929, null, true), "walk");
  assert.equal(nextIdleBeat(0.93, null, true), "spin");
  assert.equal(nextIdleBeat(1, null, true), "spin");

  assert.equal(nextIdleBeat(0.6, null, false), "glance");
  assert.equal(nextIdleBeat(0.6, null, true), "snack");

  assert.equal(nextIdleBeat(0.7, "drink", false), "snack");
  assert.equal(nextIdleBeat(0.8, "snack", false), "umbrella");
  assert.equal(nextIdleBeat(0.86, "umbrella", false), "spin");
  assert.equal(nextIdleBeat(0.92, "spin", false), "walk");
  assert.equal(nextIdleBeat(0.97, "walk", false), "drink");
  assert.equal(nextIdleBeat(0.1, "smile", false), "smile");
  assert.equal(nextIdleBeat(0.5, "glance", false), "glance");

  let restFaces = 0;
  let hungryFaces = 0;
  for (let step = 0; step < 100; step += 1) {
    const roll = step / 100;
    const rest = nextIdleBeat(roll, null, false);
    const hungry = nextIdleBeat(roll, null, true);
    if (rest === "smile" || rest === "glance") restFaces += 1;
    if (hungry === "smile" || hungry === "glance") hungryFaces += 1;
  }
  assert.ok(restFaces >= 60);
  assert.ok(hungryFaces >= 50);

  for (const hungry of [false, true]) {
    for (const previous of [null, ...IDLE] as const) {
      for (let step = 0; step <= 20; step += 1) {
        const beat = nextIdleBeat(step / 20, previous, hungry);
        assert.ok(IDLE.includes(beat));
        if (previous && (ACTION_BEATS as readonly XiaomeiIdleBeat[]).includes(previous)) {
          assert.notEqual(beat, previous);
        }
      }
    }
  }
});

test("表情轨迹两帧，待机不切难过，点击和投喂落到这句的脸", () => {
  for (const context of ["glance", "smile", "drink", "snack", "umbrella", "spin", "walk"] as const) {
    const trail = expressionTrail(context, "sad");
    assert.equal(trail.length, 2);
    assert.notEqual(trail[0], "sad");
    assert.notEqual(trail[1], "sad");
    assert.ok(XIAOMEI_MOODS.includes(trail[0]));
    assert.ok(XIAOMEI_MOODS.includes(trail[1]));
  }
  assert.deepEqual(expressionTrail("glance", "content"), ["content", "blank"]);
  assert.deepEqual(expressionTrail("smile", "content"), ["blank", "happy"]);
  assert.deepEqual(expressionTrail("drink", "happy"), ["blank", "content"]);
  assert.deepEqual(expressionTrail("snack", "annoyed"), ["content", "happy"]);
  assert.deepEqual(expressionTrail("umbrella", "blank"), ["content", "happy"]);
  assert.deepEqual(expressionTrail("spin", "content"), ["blank", "happy"]);
  assert.deepEqual(expressionTrail("walk", "happy"), ["content", "blank"]);

  const settled: XiaomeiMood[] = ["happy", "content", "blank", "annoyed", "sad"];
  for (const mood of settled) {
    for (const context of ["click", "feed"] as const) {
      const trail = expressionTrail(context, mood);
      assert.equal(trail[1], mood);
      assert.notEqual(trail[0], trail[1]);
      assert.ok(XIAOMEI_MOODS.includes(trail[0]));
    }
  }
  assert.deepEqual(expressionTrail("feed", "annoyed"), ["blank", "annoyed"]);
  assert.deepEqual(expressionTrail("click", "happy"), ["content", "happy"]);
});

test("动作类名和道具：拖拽时身体不动，发呆不端杯子", () => {
  assert.equal(xiaomeiMotionClass(null, false), "xiaomei-float");
  assert.equal(xiaomeiMotionClass("smile", false), "xiaomei-float");
  assert.equal(xiaomeiMotionClass("glance", false), "xiaomei-glance");
  assert.equal(xiaomeiMotionClass("drink", false), "xiaomei-drink");
  assert.equal(xiaomeiMotionClass("snack", false), "xiaomei-snack");
  assert.equal(xiaomeiMotionClass("umbrella", false), "xiaomei-umbrella");
  assert.equal(xiaomeiMotionClass("spin", false), "xiaomei-spin");
  assert.equal(xiaomeiMotionClass("walk", false), "xiaomei-walk");
  assert.equal(xiaomeiMotionClass("walk", true), null);
  assert.equal(xiaomeiPropKind(null), null);
  assert.equal(xiaomeiPropKind("glance"), null);
  assert.equal(xiaomeiPropKind("smile"), null);
  assert.equal(xiaomeiPropKind("spin"), null);
  assert.equal(xiaomeiPropKind("walk"), null);
  assert.equal(xiaomeiPropKind("drink"), "cup");
  assert.equal(xiaomeiPropKind("snack"), "snack");
  assert.equal(xiaomeiPropKind("umbrella"), "umbrella");
  for (const action of PROP_ACTIONS) {
    assert.ok(xiaomeiPropKind(action));
  }
});

test("脸的优先级：聊天盖过引子，引子盖过台词，待机拍盖过悬浮", () => {
  const base = {
    chatOpen: false,
    status: "idle" as const,
    replyMood: "happy" as const,
    speechMood: null,
    moodPin: null,
    leadMood: null,
    beatMood: null,
    hover: false,
  };
  assert.equal(resolveXiaomeiFace(base), "content");
  assert.equal(resolveXiaomeiFace({ ...base, hover: true }), "annoyed");
  assert.equal(resolveXiaomeiFace({ ...base, hover: true, beatMood: "blank" }), "blank");
  assert.equal(resolveXiaomeiFace({ ...base, beatMood: "happy", moodPin: "sad" }), "sad");
  assert.equal(resolveXiaomeiFace({ ...base, moodPin: "sad", speechMood: "content" }), "content");
  assert.equal(resolveXiaomeiFace({ ...base, speechMood: "happy", leadMood: "content" }), "content");
  assert.equal(resolveXiaomeiFace({ ...base, chatOpen: true, leadMood: "happy", speechMood: "annoyed" }), "content");
  assert.equal(
    resolveXiaomeiFace({ ...base, chatOpen: true, status: "thinking", leadMood: "happy" }),
    "blank",
  );
  assert.equal(
    resolveXiaomeiFace({ ...base, chatOpen: true, status: "error", replyMood: "annoyed" }),
    "annoyed",
  );
  assert.equal(
    resolveXiaomeiFace({ ...base, chatOpen: true, status: "done", replyMood: "happy" }),
    "happy",
  );
  assert.equal(
    resolveXiaomeiFace({ ...base, chatOpen: true, status: "done", replyMood: "annoyed" }),
    "content",
  );
});

test("短动作的 CSS 时长跟拍长一致，并且不走逐帧循环", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.xiaomei-drink\s*\{[^}]*animation:\s*xiaomei-drink 2\.3s/);
  assert.match(css, /\.xiaomei-snack\s*\{[^}]*animation:\s*xiaomei-snack 2\.1s/);
  assert.match(css, /\.xiaomei-umbrella\s*\{[^}]*animation:\s*xiaomei-umbrella 2\.2s/);
  assert.match(css, /\.xiaomei-spin\s*\{[^}]*animation:\s*xiaomei-spin 2s/);
  assert.match(css, /\.xiaomei-walk\s*\{[^}]*animation:\s*xiaomei-walk 2\.4s/);
  assert.match(css, /\.xiaomei-ground\s*\{[^}]*animation:\s*xiaomei-ground 3\.8s/);
  assert.match(css, /@keyframes xiaomei-cup/);
  assert.match(css, /@keyframes xiaomei-snack-prop/);
  assert.match(css, /@keyframes xiaomei-umbrella-prop/);
  assert.match(css, /scaleX\(-1\)/);
  assert.equal(XIAOMEI_BEAT_MS.drink, 2300);
  assert.equal(XIAOMEI_BEAT_MS.snack, 2100);
  assert.equal(XIAOMEI_BEAT_MS.umbrella, 2200);
  assert.equal(XIAOMEI_BEAT_MS.spin, 2000);
  assert.equal(XIAOMEI_BEAT_MS.walk, 2400);
  assert.doesNotMatch(css, /requestAnimationFrame/);
  const presence = await readFile(
    new URL("../components/xiaomei/use-xiaomei-presence.ts", import.meta.url),
    "utf8",
  );
  assert.match(presence, /expressionTrail/);
  assert.match(presence, /nextIdleBeat/);
  assert.doesNotMatch(presence, /requestAnimationFrame|speechSynthesis|DEEPSEEK|API_KEY/);
  assert.doesNotMatch(presence, /鲸鱼|大肥鱼|猫耳|狐耳/);
});
