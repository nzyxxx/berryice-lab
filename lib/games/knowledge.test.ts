import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { listWikiNotes } from "../content/wiki-store.ts";
import { PUBLIC_GAMES } from "./catalog.ts";
import { handleGameKnowledgeGet, handleGameKnowledgePost } from "./http.ts";
import { filterGameEntries, readGameEntry, wikiIngestConflict } from "./knowledge.ts";
import { listGameEntries, saveGameKnowledge } from "./store.ts";

const games = [
  { id: "delta", title: "三角洲行动" },
  { id: "fixture-b", title: "夹具乙" },
] as const;

const now = new Date("2026-11-13T07:27:00.000Z");
const later = new Date("2026-11-13T08:27:00.000Z");

function entry(slug: string, gameId: string, title: string, extra: Record<string, unknown> = {}) {
  return {
    slug,
    gameId,
    kind: "tip",
    title,
    summary: `${title}的摘要`,
    body: `${title}的正文。这不是从标题猜出来的。`,
    sourceLabel: "原文",
    sourceHref: `https://example.com/${slug}`,
    tags: ["听声"],
    season: "未知",
    ...extra,
  };
}

test("公开游戏只有已确认的三角洲，夹具游戏不在清单里", () => {
  assert.deepEqual(
    PUBLIC_GAMES.map((game) => game.id),
    ["delta"]
  );
  const nav = readFileSyncNav();
  for (const href of [
    "/delta-gun",
    "/delta-gun/guns",
    "/delta-gun/community",
    "/delta-gun/streamers",
    "/delta-gun/my-loadouts",
  ]) {
    assert.match(nav, new RegExp(href.replaceAll("/", "\\/")));
  }
});

function readFileSyncNav(): string {
  return readFileSync(path.join(process.cwd(), "lib/delta-gun/navigation.ts"), "utf8");
}

test("已公开的知识库笔记不是游戏攻略", async () => {
  const notes = await listWikiNotes(path.join(process.cwd(), "content/wiki"));
  assert.ok(notes.length >= 2);
  for (const note of notes) {
    assert.equal(readGameEntry(note, PUBLIC_GAMES), null);
  }
});

test("游戏 A 的知识不会出现在游戏 B，重读文件仍在", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "berry-games-"));
  try {
    const first = await saveGameKnowledge(entry("delta-listen", "delta", "听声辨位"), {
      directory,
      games,
      now,
    });
    const second = await saveGameKnowledge(entry("fixture-listen", "fixture-b", "听声辨位"), {
      directory,
      games,
      now,
    });
    assert.equal(first.ok && first.created, true);
    assert.equal(second.ok && second.created, true);

    const again = await listGameEntries(directory, games);
    const delta = filterGameEntries(again, "delta", { q: "听声" }, { includeDrafts: true });
    const other = filterGameEntries(again, "fixture-b", { q: "听声" }, { includeDrafts: true });
    assert.deepEqual(delta.entries.map((item) => item.slug), ["delta-listen"]);
    assert.deepEqual(other.entries.map((item) => item.slug), ["fixture-listen"]);

    const moved = await saveGameKnowledge(entry("delta-listen", "fixture-b", "听声辨位"), {
      directory,
      games,
      now: later,
    });
    assert.equal(moved.ok, false);
    if (!moved.ok) assert.equal(moved.status, 409);

    const reread = await listGameEntries(directory, games);
    assert.equal(reread.find((item) => item.slug === "delta-listen")?.gameId, "delta");
    const raw = await readFile(path.join(directory, "delta-listen.md"), "utf8");
    assert.match(raw, /游戏: delta/);
    assert.doesNotMatch(raw, /游戏: fixture-b/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("同一条再收录不换入库时间和来源，正文变了才写更新", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "berry-games-"));
  try {
    const created = await saveGameKnowledge(entry("delta-doc", "delta", "地图笔记"), {
      directory,
      games,
      now,
    });
    assert.equal(created.ok && created.visibility, "draft");
    const same = await saveGameKnowledge(entry("delta-doc", "delta", "地图笔记"), {
      directory,
      games,
      now: later,
    });
    assert.equal(same.ok && same.updated, false);
    const changed = await saveGameKnowledge(
      entry("delta-doc", "delta", "地图笔记", { body: "补了一句能核对的正文。" }),
      { directory, games, now: later }
    );
    assert.equal(changed.ok && changed.updated, true);
    const raw = await readFile(path.join(directory, "delta-doc.md"), "utf8");
    assert.match(raw, /入库: 2026-11-13 15:27 Asia\/Shanghai/);
    assert.match(raw, /更新: 2026-11-13 16:27 Asia\/Shanghai/);
    assert.match(raw, /https:\/\/example.com\/delta-doc/);
    const swapped = await saveGameKnowledge(
      entry("delta-doc", "delta", "地图笔记", { sourceHref: "https://example.com/other" }),
      { directory, games, now: later }
    );
    assert.equal(swapped.ok, false);
    const kept = await readFile(path.join(directory, "delta-doc.md"), "utf8");
    assert.match(kept, /https:\/\/example.com\/delta-doc/);
    assert.doesNotMatch(kept, /example.com\/other/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("没写游戏就进未归类，标题里的游戏名不会自动归类", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "berry-games-"));
  try {
    const pending = await saveGameKnowledge(
      { ...entry("pending", "delta", "还没分游戏"), gameId: undefined },
      { directory, games, now }
    );
    assert.equal(pending.ok && pending.gameId, "unsorted");
    await writeFile(
      path.join(directory, "plain-note.md"),
      "# 三角洲听声辨位\n\n- 作者: 测试\n\n正文里只有标题像攻略。\n"
    );
    const listed = await listGameEntries(directory, games);
    assert.equal(listed.some((item) => item.slug === "plain-note"), false);
    assert.equal(listed.find((item) => item.slug === "pending")?.gameId, "unsorted");
    const hand = path.join(directory, "made-up.md");
    await saveGameKnowledge(entry("made-up", "delta", "写错游戏"), { directory, games, now });
    const text = (await readFile(path.join(directory, "made-up.md"), "utf8")).replace("游戏: delta", "游戏: valorant");
    await writeFile(hand, text);
    const publicView = await listGameEntries(directory, PUBLIC_GAMES);
    const delta = filterGameEntries(publicView, "delta", {}, { includeDrafts: true });
    const unsorted = filterGameEntries(publicView, "unsorted", {}, { includeDrafts: true });
    assert.equal(delta.entries.some((item) => item.slug === "made-up"), false);
    assert.equal(unsorted.entries.find((item) => item.slug === "made-up")?.unresolvedGame, "valorant");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("未授权不能写，草稿不进公开列表，同一个链接不能再收一条", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "berry-games-"));
  try {
    const denied = await handleGameKnowledgePost(
      new Request("http://local/api/games/knowledge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(entry("secret", "delta", "不该写进去")),
      }),
      { authorized: false, directory, now }
    );
    assert.equal(denied.status, 401);
    assert.equal((await listGameEntries(directory, games)).length, 0);

    const hidden = await handleGameKnowledgePost(
      new Request("http://local/api/games/knowledge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(entry("secret", "delta", "草稿")),
      }),
      { authorized: true, directory, now }
    );
    assert.equal(hidden.status, 201);
    const listed = await listGameEntries(directory, PUBLIC_GAMES);
    assert.equal(filterGameEntries(listed, "delta", {}).total, 0);
    const admin = await handleGameKnowledgeGet(
      new Request("http://local/api/games/knowledge?gameId=delta"),
      { authorized: true, directory }
    );
    assert.equal(admin.status, 200);
    const body = admin.body as { entries: { slug: string; visibility: string }[] };
    assert.deepEqual(body.entries.map((item) => item.slug), ["secret"]);
    assert.equal(body.entries[0]?.visibility, "draft");
    const stranger = await handleGameKnowledgeGet(
      new Request("http://local/api/games/knowledge?gameId=fixture-b"),
      { authorized: true, directory }
    );
    assert.equal(stranger.status, 400);

    const duplicate = await saveGameKnowledge(
      entry("another", "fixture-b", "另一条", { sourceHref: "https://example.com/secret" }),
      { directory, games, now }
    );
    assert.equal(duplicate.ok, false);
    if (!duplicate.ok) assert.equal(duplicate.status, 409);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("知识库覆盖不能改写游戏条目", () => {
  const existing = {
    bullets: [{ label: "游戏", value: "delta", links: [] }],
  };
  assert.match(wikiIngestConflict(existing, "# 普通覆盖\n\n正文\n") ?? "", /游戏收录/);
  assert.equal(wikiIngestConflict(null, "# 普通笔记\n\n- 作者: 某人\n"), null);
});

test("类别和搜索只留在这一款游戏里", () => {
  const entries = [
    {
      slug: "a",
      gameId: "delta",
      unresolvedGame: null,
      kind: "guide" as const,
      title: "攻略甲",
      summary: "雨天",
      sourceLabel: null,
      sourceHref: null,
      ingestedAt: null,
      updatedAt: null,
      season: "未知",
      tags: [],
      visibility: "public" as const,
    },
    {
      slug: "b",
      gameId: "fixture-b",
      unresolvedGame: null,
      kind: "guide" as const,
      title: "攻略甲",
      summary: "雨天",
      sourceLabel: null,
      sourceHref: null,
      ingestedAt: null,
      updatedAt: null,
      season: "未知",
      tags: [],
      visibility: "public" as const,
    },
  ];
  const found = filterGameEntries(entries, "delta", { kind: "guide", q: "雨天" });
  assert.deepEqual(found.entries.map((item) => item.slug), ["a"]);
  assert.equal(filterGameEntries(entries, "delta", { kind: "doc" }).total, 0);
  assert.equal(filterGameEntries(entries, "delta", { kind: "nope" }).unknownKind, true);
});
