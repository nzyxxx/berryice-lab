import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  XIAOMEI_CHATTER_BUCKETS,
  XIAOMEI_CHATTER_GAP_MS,
  canChatter,
  chatterGapMs,
  chatterLines,
  nextAmbientChatter,
  pageKindFromPath,
  pickChatterLine,
  resolveChatterBucket,
} from "./xiaomei-chatter.ts";
import {
  XIAOMEI_MUTTER_LINES,
  XIAOMEI_PAGE_KINDS,
  XIAOMEI_PAGE_MUTTER_LINES,
  XIAOMEI_PET_LINES,
  XIAOMEI_REAWAKE_LINES,
  XIAOMEI_SCENE_LINES,
  XIAOMEI_SPRITE_VERSION,
  hanCount,
} from "./xiaomei-lines.ts";

const CROSSED = [
  "别出声嘛。我在想事情。",
  "别突然出声啦。我在想。",
  "下一句我想想。才不是词穷。",
  "别问我在想什么。",
  "哼，工作去啦，别盯着人家看。",
] as const;

function textsOf(lines: readonly { text: string }[] | readonly string[]): string[] {
  return lines.map((line) => (typeof line === "string" ? line : line.text));
}

test("碎碎念按状态分桶，句子不跨桶", () => {
  assert.deepEqual(XIAOMEI_CHATTER_BUCKETS, ["idle", "thinking", "page", "reawaken", "touch"]);
  assert.equal(chatterLines({ bucket: "thinking" }).length, 0);
  assert.equal(chatterLines({ bucket: "idle" }), XIAOMEI_MUTTER_LINES);
  assert.equal(chatterLines({ bucket: "reawaken" }), XIAOMEI_REAWAKE_LINES);
  assert.equal(chatterLines({ bucket: "touch" }), XIAOMEI_PET_LINES);
  assert.equal(pickChatterLine({ bucket: "thinking" }), null);
  assert.equal(pickChatterLine(null), null);

  const groups: Record<string, string[]> = {
    idle: textsOf(XIAOMEI_MUTTER_LINES),
    reawaken: textsOf(XIAOMEI_REAWAKE_LINES),
    touch: textsOf(XIAOMEI_PET_LINES),
    sceneThinking: textsOf(XIAOMEI_SCENE_LINES.thinking),
    sceneDone: textsOf(XIAOMEI_SCENE_LINES.done),
    sceneError: textsOf(XIAOMEI_SCENE_LINES.error),
  };
  for (const kind of XIAOMEI_PAGE_KINDS) {
    groups[`page:${kind}`] = textsOf(XIAOMEI_PAGE_MUTTER_LINES[kind]);
    assert.ok(groups[`page:${kind}`].length >= 4, kind);
    assert.equal(chatterLines({ bucket: "page", page: kind }), XIAOMEI_PAGE_MUTTER_LINES[kind]);
  }
  assert.ok(groups.reawaken.length >= 4);
  assert.ok(groups.idle.length >= 8);

  const names = Object.keys(groups);
  for (let i = 0; i < names.length; i += 1) {
    for (let j = i + 1; j < names.length; j += 1) {
      const left = new Set(groups[names[i]]);
      const shared = groups[names[j]].filter((line) => left.has(line));
      assert.deepEqual(shared, [], `${names[i]} ∩ ${names[j]}`);
    }
  }

  const all = Object.values(groups).flat();
  for (const line of all) {
    assert.ok(hanCount(line) > 0 && hanCount(line) <= 24, line);
    assert.doesNotMatch(line, /蓝莓|鲸鱼|大肥鱼|二维码|主人/);
  }
  for (const crossed of CROSSED) {
    assert.equal(all.includes(crossed), false, crossed);
  }
  assert.equal(XIAOMEI_SPRITE_VERSION, 7);
});

test("盯页只认现成路径，首页和预览仍是发呆", () => {
  assert.equal(pageKindFromPath("/"), null);
  assert.equal(pageKindFromPath(""), null);
  assert.equal(pageKindFromPath(null), null);
  assert.equal(pageKindFromPath("/preview/a"), null);
  assert.equal(pageKindFromPath("/admin/xiaomei"), null);
  assert.equal(pageKindFromPath("/wiki"), "wiki");
  assert.equal(pageKindFromPath("/wiki/"), "wiki");
  assert.equal(pageKindFromPath("/wiki/fleet"), "wiki");
  assert.equal(pageKindFromPath("/writing"), "writing");
  assert.equal(pageKindFromPath("/delta-gun/guns/m4"), "guns");
  assert.equal(pageKindFromPath("/about"), "about");
  assert.equal(pageKindFromPath("/somewhere"), null);
});

test("选桶：思考压过摸头和回神，睡着不说话", () => {
  assert.deepEqual(resolveChatterBucket({ status: "thinking", pathname: "/wiki", reawaken: true, touch: true }), {
    bucket: "thinking",
  });
  assert.deepEqual(resolveChatterBucket({ status: "thinking", sleeping: true, pathname: "/" }), {
    bucket: "thinking",
  });
  assert.equal(resolveChatterBucket({ status: "idle", sleeping: true, reawaken: true, pathname: "/wiki" }), null);
  assert.deepEqual(resolveChatterBucket({ status: "idle", touch: true, pathname: "/wiki", reawaken: true }), {
    bucket: "touch",
  });
  assert.deepEqual(resolveChatterBucket({ status: "done", reawaken: true, pathname: "/wiki" }), {
    bucket: "reawaken",
  });
  assert.deepEqual(resolveChatterBucket({ status: "idle", pathname: "/writing" }), {
    bucket: "page",
    page: "writing",
  });
  assert.deepEqual(resolveChatterBucket({ status: "idle", pathname: "/" }), { bucket: "idle" });
  assert.deepEqual(resolveChatterBucket({ status: "error", pathname: "/preview/b" }), { bucket: "idle" });
});

test("冷却没到、被挡住、或思考中，环境碎碎念不出声", () => {
  assert.equal(chatterGapMs(0), XIAOMEI_CHATTER_GAP_MS.min);
  assert.equal(chatterGapMs(1), XIAOMEI_CHATTER_GAP_MS.max);
  assert.equal(chatterGapMs(Number.NaN), XIAOMEI_CHATTER_GAP_MS.min);
  assert.ok(XIAOMEI_CHATTER_GAP_MS.min >= 10_000);
  assert.ok(XIAOMEI_CHATTER_GAP_MS.max - XIAOMEI_CHATTER_GAP_MS.min >= 8_000);
  const mid = chatterGapMs(0.5);
  assert.ok(mid > XIAOMEI_CHATTER_GAP_MS.min && mid < XIAOMEI_CHATTER_GAP_MS.max);

  const now = 100_000;
  assert.equal(canChatter({ now, lastAt: now - 3_000, minGapMs: XIAOMEI_CHATTER_GAP_MS.min, blocked: false }), false);
  assert.equal(
    canChatter({ now, lastAt: now - XIAOMEI_CHATTER_GAP_MS.min, minGapMs: XIAOMEI_CHATTER_GAP_MS.min, blocked: false }),
    true,
  );
  assert.equal(
    canChatter({ now, lastAt: 0, minGapMs: XIAOMEI_CHATTER_GAP_MS.min, blocked: true }),
    false,
  );
  assert.equal(canChatter({ now: Number.NaN, lastAt: 0, minGapMs: 1, blocked: false }), false);

  const ready = {
    now,
    lastAt: 0,
    blocked: false,
    minGapMs: 1,
    tone: "classic" as const,
  };
  const quiet = nextAmbientChatter({ ...ready, status: "thinking", pathname: "/" });
  assert.equal(quiet, null);
  const asleep = nextAmbientChatter({ ...ready, status: "idle", sleeping: true, pathname: "/wiki", reawaken: true });
  assert.equal(asleep, null);
  const held = nextAmbientChatter({
    ...ready,
    status: "idle",
    pathname: "/",
    lastAt: now - 500,
    minGapMs: XIAOMEI_CHATTER_GAP_MS.min,
  });
  assert.equal(held, null);
  const blocked = nextAmbientChatter({ ...ready, status: "idle", pathname: "/", blocked: true });
  assert.equal(blocked, null);

  const wiki = nextAmbientChatter({ ...ready, status: "idle", pathname: "/wiki/note" });
  assert.ok(wiki);
  assert.equal(wiki.bucket, "page");
  assert.ok(XIAOMEI_PAGE_MUTTER_LINES.wiki.some((line) => line.text === wiki.line.text));

  const back = nextAmbientChatter({ ...ready, status: "idle", pathname: "/about", reawaken: true });
  assert.ok(back);
  assert.equal(back.bucket, "reawaken");
  assert.ok(XIAOMEI_REAWAKE_LINES.some((line) => line.text === back.line.text));
  assert.equal(back.at, now);

  const home = nextAmbientChatter({ ...ready, status: "idle", pathname: "/" });
  assert.ok(home);
  assert.equal(home.bucket, "idle");
  assert.ok(XIAOMEI_MUTTER_LINES.some((line) => line.text === home.line.text));

  const wikiTexts = new Set(XIAOMEI_PAGE_MUTTER_LINES.wiki.map((line) => line.text));
  const idleTexts = new Set(XIAOMEI_MUTTER_LINES.map((line) => line.text));
  for (let i = 0; i < 16; i += 1) {
    const onPage = pickChatterLine({ bucket: "page", page: "wiki" }, undefined, "close");
    assert.ok(onPage);
    assert.equal(wikiTexts.has(onPage.text), true);
    assert.equal(idleTexts.has(onPage.text), false);
    const daydream = pickChatterLine(resolveChatterBucket({ status: "idle", pathname: "/" }), undefined, "close");
    assert.ok(daydream);
    assert.equal(idleTexts.has(daydream.text), true);
    assert.equal(wikiTexts.has(daydream.text), false);
  }
});

test("角标只经分桶开口，冷却用定时器，不留朗读和常驻帧", async () => {
  const companion = await readFile(new URL("../components/xiaomei/xiaomei-companion.tsx", import.meta.url), "utf8");
  assert.match(companion, /nextAmbientChatter/);
  assert.match(companion, /resolveChatterBucket/);
  assert.match(companion, /chatterGapMs/);
  assert.match(companion, /XIAOMEI_CHATTER_GAP_MS/);
  assert.match(companion, /touch:\s*true/);
  assert.match(companion, /reawakenPendingRef/);
  assert.doesNotMatch(companion, /XIAOMEI_MUTTER_LINES/);
  assert.doesNotMatch(companion, /speechSynthesis|requestAnimationFrame|蓝莓|二维码/);
  const chatter = await readFile(new URL("./xiaomei-chatter.ts", import.meta.url), "utf8");
  assert.doesNotMatch(chatter, /speechSynthesis|requestAnimationFrame|蓝莓|二维码|鲸鱼|大肥鱼/);
});
