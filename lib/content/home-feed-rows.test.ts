import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { assessFeedRows, type FeedRowBox } from "./feed-geometry.ts";
import { selectHomeUpdates, type HomeUpdate } from "./home-feed.ts";

const LONG = "测试数据 这是一条故意写得很长的标题，用来确认手机上也还是同一行";

function item(index: number, kind: HomeUpdate["kind"], sourceLabel: string): HomeUpdate {
  return {
    id: `${kind}:fixture-${index}`,
    kind,
    sourceLabel,
    title: `${LONG} ${index}`,
    summary: "",
    href: kind === "game" ? `/games/delta/fixture-${index}` : kind === "writing" ? "/writing" : `/wiki/fixture-${index}`,
    at: index === 3 ? null : `2026-11-${String(10 + index).padStart(2, "0")} 00:00`,
  };
}

test("八条多源长标题是同一行，fixture 不进首页数据", async () => {
  const updates = [
    item(0, "wiki", "知识库"),
    item(1, "game", "游戏知识"),
    item(2, "writing", "写作"),
    item(3, "wiki", "知识库"),
    item(4, "game", "游戏知识"),
    item(5, "writing", "写作"),
    item(6, "wiki", "知识库"),
    item(7, "game", "游戏知识"),
  ];
  const selected = selectHomeUpdates(updates, "all");
  assert.equal(selected.items.length, 8);
  assert.equal(new Set(selected.items.map((row) => row.kind)).size, 3);
  assert.ok(selected.items.every((row) => row.title.length > 24));

  const feed = await readFile(path.join(process.cwd(), "components/preview/home-feed.tsx"), "utf8");
  assert.equal(feed.includes("col-span-2"), false);
  assert.equal(feed.includes("sm:grid-cols"), false);
  assert.match(feed, /title=\{item\.title\}/);

  const page = await readFile(path.join(process.cwd(), "app/page.tsx"), "utf8");
  assert.equal(page.includes("fixture-"), false);

  const rows: FeedRowBox[] = updates.map((row, index) => ({
    dateX: 20,
    sourceX: 96,
    titleX: 156,
    dateWidth: row.at ? 72 : 48,
    clientWidth: 140,
    scrollWidth: 420,
    text: row.title,
    titleAttr: row.title,
    rowHeight: 44,
    dateLabel: row.at ? row.at.slice(0, 10) : "时间未记",
  }));
  assert.equal(rows[indexSafe(rows)].dateLabel, "时间未记");
  assert.deepEqual(assessFeedRows(rows), []);
});

function indexSafe(rows: FeedRowBox[]): number {
  return rows.findIndex((row) => row.dateLabel === "时间未记");
}
