import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { listWikiNotes, wikiContentDir } from "./wiki-store.ts";
import { parseWikiMarkdown } from "./wiki-parse.ts";
import type { WikiNote } from "./wiki-store.ts";
import type { Article } from "./writing.ts";
import { PUBLIC_GAMES } from "../games/catalog.ts";
import {
  assembleHomeFeed,
  homeFeedDateLabel,
  homeFeedEmptyCopy,
  homeFeedTime,
  selectHomeUpdates,
  type HomeUpdate,
} from "./home-feed.ts";
import { assessFeedRows, TEXT_ZOOM_NOTE, type FeedRowBox } from "./feed-geometry.ts";

const games = [
  { id: "delta", title: "三角洲行动" },
  { id: "fixture-b", title: "夹具乙" },
] as const;

function note(slug: string, markdown: string): WikiNote {
  return { slug, ...parseWikiMarkdown(markdown, slug) };
}

function article(id: string, title: string, publishedAt: string, href = "/writing"): Article {
  return {
    id,
    title,
    summary: `${title}的一句摘要。后面还有不该进首页的细节。`,
    publishedAt,
    readingTime: "1 min",
    tags: [],
    href,
  };
}

test("跨类型按内容时间排，同一时刻有固定次序，没写时间的在最后", () => {
  const updates = assembleHomeFeed({
    notes: [
      note(
        "listen",
        `# 听声\n\n- 游戏: delta\n- 类别: 技巧\n- 版本: 未知\n- 入库: 2026-01-01 08:00\n- 更新: 2026-11-03 08:00\n- 状态: 公开\n\n## 这条讲什么\n\n雨天先分左右。\n`
      ),
      note(
        "old-video",
        `# 旧视频新收录\n\n- 发布: 2020-01-01 00:00\n- 入库: 2026-11-03 08:00\n\n## 这条讲什么\n\n这是后来收进知识库的。\n`
      ),
      note(
        "undated",
        `# 没有时间\n\n## 这条讲什么\n\n只有这一句。\n`
      ),
    ],
    games,
    articles: [article("essay", "一篇长文", "2026-11-01")],
  });

  assert.deepEqual(
    updates.map((item) => [item.id, item.kind, item.at, item.href]),
    [
      ["game:listen", "game", "2026-11-03 08:00", "/games/delta/listen"],
      ["wiki:old-video", "wiki", "2026-11-03 08:00", "/wiki/old-video"],
      ["writing:essay", "writing", "2026-11-01 00:00", "/writing"],
      ["wiki:undated", "wiki", null, "/wiki/undated"],
    ]
  );
  assert.equal(updates[0]?.sourceLabel, "游戏知识");
  assert.equal(updates[1]?.sourceLabel, "知识库");
  assert.equal(updates[3]?.summary, "只有这一句");
  assert.equal(updates.some((item) => item.id === "wiki:listen"), false);
  assert.equal(updates[1]?.at?.startsWith("2020"), false);
});

test("草稿、未公开的游戏条目和私有路径不进首页", () => {
  const updates = assembleHomeFeed({
    notes: [
      note(
        "draft-note",
        `# 草稿笔记\n\n- 状态: 草稿\n- 入库: 2026-12-02 08:00\n\n## 这条讲什么\n\n不该出现。\n`
      ),
      note(
        "draft-game",
        `# 草稿攻略\n\n- 游戏: delta\n- 类别: 攻略\n- 版本: 未知\n- 入库: 2026-12-01 08:00\n- 状态: 草稿\n\n## 这条讲什么\n\n也不该出现。\n`
      ),
      note(
        "secret-path",
        `# 路径不该漏\n\n- 入库: 2026-11-04 09:00\n\n## 这条讲什么\n\n正文写了 wiki/inbox/secret.md，摘要不能带着它。\n`
      ),
      note(
        "public-note",
        `# 可以看\n\n- 入库: 2026-11-04 10:00\n\n## 这条讲什么\n\n这句可以看。\n`
      ),
    ],
    games,
    articles: [article("token", "带口令", "2026-11-04", "/writing?token=Bearer secret")],
  });

  assert.deepEqual(
    updates.map((item) => item.id),
    ["wiki:public-note", "wiki:secret-path"]
  );
  assert.equal(updates[1]?.summary, "");
  assert.equal(JSON.stringify(updates).includes("wiki/inbox"), false);
  assert.equal(JSON.stringify(updates).includes("Bearer"), false);
});

test("同一条写作只留更晚的那次，坏链接丢掉", () => {
  const updates = assembleHomeFeed({
    notes: [],
    games,
    articles: [
      article("essay", "旧题", "2026-11-01"),
      article("essay", "新题", "2026-11-05"),
      article("script", "脚本", "2026-11-09", "javascript:alert(1)"),
      article("scheme", "协议", "2026-11-09", "http://example.com/a"),
    ],
  });
  assert.equal(updates.length, 1);
  assert.equal(updates[0]?.title, "新题");
  assert.equal(updates[0]?.at, "2026-11-05 00:00");
});

test("空动态、筛选和超出 8 条", () => {
  assert.deepEqual(assembleHomeFeed({ notes: [], games, articles: [] }), []);
  assert.equal(homeFeedEmptyCopy("all"), "还没有公开更新。");
  assert.equal(homeFeedEmptyCopy("game"), "还没有公开的游戏知识。");
  assert.equal(homeFeedTime("不是日期"), null);
  assert.equal(homeFeedTime("2026-13-01"), null);

  const items: HomeUpdate[] = Array.from({ length: 9 }, (_, index) => ({
    id: `wiki:n${index}`,
    kind: "wiki" as const,
    sourceLabel: "知识库",
    title: `笔记${index}`,
    summary: "",
    href: `/wiki/n${index}`,
    at: `2026-11-0${9 - index} 00:00`.replace("2026-11-00", "2026-10-31"),
  }));
  items.push({
    id: "game:only",
    kind: "game",
    sourceLabel: "游戏知识",
    title: "一条攻略",
    summary: "",
    href: "/games/delta/only",
    at: "2026-11-01 00:00",
  });
  const wiki = selectHomeUpdates(items, "wiki");
  assert.equal(wiki.items.length, 8);
  assert.equal(wiki.hidden, 1);
  assert.equal(wiki.items.every((item) => item.kind === "wiki"), true);
  const gamesOnly = selectHomeUpdates(items, "game");
  assert.deepEqual(gamesOnly.items.map((item) => item.id), ["game:only"]);
  assert.equal(gamesOnly.hidden, 0);
  assert.deepEqual(selectHomeUpdates([], "writing"), { items: [], hidden: 0 });
});

test("仓库里的公开笔记按入库时间排，游戏草稿不会被当成动态", async () => {
  const notes = await listWikiNotes(path.join(process.cwd(), "content", "wiki"));
  const updates = assembleHomeFeed({ notes, games: PUBLIC_GAMES, articles: [] });
  assert.ok(updates.length >= 2);
  assert.ok(updates.every((item) => item.kind === "wiki"));
  assert.deepEqual(
    updates.map((item) => item.href),
    [
      "/wiki/20261027-douyin-grok-bot-im-workstation",
      "/wiki/20261027-douyin-grok-bot-fleet-architecture",
    ]
  );
  assert.deepEqual(
    updates.map((item) => item.at),
    ["2026-10-27 16:28", "2026-10-27 16:17"]
  );
  const packed = JSON.stringify(updates);
  assert.equal(packed.includes("wiki/inbox"), false);
  assert.equal(packed.includes("wiki/sources"), false);
});

function fixtureNote(title: string, options: { ingested?: string; updated?: string; status?: string; game?: string } = {}) {
  const lines = [`# ${title}`, "", "- 作者: 测试夹具"];
  if (options.game) {
    lines.push(`- 游戏: ${options.game}`, "- 类别: 技巧", "- 版本: 测试");
  }
  if (options.ingested) lines.push(`- 入库: ${options.ingested} Asia/Shanghai（测试数据，不是生产笔记）`);
  if (options.updated) lines.push(`- 更新: ${options.updated}`);
  if (options.status) lines.push(`- 状态: ${options.status}`);
  lines.push("", "## 这条讲什么", "", `${title}。这是测试夹具，不是生产内容。`, "");
  return lines.join("\n");
}

test("24 条测试夹具从目录现读，最新一条进首页，写入后能看见", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "berry-home-feed-"));
  const previousDir = process.env.WIKI_CONTENT_DIR;
  try {
    const files: { slug: string; body: string }[] = [];
    for (let index = 1; index <= 18; index += 1) {
      const day = String(index).padStart(2, "0");
      files.push({
        slug: `fixture-w${day}`,
        body: fixtureNote(`测试数据 笔记${day}`, { ingested: `2026-10-${day} 09:${day}` }),
      });
    }
    files.push(
      {
        slug: "fixture-latest",
        body: fixtureNote("测试数据 最新一条", { ingested: "2026-11-16 18:40" }),
      },
      {
        slug: "fixture-game-public",
        body: fixtureNote("测试数据 游戏知识", {
          game: "delta",
          ingested: "2026-09-01 08:00",
          updated: "2026-11-02 08:00",
          status: "公开",
        }),
      },
      {
        slug: "fixture-undated",
        body: fixtureNote("测试数据 没有时间"),
      },
      {
        slug: "fixture-bad-time",
        body: fixtureNote("测试数据 时间无法解析", { ingested: "不是日期" }),
      },
      {
        slug: "fixture-draft",
        body: fixtureNote("测试数据 草稿笔记", { ingested: "2026-12-31 23:59", status: "草稿" }),
      },
      {
        slug: "fixture-game-draft",
        body: fixtureNote("测试数据 草稿攻略", {
          game: "delta",
          ingested: "2026-12-31 23:58",
          status: "草稿",
        }),
      }
    );
    assert.equal(files.length, 24);
    for (const file of files) {
      await writeFile(path.join(directory, `${file.slug}.md`), file.body, "utf8");
    }
    // 入库最早的那篇最后写。若误用文件修改时间，它会排到最前。
    await writeFile(path.join(directory, "fixture-w01.md"), files[0].body, "utf8");

    const first = assembleHomeFeed({
      notes: await listWikiNotes(directory),
      games: PUBLIC_GAMES,
      articles: [],
    });
    assert.equal(first[0]?.id, "wiki:fixture-latest");
    assert.equal(first[0]?.title, "测试数据 最新一条");
    assert.equal(first[0]?.at, "2026-11-16 18:40");
    assert.equal(first[1]?.id, "game:fixture-game-public");
    assert.equal(first[1]?.at, "2026-11-02 08:00");
    assert.equal(first.some((item) => item.id === "wiki:fixture-game-public"), false);
    assert.equal(first.some((item) => item.title.includes("草稿")), false);
    const undated = first.filter((item) => item.at === null);
    assert.deepEqual(
      undated.map((item) => item.id),
      ["wiki:fixture-bad-time", "wiki:fixture-undated"]
    );
    assert.equal(homeFeedDateLabel(undated[0]?.at ?? null), "时间未记");
    const visible = selectHomeUpdates(first, "all");
    assert.equal(visible.items[0]?.id, "wiki:fixture-latest");
    assert.equal(visible.items.length, 8);
    assert.equal(visible.hidden, first.length - 8);
    assert.equal(JSON.stringify(first).includes("不是生产"), false);

    await writeFile(
      path.join(directory, "fixture-runtime.md"),
      fixtureNote("测试数据 运行时新写入", { ingested: "2026-11-16 19:10" }),
      "utf8"
    );
    process.env.WIKI_CONTENT_DIR = directory;
    assert.equal(wikiContentDir(), path.resolve(directory));
    const second = assembleHomeFeed({
      notes: await listWikiNotes(),
      games: PUBLIC_GAMES,
      articles: [],
    });
    assert.equal(second[0]?.id, "wiki:fixture-runtime");
    assert.equal(second[0]?.title, "测试数据 运行时新写入");
    assert.equal(selectHomeUpdates(second, "all").items[0]?.id, "wiki:fixture-runtime");
  } finally {
    if (previousDir === undefined) delete process.env.WIKI_CONTENT_DIR;
    else process.env.WIKI_CONTENT_DIR = previousDir;
    await rm(directory, { recursive: true, force: true });
  }
});

test("首页在请求时读笔记目录，不把仓库里的两篇写死", () => {
  const page = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
  const config = readFileSync(new URL("../../next.config.ts", import.meta.url), "utf8");
  assert.match(page, /await connection\(\)/);
  assert.match(page, /listWikiNotes\(\)/);
  assert.doesNotMatch(page, /20261027-douyin|content\/wiki\/.+\.md/);
  assert.match(config, /source: "\/"/);
  assert.match(config, /private, no-cache, no-store, max-age=0, must-revalidate/);
});

test("首页不把枪、歌单或动画静帧当成动态", () => {
  const feed = readFileSync(new URL("./home-feed.ts", import.meta.url), "utf8");
  const gallery = readFileSync(new URL("../../components/preview/media-gallery.tsx", import.meta.url), "utf8");
  const channelData = readFileSync(new URL("./home-channels.ts", import.meta.url), "utf8");
  const channelView = readFileSync(new URL("../../components/preview/home-channels.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(feed, /playlist|localStorage|mtime|git /);
  assert.match(gallery, /最新动态/);
  assert.match(gallery, /idle-candd-24-still-hi\.webp/);
  const feedView = readFileSync(new URL("../../components/preview/home-feed.tsx", import.meta.url), "utf8");
  const footer = readFileSync(new URL("../../components/lab/site-footer.tsx", import.meta.url), "utf8");
  assert.match(feedView, /minmax\(0,1fr\)/);
  assert.match(feedView, /whitespace-nowrap/);
  assert.match(feedView, /text-ellipsis/);
  assert.doesNotMatch(feedView, /justify-center/);
  assert.doesNotMatch(footer, /moduleLinks|ghs\.png/);
  assert.match(footer, /icpNumber/);
  assert.match(footer, /policeNumber/);
  assert.doesNotMatch(gallery, /awm\.webp|idle-candd-24\.webp/);
  assert.match(channelView, /Gamepad2/);
  assert.match(channelData, /href: "\/games"/);
  assert.doesNotMatch(channelView, /delta-gun|awm|Crosshair/);
  for (const href of ["/wiki", "/games", "/music", "/stickers", "/about", "/writing"]) {
    assert.match(channelData, new RegExp(href.replaceAll("/", "\\/")));
  }
});

function row(overrides: Partial<FeedRowBox> = {}): FeedRowBox {
  return {
    dateX: 12,
    sourceX: 90,
    titleX: 160,
    dateWidth: 72,
    clientWidth: 180,
    scrollWidth: 180,
    text: "测试数据 短",
    titleAttr: "测试数据 短",
    rowHeight: 44,
    dateLabel: "2026-11-16",
    ...overrides,
  };
}

test("八行动态列对齐，长标题省略，时间未记不把日期列撑宽", () => {
  assert.match(TEXT_ZOOM_NOTE, /deviceScaleFactor 2/);
  assert.match(TEXT_ZOOM_NOTE, /180/);
  const long = "测试数据 这是一条故意写长的标题";
  const rows = [
    row({ text: long, titleAttr: long, scrollWidth: 420, clientWidth: 180 }),
    row({ text: "测试数据 短", titleAttr: "测试数据 短" }),
    row({ dateLabel: "时间未记", dateWidth: 48, text: long, titleAttr: long, scrollWidth: 400 }),
    row(),
    row(),
    row(),
    row(),
    row(),
  ];
  assert.deepEqual(assessFeedRows(rows), []);
  const shifted = rows.map((item, index) => (index === 3 ? { ...item, dateX: item.dateX + 8 } : item));
  assert.match(assessFeedRows(shifted).join(" "), /dateX/);
  const widened = rows.map((item) =>
    item.dateLabel === "时间未记" ? { ...item, dateWidth: 120 } : item,
  );
  assert.match(assessFeedRows(widened).join(" "), /时间未记/);
});
