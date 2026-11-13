import { mkdir, open, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";

import { isWikiSlug, resolveWikiFile } from "@/lib/content/wiki-parse";
import {
  WikiStoreError,
  listWikiNotes,
  readWikiNote,
  wikiContentDir,
  writeWikiNote,
} from "@/lib/content/wiki-store";

import type { GameRef } from "./catalog";
import {
  prepareGameWrite,
  readGameEntry,
  renderGameMarkdown,
  sameSourceHref,
  shanghaiStamp,
  toGameIndex,
  type GameEntry,
  type GameEntryIndex,
  type GameVisibility,
  type GameWriteFailure,
  type GameWriteInput,
} from "./knowledge";

export type GameSaveResult =
  | {
      ok: true;
      slug: string;
      gameId: string;
      created: boolean;
      updated: boolean;
      visibility: GameVisibility;
    }
  | GameWriteFailure;

async function withWriteLock<T>(directory: string, run: () => Promise<T>): Promise<T> {
  await mkdir(directory, { recursive: true });
  const lockPath = path.join(directory, ".game-write.lock");
  const deadline = Date.now() + 2_000;
  let handle: Awaited<ReturnType<typeof open>> | null = null;
  while (!handle) {
    try {
      handle = await open(lockPath, "wx");
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error ? (error as { code?: string }).code : "";
      if (code !== "EEXIST") throw error;
      try {
        const info = await stat(lockPath);
        if (Date.now() - info.mtimeMs > 10_000) await rm(lockPath, { force: true });
      } catch {
        // 锁刚被拿走。
      }
      if (Date.now() > deadline) {
        throw new WikiStoreError("io", "正在写入，过一会儿再试");
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }
  try {
    return await run();
  } finally {
    await handle.close();
    await rm(lockPath, { force: true });
  }
}

function normalize(markdown: string): string {
  const text = markdown.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return text.endsWith("\n") ? text : `${text}\n`;
}

async function readRaw(directory: string, slug: string): Promise<string | null> {
  try {
    return await readFile(resolveWikiFile(directory, slug), "utf8");
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "ENOENT"
    ) {
      return null;
    }
    throw error;
  }
}

export async function listGameEntries(directory: string, games: readonly GameRef[]): Promise<GameEntry[]> {
  const notes = await listWikiNotes(directory);
  const entries: GameEntry[] = [];
  for (const note of notes) {
    const entry = readGameEntry(note, games);
    if (entry) entries.push(entry);
  }
  entries.sort((left, right) => {
    const leftKey = left.updatedAt ?? left.ingestedAt ?? "";
    const rightKey = right.updatedAt ?? right.ingestedAt ?? "";
    if (leftKey !== rightKey) return rightKey.localeCompare(leftKey);
    return right.slug.localeCompare(left.slug);
  });
  return entries;
}

export async function listGameIndex(
  directory: string | undefined,
  games: readonly GameRef[]
): Promise<GameEntryIndex[]> {
  const entries = await listGameEntries(directory ?? wikiContentDir(), games);
  return entries.map(toGameIndex);
}

export async function saveGameKnowledge(
  input: GameWriteInput,
  options: { directory?: string; games: readonly GameRef[]; now: Date }
): Promise<GameSaveResult> {
  const prepared = prepareGameWrite(input, options.games);
  if ("ok" in prepared) return prepared;
  if (!isWikiSlug(prepared.slug)) {
    return { ok: false, status: 400, message: "slug 不能用" };
  }

  const directory = options.directory ?? wikiContentDir();
  try {
    return await withWriteLock(directory, () => writePrepared(prepared, directory, options.games, options.now));
  } catch (error) {
    if (error instanceof WikiStoreError) {
      const status = error.code === "too-large" ? 413 : error.code === "io" ? 500 : 400;
      return { ok: false, status, message: error.message };
    }
    throw error;
  }
}

async function writePrepared(
  prepared: Exclude<Awaited<ReturnType<typeof prepareGameWrite>>, GameWriteFailure>,
  directory: string,
  games: readonly GameRef[],
  now: Date
): Promise<GameSaveResult> {
  let notes: Awaited<ReturnType<typeof listWikiNotes>>;
  try {
    notes = await listWikiNotes(directory);
  } catch (error) {
    console.error("game knowledge read failed:", error instanceof Error ? error.message : error);
    return { ok: false, status: 500, message: "没有读出来" };
  }

  const existingNote = notes.find((note) => note.slug === prepared.slug) ?? null;
  if (existingNote && !readGameEntry(existingNote, games)) {
    return { ok: false, status: 409, message: "这篇已经是知识库笔记，没有改成游戏条目" };
  }
  const existing = existingNote ? readGameEntry(existingNote, games) : null;
  if (existing && existing.gameId !== prepared.gameId) {
    return { ok: false, status: 409, message: "这篇属于另一款游戏，没有挪走" };
  }
  if (existing?.unresolvedGame) {
    return { ok: false, status: 409, message: "这篇的游戏对不上，没有改写" };
  }

  const sourceMatches =
    existing?.sourceHref && prepared.sourceHref
      ? sameSourceHref(existing.sourceHref, prepared.sourceHref)
      : false;
  if (existing?.sourceHref && prepared.sourceHref && !sourceMatches) {
    return { ok: false, status: 409, message: "原文链接还是原来的，没有换掉" };
  }
  if (existing?.sourceLabel && prepared.sourceLabel && prepared.sourceLabel !== existing.sourceLabel) {
    return { ok: false, status: 409, message: "来源名称还是原来的，没有换掉" };
  }
  const sourceHref = sourceMatches ? existing?.sourceHref ?? null : (prepared.sourceHref ?? existing?.sourceHref ?? null);
  const sourceLabel = prepared.sourceLabel ?? existing?.sourceLabel ?? null;

  if (sourceHref) {
    const duplicate = notes.find((note) => {
      if (note.slug === prepared.slug) return false;
      return sameSourceHref(note.sourceHref, sourceHref);
    });
    if (duplicate) {
      return { ok: false, status: 409, message: "这个原文链接已经收过，没有再记一条" };
    }
  }

  const visibility: GameVisibility =
    prepared.publish === undefined ? (existing?.visibility ?? "draft") : prepared.publish ? "public" : "draft";
  const ingestedAt = existing?.ingestedAt ?? shanghaiStamp(now);
  const draft = {
    ...prepared,
    sourceHref,
    sourceLabel,
    visibility,
    ingestedAt,
    updatedAt: existing?.updatedAt ?? null,
  };
  const unchanged = renderGameMarkdown(draft);
  const next = existing
    ? renderGameMarkdown({ ...draft, updatedAt: shanghaiStamp(now) })
    : unchanged;
  const markdown = normalize(existing ? next : unchanged);

  let raw: string | null = null;
  try {
    raw = await readRaw(directory, prepared.slug);
  } catch {
    return { ok: false, status: 500, message: "没有读出来" };
  }
  if (raw !== null && normalize(raw) === (existing ? normalize(unchanged) : markdown)) {
    return {
      ok: true,
      slug: prepared.slug,
      gameId: prepared.gameId,
      created: false,
      updated: false,
      visibility,
    };
  }

  try {
    const written = await writeWikiNote(prepared.slug, existing ? next : unchanged, directory);
    const saved = await readWikiNote(prepared.slug, directory);
    const entry = saved ? readGameEntry(saved, games) : null;
    if (!entry || entry.gameId !== prepared.gameId) {
      return { ok: false, status: 500, message: "写入之后对不上" };
    }
    return {
      ok: true,
      slug: prepared.slug,
      gameId: entry.gameId,
      created: written.created,
      updated: existing !== null,
      visibility: entry.visibility,
    };
  } catch (error) {
    if (error instanceof WikiStoreError) {
      const status = error.code === "too-large" ? 413 : error.code === "io" ? 500 : 400;
      return { ok: false, status, message: error.message };
    }
    console.error("game knowledge write failed:", error instanceof Error ? error.message : error);
    return { ok: false, status: 500, message: "写入失败" };
  }
}
