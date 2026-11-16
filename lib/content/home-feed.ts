import { homeNoteLine } from "@/lib/content/home-note";
import type { WikiNote } from "@/lib/content/wiki-store";
import type { Article } from "@/lib/content/writing";
import { UNSORTED_GAME_ID, type GameRef } from "@/lib/games/catalog";
import { noteIsPublic, readGameEntry } from "@/lib/games/knowledge";

/**
 * 首页「最新动态」。
 *
 * 时间只用内容自己写下的更新、入库或发布时间。
 * 没有这些字段就是没记时间，不用文件修改时间，也不用 git。
 * 歌单只在浏览器里，随记没有单条地址，都不进这里。
 */

export const HOME_FEED_LIMIT = 8;

export const HOME_FEED_KINDS = ["game", "wiki", "writing"] as const;

export type HomeUpdateKind = (typeof HOME_FEED_KINDS)[number];

export type HomeFeedFilter = "all" | HomeUpdateKind;

export type HomeUpdate = {
  /** `种类:稳定键`。同一键只留一条，时间更晚的覆盖更早的。 */
  id: string;
  kind: HomeUpdateKind;
  sourceLabel: string;
  title: string;
  summary: string;
  href: string;
  /** `YYYY-MM-DD HH:mm`。只有日期时补 `00:00`，用来排序，不拿去显示钟点。 */
  at: string | null;
};

export const HOME_FEED_FILTERS: { id: HomeFeedFilter; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "wiki", label: "知识库" },
  { id: "game", label: "游戏知识" },
  { id: "writing", label: "写作" },
];

const KIND_RANK: Record<HomeUpdateKind, number> = {
  game: 0,
  wiki: 1,
  writing: 2,
};

const PRIVATE_TEXT = /wiki\/inbox|wiki\/sources|WIKI_ADMIN|Bearer /;

export function homeFeedTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = value.match(/(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!match) return null;
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4] ?? "0");
  const minute = Number(match[5] ?? "0");
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;
  const hh = (match[4] ?? "00").padStart(2, "0");
  const mm = (match[5] ?? "00").padStart(2, "0");
  return `${match[1]}-${match[2]}-${match[3]} ${hh}:${mm}`;
}

export function homeFeedDateLabel(at: string | null): string {
  return at ? at.slice(0, 10) : "时间未记";
}

export function homeFeedEmptyCopy(filter: HomeFeedFilter): string {
  if (filter === "wiki") return "知识库还没有公开笔记。";
  if (filter === "game") return "还没有公开的游戏知识。";
  if (filter === "writing") return "写作还没有公开文章。";
  return "还没有公开更新。";
}

export function homeFeedMoreHref(filter: HomeFeedFilter): string | null {
  if (filter === "wiki") return "/wiki";
  if (filter === "game") return "/games";
  if (filter === "writing") return "/writing";
  return null;
}

function leaks(value: string): boolean {
  return PRIVATE_TEXT.test(value);
}

function isPublicHref(href: string): boolean {
  if (href.startsWith("/") && !href.startsWith("//")) return true;
  try {
    return new URL(href).protocol === "https:";
  } catch {
    return false;
  }
}

function bulletValue(note: WikiNote, label: string): string {
  return note.bullets.find((bullet) => bullet.label === label)?.value.trim() ?? "";
}

function compareUpdates(left: HomeUpdate, right: HomeUpdate): number {
  if (left.at !== right.at) {
    if (left.at === null) return 1;
    if (right.at === null) return -1;
    return left.at < right.at ? 1 : -1;
  }
  const rank = KIND_RANK[left.kind] - KIND_RANK[right.kind];
  if (rank !== 0) return rank;
  if (left.id < right.id) return -1;
  if (left.id > right.id) return 1;
  return 0;
}

function keepLatest(items: HomeUpdate[]): HomeUpdate[] {
  const byId = new Map<string, HomeUpdate>();
  for (const item of items) {
    const previous = byId.get(item.id);
    if (!previous || (item.at !== null && (previous.at === null || item.at > previous.at))) {
      byId.set(item.id, item);
    }
  }
  return [...byId.values()].sort(compareUpdates);
}

export function assembleHomeFeed(input: {
  notes: readonly WikiNote[];
  games: readonly GameRef[];
  articles?: readonly Article[];
}): HomeUpdate[] {
  const items: HomeUpdate[] = [];

  for (const note of input.notes) {
    if (!note.slug || !note.title.trim() || leaks(note.title)) continue;
    const game = readGameEntry(note, input.games);
    if (game) {
      if (game.visibility !== "public" || leaks(game.title)) continue;
      const href = `/games/${encodeURIComponent(game.gameId === UNSORTED_GAME_ID ? UNSORTED_GAME_ID : game.gameId)}/${encodeURIComponent(note.slug)}`;
      items.push({
        id: `game:${note.slug}`,
        kind: "game",
        sourceLabel: "游戏知识",
        title: game.title.trim(),
        summary: leaks(game.summary) ? "" : homeNoteLine(game.summary),
        href,
        at: homeFeedTime(game.updatedAt) ?? homeFeedTime(game.ingestedAt) ?? homeFeedTime(note.ingestedSort),
      });
      continue;
    }
    if (!noteIsPublic(note)) continue;
    const summary = leaks(note.summary) ? "" : homeNoteLine(note.summary);
    items.push({
      id: `wiki:${note.slug}`,
      kind: "wiki",
      sourceLabel: "知识库",
      title: note.title.trim(),
      summary,
      href: `/wiki/${encodeURIComponent(note.slug)}`,
      at: homeFeedTime(bulletValue(note, "更新")) ?? homeFeedTime(note.ingestedSort) ?? homeFeedTime(note.ingestedAt),
    });
  }

  for (const article of input.articles ?? []) {
    if (!article.id || !article.title.trim() || !isPublicHref(article.href)) continue;
    if (leaks(article.title) || leaks(article.href)) continue;
    items.push({
      id: `writing:${article.id}`,
      kind: "writing",
      sourceLabel: "写作",
      title: article.title.trim(),
      summary: leaks(article.summary) ? "" : homeNoteLine(article.summary),
      href: article.href,
      at: homeFeedTime(article.publishedAt),
    });
  }

  return keepLatest(items);
}

export function selectHomeUpdates(
  items: readonly HomeUpdate[],
  filter: HomeFeedFilter,
  limit = HOME_FEED_LIMIT
): { items: HomeUpdate[]; hidden: number } {
  const matched = filter === "all" ? items : items.filter((item) => item.kind === filter);
  return {
    items: matched.slice(0, limit),
    hidden: Math.max(0, matched.length - limit),
  };
}
