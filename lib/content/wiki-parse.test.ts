import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { isWikiSlug, parseWikiMarkdown, resolveWikiFile } from "./wiki-parse.ts";

const root = path.join(process.cwd(), "content", "wiki");

test("fleet note exposes title, author, source, ingest time, and summary", async () => {
  const raw = await readFile(
    path.join(root, "20261027-douyin-grok-bot-fleet-architecture.md"),
    "utf8"
  );
  const note = parseWikiMarkdown(raw, "fallback");
  assert.equal(note.title, "Grok Bot 多 Agent「舰队」五层架构（Jacky无限生长）");
  assert.equal(note.author, "Jacky无限生长");
  assert.equal(note.sourceLabel, "抖音短链");
  assert.equal(note.sourceHref, "https://v.douyin.com/QkrhZU5E4a4/");
  assert.equal(note.ingestedSort, "2026-10-27 16:17");
  assert.match(note.ingestedAt ?? "", /Webhook/);
  assert.match(note.summary, /^作者把 Grok Bot 当成/);
  assert.doesNotMatch(note.summary, /\n/);
  assert.match(note.body, /^## 这条讲什么/);
  assert.equal(note.bullets.some((bullet) => bullet.label === "存储"), true);
});

test("workstation note keeps the author glyph and a one-line summary", async () => {
  const raw = await readFile(
    path.join(root, "20261027-douyin-grok-bot-im-workstation.md"),
    "utf8"
  );
  const note = parseWikiMarkdown(raw, "fallback");
  assert.equal(note.author, "麦当MDLDM🍔");
  assert.equal(note.ingestedSort, "2026-10-27 16:28");
  assert.match(note.summary, /中间件/);
});

test("missing summary stays empty instead of inventing one", () => {
  const note = parseWikiMarkdown("# 只有标题\n\n正文一句。\n", "fallback");
  assert.equal(note.title, "只有标题");
  assert.equal(note.summary, "");
  assert.equal(note.author, null);
  assert.equal(note.ingestedAt, null);
});

test("slug cannot leave the wiki directory", () => {
  assert.equal(isWikiSlug("20261027-douyin-grok-bot-fleet-architecture"), true);
  assert.equal(isWikiSlug("note_1.0"), true);
  assert.equal(isWikiSlug("../etc/passwd"), false);
  assert.equal(isWikiSlug("foo/bar"), false);
  assert.equal(isWikiSlug(".."), false);
  assert.equal(isWikiSlug(".hidden"), false);
  assert.equal(isWikiSlug(""), false);
  assert.equal(isWikiSlug("ingest"), false);

  const file = resolveWikiFile("/tmp/wiki", "fleet-note");
  assert.equal(file, path.resolve("/tmp/wiki/fleet-note.md"));
  assert.throws(() => resolveWikiFile("/tmp/wiki", "../secret"));
});
