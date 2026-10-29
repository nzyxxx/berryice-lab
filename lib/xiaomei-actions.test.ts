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
const NO_REPEAT = [
  "blink",
  "yawn",
  "stretch",
  "note",
  "cheer",
  "sigh",
  "drink",
  "snack",
  "umbrella",
  "spin",
  "walk",
] as const;
const IDLE: readonly XiaomeiIdleBeat[] = [
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
];

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

test("待机下一拍：十秒里很忙，饿了点心更多，同一种动作不连播", () => {
  assert.equal(nextIdleBeat(0, null, false), "blink");
  assert.equal(nextIdleBeat(0.099, null, false), "blink");
  assert.equal(nextIdleBeat(0.1, null, false), "yawn");
  assert.equal(nextIdleBeat(0.18, null, false), "stretch");
  assert.equal(nextIdleBeat(0.26, null, false), "note");
  assert.equal(nextIdleBeat(0.33, null, false), "cheer");
  assert.equal(nextIdleBeat(0.4, null, false), "sigh");
  assert.equal(nextIdleBeat(0.46, null, false), "glance");
  assert.equal(nextIdleBeat(0.52, null, false), "smile");
  assert.equal(nextIdleBeat(0.579, null, false), "smile");
  assert.equal(nextIdleBeat(0.58, null, false), "drink");
  assert.equal(nextIdleBeat(0.67, null, false), "snack");
  assert.equal(nextIdleBeat(0.76, null, false), "umbrella");
  assert.equal(nextIdleBeat(0.84, null, false), "spin");
  assert.equal(nextIdleBeat(0.92, null, false), "walk");
  assert.equal(nextIdleBeat(1, null, false), "walk");
  assert.equal(nextIdleBeat(Number.NaN, null, false), "blink");

  assert.equal(nextIdleBeat(0, null, true), "blink");
  assert.equal(nextIdleBeat(0.08, null, true), "yawn");
  assert.equal(nextIdleBeat(0.44, null, true), "snack");
  assert.equal(nextIdleBeat(0.62, null, true), "drink");
  assert.equal(nextIdleBeat(0.9, null, true), "spin");
  assert.equal(nextIdleBeat(1, null, true), "spin");

  assert.equal(nextIdleBeat(0.5, null, false), "glance");
  assert.equal(nextIdleBeat(0.5, null, true), "snack");

  assert.equal(nextIdleBeat(0.05, "blink", false), "yawn");
  assert.equal(nextIdleBeat(0.62, "drink", false), "snack");
  assert.equal(nextIdleBeat(0.7, "snack", false), "umbrella");
  assert.equal(nextIdleBeat(0.8, "umbrella", false), "spin");
  assert.equal(nextIdleBeat(0.88, "spin", false), "walk");
  assert.equal(nextIdleBeat(0.95, "walk", false), "drink");
  assert.equal(nextIdleBeat(0.55, "smile", false), "smile");
  assert.equal(nextIdleBeat(0.5, "glance", false), "glance");

  let restQuiet = 0;
  let hungrySnacks = 0;
  for (let step = 0; step < 100; step += 1) {
    const roll = step / 100;
    const rest = nextIdleBeat(roll, null, false);
    const hungry = nextIdleBeat(roll, null, true);
    if (rest === "smile" || rest === "glance") restQuiet += 1;
    if (hungry === "snack") hungrySnacks += 1;
  }
  assert.equal(restQuiet, 12);
  assert.equal(hungrySnacks, 18);
  const beatsInTenSeconds = Math.floor(10_000 / XIAOMEI_IDLE_GAP_MS.max);
  assert.ok(beatsInTenSeconds >= 3);
  assert.ok((restQuiet / 100) ** beatsInTenSeconds < 0.1);

  for (const hungry of [false, true]) {
    for (const previous of [null, ...IDLE] as const) {
      for (let step = 0; step <= 20; step += 1) {
        const beat = nextIdleBeat(step / 20, previous, hungry);
        assert.ok(IDLE.includes(beat));
        if (previous && (NO_REPEAT as readonly XiaomeiIdleBeat[]).includes(previous)) {
          assert.notEqual(beat, previous);
        }
      }
    }
  }
});

test("表情轨迹两帧，待机不切难过，点击和投喂落到这句的脸", () => {
  for (const context of IDLE) {
    const trail = expressionTrail(context, "sad");
    assert.equal(trail.length, 2);
    assert.notEqual(trail[0], "sad");
    assert.notEqual(trail[1], "sad");
    assert.ok(XIAOMEI_MOODS.includes(trail[0]));
    assert.ok(XIAOMEI_MOODS.includes(trail[1]));
  }
  assert.deepEqual(expressionTrail("blink", "content"), ["blank", "content"]);
  assert.deepEqual(expressionTrail("yawn", "happy"), ["blank", "content"]);
  assert.deepEqual(expressionTrail("stretch", "blank"), ["content", "happy"]);
  assert.deepEqual(expressionTrail("note", "annoyed"), ["blank", "content"]);
  assert.deepEqual(expressionTrail("cheer", "sad"), ["content", "happy"]);
  assert.deepEqual(expressionTrail("sigh", "happy"), ["blank", "annoyed"]);
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
  assert.equal(xiaomeiMotionClass("blink", false), "xiaomei-blink");
  assert.equal(xiaomeiMotionClass("yawn", false), "xiaomei-yawn");
  assert.equal(xiaomeiMotionClass("stretch", false), "xiaomei-stretch");
  assert.equal(xiaomeiMotionClass("note", false), "xiaomei-note");
  assert.equal(xiaomeiMotionClass("cheer", false), "xiaomei-cheer");
  assert.equal(xiaomeiMotionClass("sigh", false), "xiaomei-sigh");
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
  assert.match(css, /\.xiaomei-blink\s*\{[^}]*animation:\s*xiaomei-blink 0\.9s/);
  assert.match(css, /\.xiaomei-yawn\s*\{[^}]*animation:\s*xiaomei-yawn 1\.7s/);
  assert.match(css, /\.xiaomei-stretch\s*\{[^}]*animation:\s*xiaomei-stretch 1\.8s/);
  assert.match(css, /\.xiaomei-note\s*\{[^}]*animation:\s*xiaomei-note 1\.5s/);
  assert.match(css, /\.xiaomei-cheer\s*\{[^}]*animation:\s*xiaomei-cheer 1\.4s/);
  assert.match(css, /\.xiaomei-sigh\s*\{[^}]*animation:\s*xiaomei-sigh 1\.6s/);
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
  assert.match(css, /scale\(1\.2\)/);
  assert.match(css, /translate3d\(-32px/);
  assert.match(css, /\.xiaomei-prop-cup\s*\{[^}]*width:\s*44px/);
  assert.match(css, /\.xiaomei-prop-snack\s*\{[^}]*width:\s*52px/);
  assert.match(css, /\.xiaomei-prop-umbrella\s*\{[^}]*width:\s*72px/);
  assert.equal(XIAOMEI_BEAT_MS.blink, 900);
  assert.equal(XIAOMEI_BEAT_MS.yawn, 1700);
  assert.equal(XIAOMEI_BEAT_MS.stretch, 1800);
  assert.equal(XIAOMEI_BEAT_MS.note, 1500);
  assert.equal(XIAOMEI_BEAT_MS.cheer, 1400);
  assert.equal(XIAOMEI_BEAT_MS.sigh, 1600);
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
