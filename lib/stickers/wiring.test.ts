import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { homeModules } from "../content/home-modules.ts";
import { moduleLinks } from "../site-config.ts";
import { formatKB } from "./format.ts";
import { FEED_STUB_EVENT_ID, simulateWebbyFeed } from "./ingest-stub.ts";

const read = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8");

test("首页实验室有表情工坊，顶栏不把工坊做成模块", () => {
  const lab = homeModules.find((m) => m.id === "lab");
  assert.ok(lab?.entries?.some((e) => e.title === "表情工坊" && e.href === "/stickers"));
  assert.equal(moduleLinks.length, 5);
  assert.ok(moduleLinks.some((m) => m.href === "/music"));
  assert.ok(!moduleLinks.some((m) => m.href === "/stickers"));
});

test("投喂示意按 eventId 落同一条，默认进保险箱", () => {
  const sticker = simulateWebbyFeed(new Date("2026-11-03T00:00:00.000Z"));
  assert.equal(sticker.id, `feed-${FEED_STUB_EVENT_ID}`);
  assert.equal(sticker.source, "feed-stub");
  assert.equal(sticker.visibility, "private");
  const stub = read("./ingest-stub.ts");
  assert.match(stub, /POST \/api\/stickers\/ingest/);
  assert.match(stub, /\/api\/wiki\/ingest/);
  assert.match(stub, /STICKER_ADMIN_TOKEN/);
  assert.doesNotMatch(stub, /fetch\(/);
});

test("表情工坊走夜雨青紫，不用三角洲橙，入场不用 motion initial", () => {
  const page = read("../../app/(labs)/stickers/page.tsx");
  const studio = read("../../components/stickers/sticker-studio.tsx");
  assert.match(page, /表情工坊/);
  assert.match(page, /PageShell/);
  assert.match(studio, /私人保险箱/);
  assert.match(studio, /公开橱窗/);
  assert.match(studio, /投喂入库/);
  assert.match(studio, /id="kitchen"/);
  for (const source of [page, studio, read("../../components/stickers/kitchen/passport-card.tsx")]) {
    assert.doesNotMatch(source, /lab-accent-tactical|#f97316|#F97316/);
    assert.doesNotMatch(source, /initial=\{\{/);
  }
});

test("体积文案按 KB 收一位", () => {
  assert.equal(formatKB(1024), "1.0 KB");
  assert.equal(formatKB(20_480), "20.0 KB");
  assert.equal(formatKB(307_200), "300 KB");
});
