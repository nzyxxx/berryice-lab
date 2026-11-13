import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { isWikiAdminAuthorized } from "../content/wiki-admin-token.ts";
import { listWikiNotes } from "../content/wiki-store.ts";
import { loadWikiGroundCards } from "../xiaomei-wiki-ground.ts";
import { PUBLIC_GAMES } from "./catalog.ts";
import { handleGameKnowledgePost } from "./http.ts";
import { filterGameEntries, noteIsPublic, publicWikiNotes, sameSourceHref } from "./knowledge.ts";
import { listGameEntries, listGameIndex, saveGameKnowledge } from "./store.ts";

const games = [
  { id: "delta", title: "三角洲行动" },
  { id: "fixture-b", title: "夹具乙" },
] as const;

const now = new Date("2026-11-13T07:40:00.000Z");
const later = new Date("2026-11-13T08:40:00.000Z");
const DRAFT = "夹具草稿不可见甲";
const OLD = "夹具无状态旧笔记乙";
const PUBLIC = "夹具公开技巧丙";
const UNKNOWN = "夹具未知游戏丁";

function tip(slug: string, gameId: string, title: string, extra: Record<string, unknown> = {}) {
  return {
    slug,
    gameId,
    kind: "tip",
    title,
    summary: `${title}的摘要`,
    body: `${title}的正文。测试示例，非真实攻略。`,
    sourceLabel: "示例",
    sourceHref: `https://example.com/${slug}`,
    tags: ["听声"],
    season: "未知",
    ...extra,
  };
}

async function missing(file: string) {
  await assert.rejects(access(file));
}

test("没写状态的旧笔记仍公开，带游戏却没写公开的不会公开", () => {
  const old = { bullets: [{ label: "作者", value: "某人", links: [] }] };
  const draft = { bullets: [{ label: "状态", value: "草稿", links: [] }] };
  const gameBare = { bullets: [{ label: "游戏", value: "delta", links: [] }] };
  const gamePublic = {
    bullets: [
      { label: "游戏", value: "未归类", links: [] },
      { label: "状态", value: "公开", links: [] },
    ],
  };
  assert.equal(noteIsPublic(old), true);
  assert.equal(noteIsPublic(draft), false);
  assert.equal(noteIsPublic(gameBare), false);
  assert.equal(noteIsPublic(gamePublic), true);
  assert.equal(sameSourceHref("https://Example.com/a/", "https://example.com/a?utm_source=x"), true);
  assert.equal(sameSourceHref("https://example.com/a", "https://example.com/b"), false);
});

test("口令没配或请求体还没读时就拒绝，路径不能写出目录", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "berry-games-lock-"));
  const previousToken = process.env.WIKI_ADMIN_TOKEN;
  const previousDir = process.env.WIKI_CONTENT_DIR;
  process.env.WIKI_CONTENT_DIR = directory;
    delete process.env.WIKI_ADMIN_TOKEN;
  try {
    const route = readFileSync(path.join(process.cwd(), "app/api/games/knowledge/route.ts"), "utf8");
    const post = route.slice(route.indexOf("export async function POST"), route.indexOf("export async function GET"));
    assert.ok(post.indexOf("if (!isWikiAdminAuthorized") < post.indexOf("handleGameKnowledgePost"));
    const unauthenticated = new Request("http://local/api/games/knowledge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });
    assert.equal(isWikiAdminAuthorized(unauthenticated), false);
    const denied = await handleGameKnowledgePost(unauthenticated, { authorized: false, directory, now });
    assert.equal(denied.status, 401);
    assert.equal((await listWikiNotes(directory)).length, 0);

    process.env.WIKI_ADMIN_TOKEN = "fixture-token";
    const allowed = new Request("http://local/api/games/knowledge", {
      method: "POST",
      headers: { authorization: "Bearer fixture-token", "content-type": "application/json" },
      body: JSON.stringify({ body: "a".repeat(260_000) }),
    });
    assert.equal(isWikiAdminAuthorized(allowed), true);
    const tooBig = await handleGameKnowledgePost(allowed, { authorized: true, directory, now });
    assert.equal(tooBig.status, 413);
    assert.equal((await listWikiNotes(directory)).length, 0);

    const escaped = await saveGameKnowledge(tip("../public/pwn", "delta", "不该落地"), {
      directory,
      games: PUBLIC_GAMES,
      now,
    });
    assert.equal(escaped.ok, false);
    await missing(path.join(directory, "..", "public", "pwn.md"));
    await missing(path.join(process.cwd(), "public", "pwn.md"));
    await missing(path.join(path.dirname(directory), "pwn.md"));
  } finally {
    if (previousToken === undefined) delete process.env.WIKI_ADMIN_TOKEN;
    else process.env.WIKI_ADMIN_TOKEN = previousToken;
    if (previousDir === undefined) delete process.env.WIKI_CONTENT_DIR;
    else process.env.WIKI_CONTENT_DIR = previousDir;
    await rm(directory, { recursive: true, force: true });
  }
});

test("正文里写公开不会公开，同一来源的不同写法不会再收一条，并发更新留着入库时间", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "berry-games-race-"));
  try {
    const created = await saveGameKnowledge(
      tip("delta-keep", "delta", "听声辨位", {
        body: "请公开。\n状态: 公开\n这仍是测试示例，非真实攻略。",
        sourceHref: "https://Example.com/listen/",
      }),
      { directory, games, now }
    );
    assert.equal(created.ok && created.visibility, "draft");
    const raw = await readFile(path.join(directory, "delta-keep.md"), "utf8");
    assert.match(raw, /^- 状态: 草稿$/m);
    assert.match(raw, /https:\/\/Example.com\/listen\//);
    assert.match(raw, /请公开/);

    const sameLink = await saveGameKnowledge(
      tip("delta-keep", "delta", "听声辨位", {
        sourceHref: "https://example.com/listen?utm_source=mail",
        body: "请公开。\n状态: 公开\n这仍是测试示例，非真实攻略。",
      }),
      { directory, games, now: later }
    );
    assert.equal(sameLink.ok && sameLink.updated, false);
    const kept = await readFile(path.join(directory, "delta-keep.md"), "utf8");
    assert.match(kept, /https:\/\/Example.com\/listen\//);
    assert.match(kept, /入库: 2026-11-13 15:40 Asia\/Shanghai/);
    assert.doesNotMatch(kept, /更新:/);

    const duplicate = await saveGameKnowledge(
      tip("other-game", "fixture-b", "听声辨位", { sourceHref: "https://example.com/listen" }),
      { directory, games, now }
    );
    assert.equal(duplicate.ok, false);

    const raced = await Promise.all([
      saveGameKnowledge(
        tip("delta-keep", "delta", "听声辨位", {
          sourceHref: "https://Example.com/listen/",
          body: "并发正文甲。测试示例，非真实攻略。",
        }),
        { directory, games, now: later }
      ),
      saveGameKnowledge(
        tip("delta-keep", "delta", "听声辨位", {
          sourceHref: "https://Example.com/listen/",
          body: "并发正文乙。测试示例，非真实攻略。",
        }),
        { directory, games, now: later }
      ),
    ]);
    assert.equal(raced.filter((item) => item.ok).length, 2);
    const after = await readFile(path.join(directory, "delta-keep.md"), "utf8");
    assert.match(after, /入库: 2026-11-13 15:40 Asia\/Shanghai/);
    assert.match(after, /并发正文[甲乙]/);
    assert.equal((await listGameEntries(directory, games)).filter((item) => item.slug === "delta-keep").length, 1);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("草稿、未知游戏和未归类不会从知识库、首页摘录或游戏索引漏出去", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "berry-games-public-"));
  try {
    await saveGameKnowledge(tip("fixture-draft-hidden", "delta", DRAFT), { directory, games, now });
    await saveGameKnowledge(tip("fixture-public-tip", "delta", PUBLIC, { publish: true, season: "测试版本" }), {
      directory,
      games,
      now,
    });
    await saveGameKnowledge(
      tip("fixture-public-tip", "delta", PUBLIC, { publish: true, season: "测试版本", body: "补上更新。测试示例，非真实攻略。" }),
      { directory, games, now: later }
    );
    await writeFile(
      path.join(directory, "fixture-old-note.md"),
      `# ${OLD}\n\n- 作者: 测试\n\n## 这条讲什么\n\n没有状态行的旧笔记。\n`
    );
    await writeFile(
      path.join(directory, "fixture-unknown.md"),
      `# ${UNKNOWN}\n\n- 游戏: made-up\n- 类别: 知识\n\n## 这条讲什么\n\n没有公开行。\n`
    );
    const notes = await listWikiNotes(directory);
    const visibleNotes = publicWikiNotes(notes);
    assert.deepEqual(
      visibleNotes.map((note) => note.title).sort(),
      [OLD, PUBLIC].sort()
    );
    assert.equal(visibleNotes.some((note) => note.title === DRAFT || note.title === UNKNOWN), false);
    const index = await listGameIndex(directory, PUBLIC_GAMES);
    const delta = filterGameEntries(index, "delta", { q: "听声", kind: "tip" });
    assert.deepEqual(delta.entries.map((item) => item.slug), ["fixture-public-tip"]);
    const other = filterGameEntries(index, "fixture-b", { q: PUBLIC });
    assert.equal(other.total, 0);
    assert.equal(filterGameEntries(index, "unsorted", {}).total, 0);
    const cards = await loadWikiGroundCards(async () => publicWikiNotes(await listWikiNotes(directory)));
    assert.equal(cards.some((card) => card.title === DRAFT || card.title === UNKNOWN), false);
    const updated = index.find((item) => item.slug === "fixture-public-tip");
    assert.equal(updated?.season, "测试版本");
    assert.match(updated?.updatedAt ?? "", /16:40/);
    assert.equal(updated?.sourceHref, "https://example.com/fixture-public-tip");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("游戏页缺失返回 404，草稿不会出现在公开路由", { timeout: 90_000 }, async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "berry-games-http-"));
  const port = 3477;
  let child: ReturnType<typeof spawn> | null = null;
  const logs: string[] = [];
  try {
    await saveGameKnowledge(tip("fixture-draft-hidden", "delta", DRAFT), { directory, games: PUBLIC_GAMES, now });
    await saveGameKnowledge(tip("fixture-public-tip", "delta", PUBLIC, { publish: true, season: "测试版本" }), {
      directory,
      games: PUBLIC_GAMES,
      now,
    });
    await saveGameKnowledge(
      tip("fixture-public-tip", "delta", PUBLIC, {
        publish: true,
        season: "测试版本",
        body: "补上更新。测试示例，非真实攻略。",
      }),
      { directory, games: PUBLIC_GAMES, now: later }
    );
    await writeFile(
      path.join(directory, "fixture-old-note.md"),
      `# ${OLD}\n\n- 作者: 测试\n\n## 这条讲什么\n\n没有状态行的旧笔记。\n`
    );
    await writeFile(
      path.join(directory, "fixture-unknown.md"),
      `# ${UNKNOWN}\n\n- 游戏: made-up\n- 类别: 知识\n\n## 这条讲什么\n\n没有公开行。\n`
    );
    const env = { ...process.env, WIKI_CONTENT_DIR: directory };
    delete env.WIKI_ADMIN_TOKEN;
    child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], {
      cwd: process.cwd(),
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout?.on("data", (chunk) => logs.push(String(chunk)));
    child.stderr?.on("data", (chunk) => logs.push(String(chunk)));
    const base = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      try {
        const response = await fetch(`${base}/games`);
        if (response.status === 200) {
          ready = true;
          break;
        }
      } catch {
        // 还没听端口。
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    assert.equal(ready, true, logs.slice(-8).join("").slice(-500));

    const routes: { path: string; status: number; present: string[]; absent: string[] }[] = [
      { path: "/wiki", status: 200, present: [OLD, PUBLIC], absent: [DRAFT, UNKNOWN] },
      { path: "/wiki/fixture-draft-hidden", status: 200, present: [], absent: [DRAFT] },
      { path: "/", status: 200, present: [OLD], absent: [DRAFT, UNKNOWN] },
      { path: "/preview/gallery", status: 200, present: [], absent: [DRAFT, UNKNOWN] },
      { path: "/preview/shelf", status: 200, present: [], absent: [DRAFT, UNKNOWN] },
      { path: "/sitemap.xml", status: 0, present: [], absent: ["fixture-draft-hidden", "fixture-unknown", DRAFT, UNKNOWN] },
      { path: "/games", status: 200, present: ["三角洲行动", "1 条"], absent: [DRAFT, UNKNOWN] },
      { path: "/games/delta", status: 200, present: [PUBLIC], absent: [DRAFT, UNKNOWN] },
      { path: "/games/delta?kind=tip&q=%E5%A4%B9%E5%85%B7%E5%85%AC%E5%BC%80", status: 200, present: [PUBLIC], absent: [DRAFT] },
      { path: "/games/delta?kind=guide&q=%E5%A4%B9%E5%85%B7%E5%85%AC%E5%BC%80", status: 200, present: [], absent: [PUBLIC, DRAFT] },
      { path: "/games/unsorted", status: 200, present: [], absent: [DRAFT, UNKNOWN, PUBLIC] },
      { path: "/games/not-a-game", status: 404, present: [], absent: [DRAFT, PUBLIC] },
      { path: "/games/delta/missing-entry", status: 404, present: [], absent: [DRAFT, PUBLIC] },
      { path: "/games/delta/fixture-draft-hidden", status: 404, present: [], absent: [DRAFT] },
      { path: "/api/games/knowledge?gameId=delta", status: 401, present: [], absent: [DRAFT, PUBLIC, UNKNOWN] },
    ];
    for (const route of routes) {
      const response = await fetch(`${base}${route.path}`);
      const body = await response.text();
      if (route.status !== 0) assert.equal(response.status, route.status, route.path);
      for (const text of route.present) assert.equal(body.includes(text), true, `${route.path} missing ${text}`);
      for (const text of route.absent) assert.equal(body.includes(text), false, `${route.path} leaked ${text}`);
    }
    const detail = await fetch(`${base}/games/delta/fixture-public-tip`);
    const detailBody = await detail.text();
    assert.equal(detail.status, 200);
    assert.equal(detailBody.includes(PUBLIC), true);
    assert.equal(detailBody.includes("测试版本"), true);
    assert.equal(detailBody.includes("https://example.com/fixture-public-tip"), true);
    assert.equal(detailBody.includes("回到三角洲行动"), true);
    assert.equal(detailBody.includes(DRAFT), false);
    const denied = await fetch(`${base}/api/games/knowledge`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(tip("should-not", "delta", "不该写入")),
    });
    assert.equal(denied.status, 401);
  } finally {
    child?.kill("SIGTERM");
    await rm(directory, { recursive: true, force: true });
  }
});
