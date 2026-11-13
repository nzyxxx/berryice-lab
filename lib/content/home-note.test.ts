import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { homeNoteLine } from "./home-note.ts";

test("homepage summary stops on a whole clause, not mid-phrase", () => {
  const summary =
    "作者把 Grok Bot 当成设备与 IM 之间的中间件，后面还有入库说明和 Webhook 细节。";
  const line = homeNoteLine(summary);
  assert.equal(line, "作者把 Grok Bot 当成设备与 IM 之间的中间件");
  assert.equal(line.includes("…"), false);
  assert.equal(line.includes("Webhook"), false);
  assert.equal(line.includes("入库"), false);
});

test("a short sentence stays whole", () => {
  assert.equal(homeNoteLine("枪械、改枪码和主播。后面不读。"), "枪械、改枪码和主播");
});

test("the homepage does not explain the build to visitors", () => {
  const source = readFileSync(new URL("../../components/preview/media-gallery.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /不是新画的封面|三套动画|原图还没|笔记 ·|还没有文章/);
  assert.match(source, /知识库/);
  assert.match(source, /idle-candd-24-still\.webp/);
  assert.doesNotMatch(source, /idle-candd-24\.webp/);
});
