import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { listWikiNotes } from "./wiki-store.ts";
import { parseWikiMarkdown } from "./wiki-parse.ts";
import type { WikiNote } from "./wiki-store.ts";
import type { Article } from "./writing.ts";
import { PUBLIC_GAMES } from "../games/catalog.ts";
import {
  assembleHomeFeed,
  homeFeedEmptyCopy,
  homeFeedTime,
  selectHomeUpdates,
  type HomeUpdate,
} from "./home-feed.ts";

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

test("首页不把枪、歌单或动画静帧当成动态", () => {
  const feed = readFileSync(new URL("./home-feed.ts", import.meta.url), "utf8");
  const gallery = readFileSync(new URL("../../components/preview/media-gallery.tsx", import.meta.url), "utf8");
  const channelData = readFileSync(new URL("./home-channels.ts", import.meta.url), "utf8");
  const channelView = readFileSync(new URL("../../components/preview/home-channels.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(feed, /playlist|localStorage|mtime|git /);
  assert.match(gallery, /最新动态/);
  assert.match(gallery, /idle-candd-24-still-clear\.webp/);
  assert.doesNotMatch(gallery, /awm\.webp|idle-candd-24\.webp/);
  assert.match(channelView, /Gamepad2/);
  assert.match(channelData, /href: "\/games"/);
  assert.doesNotMatch(channelView, /delta-gun|awm|Crosshair/);
  for (const href of ["/wiki", "/games", "/music", "/stickers", "/about", "/writing"]) {
    assert.match(channelData, new RegExp(href.replaceAll("/", "\\/")));
  }
});
