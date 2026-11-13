import { parseWikiMarkdown, type WikiBullet } from "@/lib/content/wiki-parse";
import type { WikiNote } from "@/lib/content/wiki-store";

import { UNSORTED_GAME_ID, type GameRef } from "./catalog";

export const GAME_KINDS = [
  { id: "guide", label: "攻略" },
  { id: "tip", label: "技巧" },
  { id: "note", label: "知识" },
  { id: "doc", label: "文档" },
] as const;

export type GameKindId = (typeof GAME_KINDS)[number]["id"];
export type GameVisibility = "draft" | "public";

export const GAME_PAGE_SIZE = 12;

export type GameEntry = {
  slug: string;
  gameId: string;
  unresolvedGame: string | null;
  kind: GameKindId | null;
  title: string;
  summary: string;
  prose: string;
  sourceLabel: string | null;
  sourceHref: string | null;
  ingestedAt: string | null;
  updatedAt: string | null;
  season: string;
  tags: string[];
  visibility: GameVisibility;
};

export type GameEntryIndex = Omit<GameEntry, "prose">;

export function gameKindLabel(kind: GameKindId | null): string {
  return GAME_KINDS.find((item) => item.id === kind)?.label ?? "类别未标明";
}

export function isWikiDraft(note: { bullets: readonly WikiBullet[] }): boolean {
  return bulletValue(note.bullets, "状态") === "草稿";
}

export function publicWikiNotes<T extends { bullets: readonly WikiBullet[] }>(notes: readonly T[]): T[] {
  return notes.filter((note) => !isWikiDraft(note));
}

/** 知识库的覆盖入口碰到游戏条目就停下，避免把来源和入库时间写掉。 */
export function wikiIngestConflict(
  existing: { bullets: readonly WikiBullet[] } | null,
  markdown: string
): string | null {
  const incoming = parseWikiMarkdown(markdown, "untitled");
  const claims =
    incoming.bullets.some((bullet) => bullet.label === "游戏") ||
    (existing?.bullets.some((bullet) => bullet.label === "游戏") ?? false);
  if (!claims) return null;
  return "游戏条目要走游戏收录，知识库覆盖不会改它。";
}

function bulletValue(bullets: readonly WikiBullet[], label: string): string {
  return bullets.find((bullet) => bullet.label === label)?.value.trim() ?? "";
}

function splitTags(value: string): string[] {
  return value
    .split(/[、,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function proseAfterSummary(body: string): string {
  const lines = body.split("\n");
  let index = 0;
  while (index < lines.length && lines[index].trim() === "") index += 1;
  const heading = lines[index]?.match(/^##\s+(.+?)\s*$/);
  if (!heading || heading[1].trim() !== "这条讲什么") return body.trim();
  index += 1;
  while (index < lines.length && lines[index].trim() !== "") index += 1;
  while (index < lines.length && lines[index].trim() === "") index += 1;
  return lines.slice(index).join("\n").trim();
}

export function resolveListedGame(
  raw: string,
  games: readonly GameRef[]
): { gameId: string; unresolvedGame: string | null } {
  const value = raw.trim();
  if (value === "" || value === UNSORTED_GAME_ID || value === "未归类") {
    return { gameId: UNSORTED_GAME_ID, unresolvedGame: null };
  }
  if (games.some((game) => game.id === value)) {
    return { gameId: value, unresolvedGame: null };
  }
  return { gameId: UNSORTED_GAME_ID, unresolvedGame: value };
}

/** 没有「游戏」这一行就不是游戏条目。不凭标题猜。 */
export function readGameEntry(note: WikiNote, games: readonly GameRef[]): GameEntry | null {
  const rawGame = bulletValue(note.bullets, "游戏");
  if (!rawGame) return null;
  const placed = resolveListedGame(rawGame, games);
  const kindLabel = bulletValue(note.bullets, "类别");
  const kind = GAME_KINDS.find((item) => item.label === kindLabel)?.id ?? null;
  const season = bulletValue(note.bullets, "版本") || "未知";
  const updated = bulletValue(note.bullets, "更新");
  return {
    slug: note.slug,
    gameId: placed.gameId,
    unresolvedGame: placed.unresolvedGame,
    kind,
    title: note.title,
    summary: note.summary,
    prose: proseAfterSummary(note.body),
    sourceLabel: note.sourceLabel,
    sourceHref: note.sourceHref,
    ingestedAt: note.ingestedAt,
    updatedAt: updated || null,
    season,
    tags: splitTags(bulletValue(note.bullets, "标签")),
    visibility: isWikiDraft(note) ? "draft" : "public",
  };
}

export function toGameIndex(entry: GameEntry): GameEntryIndex {
  const { prose: _prose, ...index } = entry;
  return index;
}

export type GameQuery = {
  q?: string;
  kind?: string;
  page?: number;
};

export function filterGameEntries(
  entries: readonly GameEntryIndex[],
  gameId: string,
  query: GameQuery,
  options: { pageSize?: number; includeDrafts?: boolean } = {}
): {
  entries: GameEntryIndex[];
  total: number;
  page: number;
  pages: number;
  unknownKind: boolean;
} {
  const pageSize = options.pageSize ?? GAME_PAGE_SIZE;
  const kind = query.kind?.trim() ?? "";
  const unknownKind = kind !== "" && !GAME_KINDS.some((item) => item.id === kind);
  const tokens = (query.q ?? "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matched = entries.filter((entry) => {
    if (entry.gameId !== gameId) return false;
    if (!options.includeDrafts && entry.visibility !== "public") return false;
    if (unknownKind) return false;
    if (kind && entry.kind !== kind) return false;
    if (tokens.length === 0) return true;
    const haystack = [entry.title, entry.summary, entry.season, gameKindLabel(entry.kind), ...entry.tags]
      .join("\n")
      .toLowerCase();
    return tokens.every((token) => haystack.includes(token));
  });
  const pages = Math.max(1, Math.ceil(matched.length / pageSize));
  const requested = query.page && query.page > 0 ? Math.floor(query.page) : 1;
  const page = Math.min(requested, pages);
  const start = (page - 1) * pageSize;
  return {
    entries: matched.slice(start, start + pageSize),
    total: matched.length,
    page,
    pages,
    unknownKind,
  };
}

export function gameSpaceHref(gameId: string, query: GameQuery = {}): string {
  const params = new URLSearchParams();
  const q = query.q?.trim();
  if (q) params.set("q", q);
  if (query.kind && GAME_KINDS.some((item) => item.id === query.kind)) params.set("kind", query.kind);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const search = params.toString();
  const base = gameId === UNSORTED_GAME_ID ? "/games/unsorted" : `/games/${gameId}`;
  return search ? `${base}?${search}` : base;
}

export function shanghaiStamp(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return `${pick("year")}-${pick("month")}-${pick("day")} ${pick("hour")}:${pick("minute")} Asia/Shanghai`;
}

export type GameWriteInput = {
  slug?: unknown;
  gameId?: unknown;
  kind?: unknown;
  title?: unknown;
  summary?: unknown;
  body?: unknown;
  sourceLabel?: unknown;
  sourceHref?: unknown;
  tags?: unknown;
  season?: unknown;
  publish?: unknown;
};

export type PreparedGameWrite = {
  slug: string;
  gameId: string;
  kind: GameKindId;
  title: string;
  summary: string;
  body: string;
  sourceLabel: string | null;
  sourceHref: string | null;
  tags: string[];
  season: string;
  publish: boolean | undefined;
};

export type GameWriteFailure = { ok: false; status: number; message: string };

function asText(value: unknown): string | null {
  return typeof value === "string" ? value.trim() : null;
}

function httpsSource(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.username === "" && url.password === "" && !value.includes(" ");
  } catch {
    return false;
  }
}

export function prepareGameWrite(
  input: GameWriteInput,
  games: readonly GameRef[]
): PreparedGameWrite | GameWriteFailure {
  const slug = asText(input.slug);
  if (!slug) return { ok: false, status: 400, message: "缺少 slug" };

  const rawGame = input.gameId;
  let gameId = UNSORTED_GAME_ID;
  if (rawGame !== undefined && rawGame !== null && rawGame !== "") {
    const text = asText(rawGame);
    if (!text) return { ok: false, status: 400, message: "游戏没有写明" };
    const placed = resolveListedGame(text, games);
    if (placed.unresolvedGame) {
      return { ok: false, status: 400, message: "未知游戏，没有归进任何游戏" };
    }
    gameId = placed.gameId;
  }

  const kindText = asText(input.kind);
  const kind = GAME_KINDS.find((item) => item.id === kindText || item.label === kindText);
  if (!kind) return { ok: false, status: 400, message: "类别要是攻略、技巧、知识或文档" };

  const title = asText(input.title);
  if (!title || title.length > 80) return { ok: false, status: 400, message: "标题空着或超过 80 字" };

  const summary = typeof input.summary === "string" ? input.summary.trim() : "";
  if (summary.length > 280) return { ok: false, status: 400, message: "摘要超过 280 字" };

  const body = typeof input.body === "string" ? input.body.replace(/\r\n/g, "\n").trim() : "";
  if (!body || body.length > 100_000) return { ok: false, status: 400, message: "正文空着或超过 100000 字" };
  if (body.includes("\0")) return { ok: false, status: 400, message: "正文含有非法字符" };

  let sourceLabel = asText(input.sourceLabel);
  let sourceHref = asText(input.sourceHref);
  if (sourceHref) {
    if (!httpsSource(sourceHref) || sourceHref.length > 300) {
      return { ok: false, status: 400, message: "原文链接只收 https" };
    }
    if (sourceLabel && (sourceLabel.includes("]") || sourceLabel.includes("\n") || sourceLabel.length > 80)) {
      return { ok: false, status: 400, message: "来源名称不能用" };
    }
  } else if (input.sourceHref !== undefined && input.sourceHref !== null && input.sourceHref !== "") {
    return { ok: false, status: 400, message: "原文链接只收 https" };
  } else {
    sourceHref = null;
  }
  if (sourceLabel && sourceLabel.length > 80) {
    return { ok: false, status: 400, message: "来源名称不能用" };
  }

  const tags: string[] = [];
  const rawTags = Array.isArray(input.tags) ? input.tags : [];
  if (rawTags.length > 8) return { ok: false, status: 400, message: "标签最多 8 个" };
  for (const tag of rawTags) {
    const text = asText(tag);
    if (!text || text.length > 16 || /[、,，\n]/.test(text)) {
      return { ok: false, status: 400, message: "有个标签不能用" };
    }
    if (!tags.includes(text)) tags.push(text);
  }

  const seasonText = asText(input.season);
  const season = seasonText && seasonText.length <= 32 ? seasonText : "未知";
  if (typeof input.season === "string" && input.season.trim().length > 32) {
    return { ok: false, status: 400, message: "版本超过 32 字" };
  }

  let publish: boolean | undefined;
  if (input.publish === undefined) publish = undefined;
  else if (typeof input.publish === "boolean") publish = input.publish;
  else return { ok: false, status: 400, message: "公开要明确写成是或否" };

  return {
    slug,
    gameId,
    kind: kind.id,
    title,
    summary,
    body,
    sourceLabel,
    sourceHref,
    tags,
    season,
    publish,
  };
}

export function renderGameMarkdown(
  entry: PreparedGameWrite & {
    ingestedAt: string | null;
    updatedAt: string | null;
    visibility: GameVisibility;
    sourceLabel: string | null;
    sourceHref: string | null;
  }
): string {
  const lines = [`# ${entry.title}`, ""];
  lines.push(`- 游戏: ${entry.gameId === UNSORTED_GAME_ID ? "未归类" : entry.gameId}`);
  lines.push(`- 类别: ${gameKindLabel(entry.kind)}`);
  if (entry.tags.length > 0) lines.push(`- 标签: ${entry.tags.join("、")}`);
  lines.push(`- 版本: ${entry.season || "未知"}`);
  if (entry.sourceHref) {
    lines.push(`- 原文链接: [${entry.sourceLabel ?? "原文"}](${entry.sourceHref})`);
  } else if (entry.sourceLabel) {
    lines.push(`- 来源: ${entry.sourceLabel}`);
  }
  if (entry.ingestedAt) lines.push(`- 入库: ${entry.ingestedAt}`);
  if (entry.updatedAt) lines.push(`- 更新: ${entry.updatedAt}`);
  lines.push(`- 状态: ${entry.visibility === "draft" ? "草稿" : "公开"}`);
  lines.push("", "## 这条讲什么", "");
  if (entry.summary) lines.push(entry.summary, "");
  lines.push(entry.body.trim(), "");
  return lines.join("\n");
}
