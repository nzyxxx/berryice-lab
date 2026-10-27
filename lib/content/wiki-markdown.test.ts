import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { parseWikiMarkdown } from "./wiki-parse.ts";
import { parseWikiBlocks, safeWikiHref } from "./wiki-markdown.ts";

test("fleet body keeps the summary heading, six points, and the nested layer list", async () => {
  const raw = await readFile(
    path.join(process.cwd(), "content/wiki/20261027-douyin-grok-bot-fleet-architecture.md"),
    "utf8"
  );
  const note = parseWikiMarkdown(raw, "fallback");
  const blocks = parseWikiBlocks(note.body);
  const headings = blocks.filter((block) => block.type === "heading");
  assert.equal(headings[0]?.type === "heading" && headings[0].children[0]?.type === "text"
    ? headings[0].children[0].text
    : "", "这条讲什么");

  const ordered = blocks.find((block) => block.type === "list" && block.ordered);
  assert.ok(ordered && ordered.type === "list");
  assert.equal(ordered.items.length, 6);
  const nested = ordered.items[2]?.blocks.find((block) => block.type === "list");
  assert.ok(nested && nested.type === "list" && nested.ordered === false);
  assert.equal(nested.items.length, 5);
  const firstLayer = nested.items[0]?.children.find((node) => node.type === "strong");
  assert.equal(firstLayer && firstLayer.type === "strong" ? firstLayer.children[0]?.type === "text" && firstLayer.children[0].text : "", "总控");
});

test("links only keep http(s), mailto, and site-relative hrefs", () => {
  assert.equal(safeWikiHref("https://berryice.cn/wiki"), "https://berryice.cn/wiki");
  assert.equal(safeWikiHref("/wiki"), "/wiki");
  assert.equal(safeWikiHref("mailto:a@b.c"), "mailto:a@b.c");
  assert.equal(safeWikiHref("javascript:alert(1)"), null);
  assert.equal(safeWikiHref("//evil.example"), null);
});
