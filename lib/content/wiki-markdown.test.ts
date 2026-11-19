import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { parseWikiMarkdown } from "./wiki-parse.ts";
import { parseWikiBlocks, safeWikiHref, safeWikiImageSrc } from "./wiki-markdown.ts";

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

test("local images and tables stay, remote images and other html do not", () => {
  const source = [
    "一段说明。",
    "",
    "| 第1格 | 第2格 |",
    "| :---: | :---: |",
    "| ![猎狼](/palworld/guides-20261119/Direhowl_猎狼.webp) | **天擒鸟**<br>滑翔 |",
    "| ![外链](https://paldb.cc/x.webp)<script>alert(1)</script> | 文字 |",
    "",
    "![火绒狐的背带](/palworld/guides-20261119/火绒狐的背带__T_itemicon_Essential_SkillUnlock_Harness.webp)",
    "",
    "![坏图](javascript:alert(1))",
  ].join("\n");
  const blocks = parseWikiBlocks(source);
  const table = blocks.find((block) => block.type === "table");
  assert.ok(table && table.type === "table");
  assert.deepEqual(table.align, ["center", "center"]);
  assert.equal(table.header.length, 2);
  assert.equal(table.rows.length, 2);
  const image = table.rows[0]?.[0]?.find((node) => node.type === "image");
  assert.equal(image && image.type === "image" ? image.src : "", "/palworld/guides-20261119/Direhowl_猎狼.webp");
  assert.equal(image && image.type === "image" ? image.alt : "", "猎狼");
  const broken = table.rows[0]?.[1]?.find((node) => node.type === "break");
  assert.equal(broken?.type, "break");
  const remote = table.rows[1]?.[0] ?? [];
  assert.equal(remote.some((node) => node.type === "image"), false);
  assert.equal(remote.some((node) => node.type === "text" && node.text.includes("script")), true);
  const paragraph = blocks.find((block) => block.type === "paragraph" && block.children.some((node) => node.type === "image"));
  assert.ok(paragraph && paragraph.type === "paragraph");
  assert.equal(safeWikiHref("javascript:alert(1)"), null);
  assert.equal(safeWikiImageSrc("https://paldb.cc/x.webp"), null);
  assert.equal(safeWikiImageSrc("/palworld/guides-20261119/../secret.webp"), null);
});

test("links only keep http(s), mailto, and site-relative hrefs", () => {
  assert.equal(safeWikiHref("https://berryice.cn/wiki"), "https://berryice.cn/wiki");
  assert.equal(safeWikiHref("/wiki"), "/wiki");
  assert.equal(safeWikiHref("mailto:a@b.c"), "mailto:a@b.c");
  assert.equal(safeWikiHref("javascript:alert(1)"), null);
  assert.equal(safeWikiHref("//evil.example"), null);
});

test("两篇帕鲁原稿改成本地图后，五档、表格和行内图都能解析", async () => {
  const root = process.cwd();
  const mapping = JSON.parse(
    await readFile(path.join(root, "scripts/palworld-import/mapping.json"), "utf8")
  ) as { images: { website_path: string; source_sha256: string }[] };
  assert.equal(mapping.images.length, 78);
  const files = await readdir(path.join(root, "public/palworld/guides-20261119"));
  assert.equal(files.length, 78);
  for (const image of mapping.images) {
    const bytes = await readFile(path.join(root, "public", image.website_path.slice(1)));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), image.source_sha256);
    assert.equal(safeWikiImageSrc(image.website_path), image.website_path);
  }

  const party = await readFile(
    path.join(root, "scripts/palworld-import/20261119-palworld-party-and-base.md"),
    "utf8"
  );
  const traits = await readFile(
    path.join(root, "scripts/palworld-import/20261119-palworld-passive-traits.md"),
    "utf8"
  );
  const partyPayload = JSON.parse(
    await readFile(path.join(root, "scripts/palworld-import/payloads/20261119-palworld-party-and-base.json"), "utf8")
  ) as { slug: string; gameId: string; kind: string; title: string; body: string; publish: boolean; sourceHref?: string; season?: string };
  const traitsPayload = JSON.parse(
    await readFile(path.join(root, "scripts/palworld-import/payloads/20261119-palworld-passive-traits.json"), "utf8")
  ) as { slug: string; gameId: string; kind: string; title: string; body: string; publish: boolean; sourceHref?: string; season?: string };
  assert.equal(party.startsWith(`# ${partyPayload.title}\n\n${partyPayload.body}`), true);
  assert.equal(traits.startsWith(`# ${traitsPayload.title}\n\n${traitsPayload.body}`), true);
  let imageRefs = 0;
  for (const payload of [partyPayload, traitsPayload]) {
    assert.equal(payload.gameId, "palworld");
    assert.equal(payload.kind, "guide");
    assert.equal(payload.publish, true);
    assert.equal("sourceHref" in payload, false);
    assert.equal("sourceLabel" in payload, false);
    assert.equal("season" in payload, false);
    assert.equal(payload.body.startsWith("# "), false);
    assert.equal(payload.body.includes(payload.title), false);
    imageRefs += payload.body.match(/!\[[^\]]*\]\([^)]+\)/g)?.length ?? 0;
  }
  assert.equal(imageRefs, 119);
  const page = await readFile(path.join(root, "app/games/[gameId]/[slug]/page.tsx"), "utf8");
  assert.equal(page.includes("来源没有写"), false);
  assert.equal(page.includes("收录时间未知"), false);
  assert.equal(page.includes('entry.season || "未知"'), false);
  const scroll = await readFile(path.join(root, "components/wiki/wiki-table-scroll.tsx"), "utf8");
  assert.equal(scroll.includes('tabIndex={0}'), true);
  assert.equal(scroll.includes("可横向滚动的表格"), true);
  for (const source of [party, traits]) {
    assert.equal(source.includes("未发布"), false);
    assert.equal(source.includes("](assets/"), false);
    assert.equal(source.includes("](https://") && source.includes("!["), true);
    assert.equal(/!\[[^\]]*\]\(https?:/.test(source), false);
  }
  const partyBlocks = parseWikiBlocks(party);
  const headings = partyBlocks
    .filter((block) => block.type === "heading")
    .map((block) => (block.type === "heading" && block.children[0]?.type === "text" ? block.children[0].text : ""));
  for (const tier of ["0–20级", "20–40级", "40–60级", "60–80级", "80–100级"]) {
    assert.equal(headings.includes(tier), true, tier);
  }
  const tables = partyBlocks.filter((block) => block.type === "table");
  assert.ok(tables.length >= 2);
  const five = tables.find((block) => block.type === "table" && block.header.length === 5);
  assert.ok(five && five.type === "table");
  assert.equal(five.rows[0]?.[0]?.some((node) => node.type === "image"), true);
  assert.equal(five.rows[1]?.[0]?.some((node) => node.type === "break"), true);
  const traitBlocks = parseWikiBlocks(traits);
  assert.equal(traitBlocks.some((block) => block.type === "table"), false);
  const inline = traitBlocks.filter(
    (block) => block.type === "paragraph" && block.children.filter((node) => node.type === "image").length >= 2
  );
  assert.ok(inline.length >= 1);
});
