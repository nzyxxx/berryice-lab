import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { homeNoteLine } from "./home-note.ts";

test("homepage keeps the first sentence short and leaves the rest unread", () => {
  const summary =
    "作者把 Grok Bot 当成设备与 IM 之间的中间件，后面还有入库说明和 Webhook 细节。";
  const line = homeNoteLine(summary);
  assert.equal(line.endsWith("…"), true);
  assert.ok(line.length <= 33);
  assert.equal(line.includes("Webhook"), false);
  assert.equal(line.includes("入库"), false);
});

test("the homepage does not explain the build to visitors", () => {
  const source = readFileSync(new URL("../../components/lab/home-cover.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /不是新画的封面|三套动画|原图还没|awm\.webp|笔记 ·/);
  assert.match(source, /知识库/);
  assert.match(source, /idle-candd-24-still\.webp/);
  assert.doesNotMatch(source, /idle-candd-24\.webp/);
});
