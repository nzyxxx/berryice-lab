import { lstat, mkdir, open, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { parseWikiMarkdown, resolveWikiFile, type ParsedWiki } from "./wiki-parse";

/** 单篇上限。2GB 的机器上不能因为一篇笔记把堆撑满。 */
export const WIKI_MARKDOWN_MAX_CHARS = 200_000;

export class WikiStoreError extends Error {
  /** 写在类体上。构造参数上的 `readonly` 会让单测的类型剥离直接失败。 */
  readonly code: "invalid-slug" | "too-large" | "empty" | "io";

  constructor(code: "invalid-slug" | "too-large" | "empty" | "io", message: string) {
    super(message);
    this.name = "WikiStoreError";
    this.code = code;
  }
}

export type WikiNote = ParsedWiki & { slug: string };

/**
 * 笔记目录。默认仓库里的 `content/wiki`。
 * 线上若不想让 `git pull` 碰这些文件，把 `WIKI_CONTENT_DIR` 指到仓库外面。
 */
export function wikiContentDir(): string {
  const configured = process.env.WIKI_CONTENT_DIR?.trim();
  if (configured) return path.resolve(configured);
  return path.join(process.cwd(), "content", "wiki");
}

function isEnoent(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ENOENT"
  );
}

function notePath(slug: string): string {
  try {
    return resolveWikiFile(wikiContentDir(), slug);
  } catch {
    throw new WikiStoreError("invalid-slug", "slug 只能是字母、数字、点、下划线和连字符");
  }
}

async function readNoteFile(file: string): Promise<string | null> {
  let info;
  try {
    info = await lstat(/*turbopackIgnore: true*/ file);
  } catch (error) {
    if (isEnoent(error)) return null;
    throw error;
  }
  if (info.isSymbolicLink() || !info.isFile()) return null;

  const length = Math.min(info.size, WIKI_MARKDOWN_MAX_CHARS + 1);
  const handle = await open(/*turbopackIgnore: true*/ file, "r");
  try {
    const buffer = Buffer.alloc(length);
    const { bytesRead } =
      length > 0 ? await handle.read(buffer, 0, length, 0) : { bytesRead: 0 };
    return buffer.subarray(0, bytesRead).toString("utf8");
  } finally {
    await handle.close();
  }
}

export async function readWikiNote(slug: string): Promise<WikiNote | null> {
  let file: string;
  try {
    file = notePath(slug);
  } catch {
    return null;
  }
  const raw = await readNoteFile(file);
  if (raw === null) return null;
  return { slug, ...parseWikiMarkdown(raw, slug) };
}

export async function listWikiNotes(): Promise<WikiNote[]> {
  let names: string[];
  try {
    // 目录可能来自 WIKI_CONTENT_DIR。不忽略的话，构建会把整个仓库算进 server 追踪。
    names = await readdir(/*turbopackIgnore: true*/ wikiContentDir());
  } catch (error) {
    if (isEnoent(error)) return [];
    throw error;
  }

  const notes: WikiNote[] = [];
  for (const name of names) {
    if (!name.endsWith(".md") || name.startsWith(".")) continue;
    const note = await readWikiNote(name.slice(0, -".md".length));
    if (note) notes.push(note);
  }

  notes.sort((left, right) => {
    const leftKey = left.ingestedSort ?? "";
    const rightKey = right.ingestedSort ?? "";
    if (leftKey !== rightKey) return rightKey.localeCompare(leftKey);
    return right.slug.localeCompare(left.slug);
  });
  return notes;
}

export async function writeWikiNote(
  slug: string,
  markdown: string
): Promise<{ created: boolean; title: string }> {
  const normalized = markdown.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (normalized.includes("\0")) {
    throw new WikiStoreError("empty", "正文含有非法字符");
  }
  if (normalized.trim().length === 0) {
    throw new WikiStoreError("empty", "正文是空的");
  }
  if (normalized.length > WIKI_MARKDOWN_MAX_CHARS) {
    throw new WikiStoreError("too-large", "正文超过 200000 字");
  }

  const root = wikiContentDir();
  const target = notePath(slug);
  await mkdir(/*turbopackIgnore: true*/ root, { recursive: true });

  const existing = await readNoteFile(target);
  const body = normalized.endsWith("\n") ? normalized : `${normalized}\n`;
  const temporary = path.join(root, `.${slug}.${process.pid}.${Date.now()}.tmp`);
  try {
    await writeFile(/*turbopackIgnore: true*/ temporary, body, { encoding: "utf8", flag: "wx" });
    await rename(/*turbopackIgnore: true*/ temporary, target);
  } catch (error) {
    await rm(/*turbopackIgnore: true*/ temporary, { force: true }).catch(() => undefined);
    if (error instanceof WikiStoreError) throw error;
    console.error("wiki write failed:", error instanceof Error ? error.message : error);
    throw new WikiStoreError("io", "写入失败");
  }

  const parsed = parseWikiMarkdown(body, slug);
  return { created: existing === null, title: parsed.title };
}

/** 删掉磁盘上的 md。第二次再删同一篇返回 deleted:false，不报错。 */
export async function deleteWikiNote(slug: string): Promise<{ deleted: boolean }> {
  const target = notePath(slug);
  try {
    await rm(/*turbopackIgnore: true*/ target);
    return { deleted: true };
  } catch (error) {
    if (isEnoent(error)) return { deleted: false };
    console.error("wiki delete failed:", error instanceof Error ? error.message : error);
    throw new WikiStoreError("io", "删除失败");
  }
}
