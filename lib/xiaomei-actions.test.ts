import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  XIAOMEI_BEAT_MS,
  XIAOMEI_BLINK_CYCLE_MS,
  XIAOMEI_DRINK_HOLD_MS,
  XIAOMEI_GREET_MS,
  XIAOMEI_GREET_WAVE_MS,
  XIAOMEI_IDLE_GAP_MS,
  XIAOMEI_SNACK_HOLD_MS,
  XIAOMEI_SPIN_AT_MS,
  XIAOMEI_TRAIL_MS,
  XIAOMEI_WALK_AT_MS,
  XIAOMEI_WALK_STEP_MS,
  blinkFaceAt,
  drinkFaceAt,
  expressionTrail,
  greetFaceAt,
  snackFaceAt,
  spinFaceAt,
  umbrellaFaceAt,
  walkFaceAt,
  idleGapMs,
  nextIdleBeat,
  resolveXiaomeiFace,
  xiaomeiMotionClass,
  xiaomeiPropKind,
  type XiaomeiIdleBeat,
} from "./xiaomei-actions.ts";
import {
  XIAOMEI_A1_FACES,
  XIAOMEI_ACTIVITY_POSES,
  XIAOMEI_CROSSFADE_MS,
  XIAOMEI_ITEM_POSES,
  XIAOMEI_SNACK_SRC,
  XIAOMEI_STAND_POSES,
  XIAOMEI_UMBRELLA_SRC,
  isXiaomeiLayeredBlinkFace,
  xiaomeiBlinkFaceLayer,
  xiaomeiBodyNeutralSrc,
  xiaomeiFaceLayerSrc,
  xiaomeiFaceSrc,
  xiaomeiIdleVolumeSrc,
  type XiaomeiFace,
} from "./xiaomei-faces.ts";
import { XIAOMEI_MOODS, XIAOMEI_SPRITE_VERSION, type XiaomeiMood } from "./xiaomei-lines.ts";

const HELD_POSES = ["snack", "umbrella", "drink", "sip", "hold"] as const;

function isFace(value: string): value is XiaomeiFace {
  return (
    (XIAOMEI_MOODS as readonly string[]).includes(value) ||
    (XIAOMEI_A1_FACES as readonly string[]).includes(value)
  );
}
const NO_REPEAT = [
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
const IDLE: readonly XiaomeiIdleBeat[] = [
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
  assert.ok(IDLE.length >= 24);
  assert.equal(nextIdleBeat(0, null, false), "blink");
  assert.equal(nextIdleBeat(0.05, null, false), "blink2");
  assert.equal(nextIdleBeat(0.09, null, false), "slowblink");
  assert.equal(nextIdleBeat(0.14, null, false), "yawn");
  assert.equal(nextIdleBeat(0.19, null, false), "stretch");
  assert.equal(nextIdleBeat(0.24, null, false), "peek");
  assert.equal(nextIdleBeat(0.29, null, false), "glance");
  assert.equal(nextIdleBeat(0.34, null, false), "nod");
  assert.equal(nextIdleBeat(0.39, null, false), "tilt");
  assert.equal(nextIdleBeat(0.45, null, false), "smile");
  assert.equal(nextIdleBeat(0.51, null, false), "pout");
  assert.equal(nextIdleBeat(0.56, null, false), "sigh");
  assert.equal(nextIdleBeat(0.66, null, false), "hum");
  assert.equal(nextIdleBeat(0.71, null, false), "sip");
  assert.equal(nextIdleBeat(0.77, null, false), "hold");
  assert.equal(nextIdleBeat(0.82, null, false), "wipe");
  assert.equal(nextIdleBeat(0.86, null, false), "snack");
  assert.equal(nextIdleBeat(0.9, null, false), "sway");
  assert.equal(nextIdleBeat(0.93, null, false), "umbrella");
  assert.equal(nextIdleBeat(0.96, null, false), "walk");
  assert.equal(nextIdleBeat(1, null, false), "walk");
  assert.equal(nextIdleBeat(Number.NaN, null, false), "blink");

  assert.equal(nextIdleBeat(0, null, true), "blink");
  assert.equal(nextIdleBeat(0.08, null, true), "yawn");
  assert.equal(nextIdleBeat(0.3, null, true), "snack");
  assert.equal(nextIdleBeat(0.58, null, true), "drink");
  assert.equal(nextIdleBeat(0.84, null, true), "umbrella");
  assert.equal(nextIdleBeat(1, null, true), "spin");

  assert.equal(nextIdleBeat(0.48, null, false), "smile");
  assert.equal(nextIdleBeat(0.4, null, true), "snack");

  assert.equal(nextIdleBeat(0.01, "blink", false), "blink2");
  assert.equal(nextIdleBeat(0.74, "drink", false), "sip");
  assert.equal(nextIdleBeat(0.87, "snack", false), "hum");
  assert.equal(nextIdleBeat(0.91, "umbrella", false), "sway");
  assert.equal(nextIdleBeat(0.94, "spin", false), "umbrella");
  assert.equal(nextIdleBeat(0.97, "walk", false), "drink");
  assert.equal(nextIdleBeat(0.48, "smile", false), "smile");
  assert.equal(nextIdleBeat(0.3, "glance", false), "glance");

  let restQuiet = 0;
  let hungrySnacks = 0;
  for (let step = 0; step < 100; step += 1) {
    const roll = step / 100;
    const rest = nextIdleBeat(roll, null, false);
    const hungry = nextIdleBeat(roll, null, true);
    if (rest === "smile" || rest === "glance") restQuiet += 1;
    if (hungry === "snack") hungrySnacks += 1;
  }
  assert.equal(restQuiet, 11);
  assert.equal(hungrySnacks, 20);
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
    assert.notEqual(trail[0], "mood_cry");
    assert.notEqual(trail[1], "mood_cry");
    assert.ok(isFace(trail[0]));
    assert.ok(isFace(trail[1]));
  }
  assert.deepEqual(expressionTrail("blink", "content"), ["blink_open", "blink_half"]);
  assert.deepEqual(expressionTrail("blink2", "content"), ["blink_open", "blink_half"]);
  assert.deepEqual(expressionTrail("slowblink", "content"), ["blink_open", "blink_half"]);
  assert.deepEqual(expressionTrail("peek", "happy"), ["pose_peek", "pose_peek"]);
  assert.deepEqual(expressionTrail("nod", "blank"), ["pose_bow", "pose_clasp"]);
  assert.deepEqual(expressionTrail("tilt", "happy"), ["pose_tilt_l", "pose_tilt_r"]);
  assert.deepEqual(expressionTrail("pout", "happy"), ["mood_puff", "annoyed"]);
  assert.deepEqual(expressionTrail("sip", "happy"), ["pose_drink_hold", "pose_drink_sip"]);
  assert.deepEqual(expressionTrail("hold", "annoyed"), ["pose_drink_hold", "content"]);
  assert.deepEqual(expressionTrail("wipe", "happy"), ["mood_puff", "content"]);
  assert.deepEqual(expressionTrail("hum", "blank"), ["mood_soft", "happy"]);
  assert.deepEqual(expressionTrail("sway", "content"), ["mood_cool", "happy"]);
  assert.deepEqual(expressionTrail("yawn", "happy"), ["pose_yawn", "pose_yawn"]);
  assert.deepEqual(expressionTrail("stretch", "blank"), ["pose_stretch", "pose_stretch"]);
  assert.deepEqual(expressionTrail("note", "annoyed"), ["mood_thinking", "blank"]);
  assert.deepEqual(expressionTrail("cheer", "sad"), ["mood_love", "mood_eager"]);
  assert.deepEqual(expressionTrail("sigh", "happy"), ["mood_sleepy", "mood_soft"]);
  assert.deepEqual(expressionTrail("glance", "content"), ["mood_cool", "mood_thinking"]);
  assert.deepEqual(expressionTrail("smile", "content"), ["pose_cheek", "pose_peace"]);
  assert.deepEqual(expressionTrail("drink", "happy"), ["pose_drink_hold", "pose_drink_sip"]);
  assert.deepEqual(expressionTrail("snack", "annoyed"), ["pose_snack_hold", "pose_snack_bite"]);
  assert.deepEqual(expressionTrail("umbrella", "blank"), ["pose_umbrella_hold", "pose_umbrella_hold"]);
  assert.deepEqual(expressionTrail("spin", "content"), ["pose_spin_1", "pose_spin_2"]);
  assert.deepEqual(expressionTrail("walk", "happy"), ["pose_walk_l_1", "pose_walk_r_1"]);

  const settled: XiaomeiMood[] = ["happy", "content", "blank", "annoyed", "sad"];
  for (const mood of settled) {
    for (const context of ["click", "feed", "pet", "mutter"] as const) {
      const trail = expressionTrail(context, mood);
      assert.equal(trail[1], mood);
      assert.notEqual(trail[0], trail[1]);
      assert.ok(isFace(trail[0]));
    }
  }
  assert.deepEqual(expressionTrail("feed", "annoyed"), ["mood_puff", "annoyed"]);
  assert.deepEqual(expressionTrail("feed", "happy"), ["mood_eager", "happy"]);
  assert.deepEqual(expressionTrail("feed", "content"), ["mood_soft", "content"]);
  assert.deepEqual(expressionTrail("click", "happy"), ["mood_wink", "happy"]);
  assert.deepEqual(expressionTrail("click", "content"), ["pose_heart", "content"]);
  assert.deepEqual(expressionTrail("click", "blank"), ["pose_point", "blank"]);
  assert.deepEqual(expressionTrail("click", "sad"), ["mood_cry", "sad"]);
  assert.deepEqual(expressionTrail("pet", "happy"), ["mood_love", "happy"]);
  assert.deepEqual(expressionTrail("mutter", "happy"), ["mood_smug", "happy"]);
  assert.deepEqual(expressionTrail("feed", "blank"), ["mood_surprised", "blank"]);

  const seen = new Set<string>();
  for (const context of IDLE) {
    for (const face of expressionTrail(context, "content")) seen.add(face);
  }
  for (const mood of settled) {
    for (const context of ["click", "feed", "pet", "mutter"] as const) {
      seen.add(expressionTrail(context, mood)[0]);
    }
  }
  for (const face of XIAOMEI_A1_FACES) {
    if (face.startsWith("blink_") || face.startsWith("pose_")) continue;
    assert.ok(seen.has(face), face);
  }
  const posed = new Set<string | null>([
    ...IDLE.flatMap((beat) => expressionTrail(beat, "content")),
    ...(["click", "feed", "pet", "mutter"] as const).flatMap((context) =>
      settled.map((mood) => expressionTrail(context, mood)[0]),
    ),
    greetFaceAt(0),
    greetFaceAt(XIAOMEI_GREET_WAVE_MS),
    ...XIAOMEI_SPIN_AT_MS.map((at) => spinFaceAt(at)),
    ...XIAOMEI_WALK_AT_MS.map((at) => walkFaceAt(at)),
    snackFaceAt(0),
    snackFaceAt(XIAOMEI_SNACK_HOLD_MS),
    umbrellaFaceAt(0),
  ]);
  for (const pose of [...XIAOMEI_STAND_POSES, ...XIAOMEI_ACTIVITY_POSES, ...XIAOMEI_ITEM_POSES]) {
    assert.ok(posed.has(pose), pose);
  }
});

test("眨眼四帧短于半秒，喝水先端后抿再回到空", () => {
  assert.ok(XIAOMEI_BLINK_CYCLE_MS >= 250);
  assert.ok(XIAOMEI_BLINK_CYCLE_MS <= 450);
  assert.equal(blinkFaceAt(0), "blink_open");
  assert.equal(blinkFaceAt(90), "blink_half");
  assert.equal(blinkFaceAt(160), "blink_closed");
  assert.equal(blinkFaceAt(270), "blink_half");
  assert.equal(blinkFaceAt(XIAOMEI_BLINK_CYCLE_MS), null);
  assert.equal(blinkFaceAt(Number.NaN), null);
  assert.equal(drinkFaceAt(0), "pose_drink_hold");
  assert.equal(drinkFaceAt(XIAOMEI_DRINK_HOLD_MS - 1), "pose_drink_hold");
  assert.equal(drinkFaceAt(XIAOMEI_DRINK_HOLD_MS), "pose_drink_sip");
  assert.equal(drinkFaceAt(XIAOMEI_BEAT_MS.drink - 1), "pose_drink_sip");
  assert.equal(drinkFaceAt(XIAOMEI_BEAT_MS.drink), null);
  assert.ok(XIAOMEI_DRINK_HOLD_MS < XIAOMEI_BEAT_MS.drink);
  assert.ok(XIAOMEI_GREET_WAVE_MS < XIAOMEI_GREET_MS);
  assert.ok(XIAOMEI_GREET_MS < 4800);
  assert.equal(greetFaceAt(0), "pose_wave");
  assert.equal(greetFaceAt(XIAOMEI_GREET_WAVE_MS - 1), "pose_wave");
  assert.equal(greetFaceAt(XIAOMEI_GREET_WAVE_MS), "pose_bow");
  assert.equal(greetFaceAt(XIAOMEI_GREET_MS - 1), "pose_bow");
  assert.equal(greetFaceAt(XIAOMEI_GREET_MS), null);
  assert.equal(greetFaceAt(Number.NaN), "pose_wave");
  assert.equal(spinFaceAt(0), "pose_spin_1");
  assert.equal(spinFaceAt(XIAOMEI_SPIN_AT_MS[1] - 1), "pose_spin_1");
  assert.equal(spinFaceAt(XIAOMEI_SPIN_AT_MS[1]), "pose_spin_2");
  assert.equal(spinFaceAt(XIAOMEI_SPIN_AT_MS[2] - 1), "pose_spin_2");
  assert.equal(spinFaceAt(XIAOMEI_SPIN_AT_MS[2]), "pose_spin_3");
  assert.equal(spinFaceAt(XIAOMEI_BEAT_MS.spin - 1), "pose_spin_3");
  assert.equal(spinFaceAt(XIAOMEI_BEAT_MS.spin), null);
  assert.equal(walkFaceAt(0), "pose_walk_l_1");
  assert.equal(walkFaceAt(XIAOMEI_WALK_STEP_MS), "pose_walk_l_2");
  assert.equal(walkFaceAt(XIAOMEI_BEAT_MS.walk / 2), "pose_walk_r_1");
  assert.equal(walkFaceAt(XIAOMEI_BEAT_MS.walk / 2 + XIAOMEI_WALK_STEP_MS), "pose_walk_r_2");
  assert.equal(walkFaceAt(XIAOMEI_BEAT_MS.walk), null);
  assert.equal(walkFaceAt(Number.NaN), "pose_walk_l_1");
  assert.notEqual(walkFaceAt(0), walkFaceAt(XIAOMEI_BEAT_MS.walk / 2));
  assert.ok(XIAOMEI_SNACK_HOLD_MS < XIAOMEI_BEAT_MS.snack);
  assert.equal(snackFaceAt(0), "pose_snack_hold");
  assert.equal(snackFaceAt(XIAOMEI_SNACK_HOLD_MS - 1), "pose_snack_hold");
  assert.equal(snackFaceAt(XIAOMEI_SNACK_HOLD_MS), "pose_snack_bite");
  assert.equal(snackFaceAt(XIAOMEI_BEAT_MS.snack - 1), "pose_snack_bite");
  assert.equal(snackFaceAt(XIAOMEI_BEAT_MS.snack), null);
  assert.equal(umbrellaFaceAt(0), "pose_umbrella_hold");
  assert.equal(umbrellaFaceAt(XIAOMEI_BEAT_MS.umbrella - 1), "pose_umbrella_hold");
  assert.equal(umbrellaFaceAt(XIAOMEI_BEAT_MS.umbrella), null);
  assert.match(XIAOMEI_SNACK_SRC, /prop_snack\.png\?v=7/);
  assert.match(XIAOMEI_UMBRELLA_SRC, /prop_umbrella\.png\?v=7/);
});

test("动作类名和道具：拖拽时身体不动，发呆不端杯子", () => {
  assert.equal(xiaomeiMotionClass(null, false), "xiaomei-float");
  assert.equal(xiaomeiMotionClass("smile", false), "xiaomei-float");
  assert.equal(xiaomeiMotionClass("blink", false), "xiaomei-float");
  assert.equal(xiaomeiMotionClass("blink2", false), "xiaomei-float");
  assert.equal(xiaomeiMotionClass("slowblink", false), "xiaomei-float");
  assert.equal(xiaomeiMotionClass("peek", false), "xiaomei-float");
  assert.equal(xiaomeiMotionClass("tilt", false), "xiaomei-float");
  assert.equal(xiaomeiMotionClass("nod", false), "xiaomei-nod");
  assert.equal(xiaomeiMotionClass("sip", false), "xiaomei-activity-soft");
  assert.equal(xiaomeiMotionClass("hold", false), "xiaomei-activity-soft");
  assert.equal(xiaomeiMotionClass("wipe", false), "xiaomei-wipe");
  assert.equal(xiaomeiMotionClass("hum", false), "xiaomei-hum");
  assert.equal(xiaomeiMotionClass("sway", false), "xiaomei-sway");
  assert.equal(xiaomeiMotionClass("yawn", false), "xiaomei-float");
  assert.equal(xiaomeiMotionClass("stretch", false), "xiaomei-float");
  assert.equal(xiaomeiMotionClass("note", false), "xiaomei-note");
  assert.equal(xiaomeiMotionClass("cheer", false), "xiaomei-cheer");
  assert.equal(xiaomeiMotionClass("sigh", false), "xiaomei-sigh");
  assert.equal(xiaomeiMotionClass("glance", false), "xiaomei-glance");
  assert.equal(xiaomeiMotionClass("drink", false), "xiaomei-activity-soft");
  assert.equal(xiaomeiMotionClass("snack", false), "xiaomei-activity-soft");
  assert.equal(xiaomeiMotionClass("umbrella", false), "xiaomei-activity-soft");
  assert.equal(xiaomeiMotionClass("spin", false), "xiaomei-activity-soft");
  assert.equal(xiaomeiMotionClass("walk", false), "xiaomei-walk");
  assert.equal(xiaomeiMotionClass("walk", true), null);
  assert.equal(xiaomeiPropKind(null), null);
  assert.equal(xiaomeiPropKind("glance"), null);
  assert.equal(xiaomeiPropKind("smile"), null);
  assert.equal(xiaomeiPropKind("spin"), null);
  assert.equal(xiaomeiPropKind("walk"), null);
  assert.equal(xiaomeiPropKind("drink"), null);
  assert.equal(xiaomeiPropKind("sip"), null);
  assert.equal(xiaomeiPropKind("hold"), null);
  assert.equal(xiaomeiPropKind("wipe"), null);
  assert.equal(xiaomeiPropKind("snack"), null);
  assert.equal(xiaomeiPropKind("umbrella"), null);
  for (const action of HELD_POSES) {
    assert.equal(xiaomeiPropKind(action), null);
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
  assert.equal(resolveXiaomeiFace(base), "blink_open");
  assert.equal(resolveXiaomeiFace({ ...base, hover: true }), "annoyed");
  assert.equal(resolveXiaomeiFace({ ...base, hover: true, beatMood: "blank" }), "blank");
  assert.equal(resolveXiaomeiFace({ ...base, beatMood: "happy", moodPin: "sad" }), "sad");
  assert.equal(resolveXiaomeiFace({ ...base, moodPin: "sad", speechMood: "content" }), "content");
  assert.equal(resolveXiaomeiFace({ ...base, speechMood: "happy", leadMood: "content" }), "content");
  assert.equal(resolveXiaomeiFace({ ...base, chatOpen: true, leadMood: "happy", speechMood: "annoyed" }), "content");
  assert.equal(
    resolveXiaomeiFace({ ...base, chatOpen: true, status: "thinking", leadMood: "happy" }),
    "mood_thinking",
  );
  assert.equal(
    resolveXiaomeiFace({ ...base, chatOpen: true, status: "error", replyMood: "annoyed" }),
    "mood_puff",
  );
  assert.equal(
    resolveXiaomeiFace({ ...base, chatOpen: true, status: "done", replyMood: "happy" }),
    "mood_eager",
  );
  assert.equal(
    resolveXiaomeiFace({ ...base, chatOpen: true, status: "done", replyMood: "annoyed" }),
    "mood_cool",
  );
  assert.equal(
    resolveXiaomeiFace({ ...base, speechMood: "happy", poseFace: "pose_drink_sip" }),
    "pose_drink_sip",
  );
  assert.equal(
    resolveXiaomeiFace({ ...base, poseFace: "pose_drink_hold", blinkFace: "blink_half" }),
    "pose_drink_hold",
  );
  assert.equal(resolveXiaomeiFace({ ...base, blinkFace: "blink_closed" }), "blink_closed");
  assert.equal(
    resolveXiaomeiFace({ ...base, speechMood: "happy", blinkFace: "blink_half" }),
    "happy",
  );
  assert.equal(
    resolveXiaomeiFace({ ...base, beatMood: "mood_sleepy", blinkFace: "blink_half" }),
    "mood_sleepy",
  );
  assert.equal(
    resolveXiaomeiFace({ ...base, chatOpen: true, status: "thinking", blinkFace: "blink_half" }),
    "mood_thinking",
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
  assert.match(css, /\.xiaomei-float\s*\{[^}]*animation:\s*xiaomei-float 4\.6s/);
  assert.match(css, /\.xiaomei-ground\s*\{[^}]*animation:\s*xiaomei-ground 4\.6s/);
  assert.doesNotMatch(css, /rgba\(198,\s*214,\s*255/);
  assert.match(css, /\.xiaomei-prop-umbrella\s*\{[^}]*display:\s*none/);
  assert.match(css, /\.xiaomei-cue-note\s*\{[^}]*display:\s*none/);
  assert.match(css, /\.xiaomei-pose-raise \.xiaomei-prop-object/);
  assert.match(css, /\.xiaomei-sip\s*\{[^}]*animation:\s*xiaomei-sip 1\.6s/);
  assert.match(css, /\.xiaomei-hold\s*\{[^}]*animation:\s*xiaomei-hold 2s/);
  assert.match(css, /\.xiaomei-blink2\s*\{[^}]*animation:\s*xiaomei-blink2 1\.1s/);
  assert.match(css, /\.xiaomei-hum\s*\{[^}]*animation:\s*xiaomei-hum 1\.8s/);
  assert.match(css, /\.xiaomei-sway\s*\{[^}]*animation:\s*xiaomei-sway 2\.2s/);
  assert.match(css, /\.xiaomei-cue-hum\s*\{[^}]*animation:\s*xiaomei-hum-mark 1\.8s/);
  const humMark = css.match(/@keyframes xiaomei-hum-mark\s*\{([^}]*)\}/);
  assert.ok(humMark);
  assert.doesNotMatch(humMark[1], /scale\(/);
  assert.match(css, /@keyframes xiaomei-cup/);
  assert.match(css, /@keyframes xiaomei-snack-prop/);
  assert.match(css, /@keyframes xiaomei-umbrella-prop/);
  assert.match(css, /scaleX\(-1\)/);
  assert.match(css, /scale\(1\.2\)/);
  assert.match(css, /scale\(1\.02, 0\.96\)/);
  assert.match(css, /\.xiaomei-activity-soft\s*\{[^}]*animation:\s*xiaomei-activity-soft/);
  assert.match(css, /xiaomei-crossfade-in 90ms/);
  assert.match(css, /\.xiaomei-ground-walk\s*\{[^}]*animation:\s*xiaomei-ground-walk 2\.4s/);
  assert.match(css, /\.xiaomei-prop-cup\s*\{[^}]*width:\s*22px/);
  assert.match(css, /\.xiaomei-prop-snack\s*\{[^}]*width:\s*22px/);
  assert.match(css, /\.xiaomei-prop-umbrella\s*\{[^}]*width:\s*20px/);
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
  assert.match(presence, /playGreet/);
  assert.match(presence, /pose_wave/);
  assert.match(presence, /XIAOMEI_GREET_WAVE_MS/);
  assert.match(presence, /spinFaceAt/);
  assert.match(presence, /walkFaceAt/);
  assert.match(presence, /snackFaceAt/);
  assert.match(presence, /umbrellaFaceAt/);
  assert.equal(XIAOMEI_SPRITE_VERSION, 7);
  for (const pose of [...XIAOMEI_STAND_POSES, ...XIAOMEI_ACTIVITY_POSES, ...XIAOMEI_ITEM_POSES]) {
    assert.equal(xiaomeiFaceSrc(pose), `/xiaomei/${pose}.webp?v=${XIAOMEI_SPRITE_VERSION}`);
  }
  assert.doesNotMatch(presence, /requestAnimationFrame|speechSynthesis|DEEPSEEK|API_KEY/);
  assert.doesNotMatch(presence, /鲸鱼|大肥鱼|猫耳|狐耳/);
});

test("发量分层待机：眨眼映射脸层，交叉淡入 90ms，资源带缓存版本", () => {
  assert.equal(XIAOMEI_CROSSFADE_MS, 90);
  assert.equal(isXiaomeiLayeredBlinkFace("blink_open"), true);
  assert.equal(isXiaomeiLayeredBlinkFace("pose_wave"), false);
  assert.equal(xiaomeiBlinkFaceLayer("blink_open"), "face_open");
  assert.equal(xiaomeiBlinkFaceLayer("blink_half"), "face_half");
  assert.equal(xiaomeiBlinkFaceLayer("blink_closed"), "face_closed");
  assert.equal(xiaomeiBodyNeutralSrc(), `/xiaomei/body_neutral.webp?v=${XIAOMEI_SPRITE_VERSION}`);
  assert.equal(xiaomeiFaceLayerSrc("face_open"), `/xiaomei/face_open.webp?v=${XIAOMEI_SPRITE_VERSION}`);
  assert.equal(xiaomeiIdleVolumeSrc(), `/xiaomei/static_idle_volume.webp?v=${XIAOMEI_SPRITE_VERSION}`);
});
