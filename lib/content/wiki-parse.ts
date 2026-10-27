import path from "node:path";

/**
 * 知识库笔记的纯解析。
 * 样本是「H1 + 项目符号元数据 + ## 这条讲什么」，不是严格 YAML frontmatter。
 * 缺哪一段就留空，不补假摘要、假作者。
 */

const SLUG_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/;
const SUMMARY_HEADING = "这条讲什么";
/** `POST /api/wiki/ingest` 占了这个路径，同名笔记删不掉。 */
const RESERVED_SLUGS = new Set(["ingest"]);

export function isWikiSlug(slug: string): boolean {
  if (!SLUG_PATTERN.test(slug)) return false;
  if (slug.includes("..")) return false;
  if (slug.startsWith(".") || slug.endsWith(".")) return false;
  if (RESERVED_SLUGS.has(slug)) return false;
  return true;
}

/** 把 slug 收成知识库目录里的一个 .md 路径。拒绝跳出目录。 */
export function resolveWikiFile(root: string, slug: string): string {
  if (!isWikiSlug(slug)) {
    throw new Error("invalid-slug");
  }
  const base = path.resolve(root);
  const file = path.resolve(base, `${slug}.md`);
  const relative = path.relative(base, file);
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("invalid-slug");
  }
  return file;
}

export type WikiLink = { label: string; href: string };

export type WikiBullet = {
  label: string;
  value: string;
  links: WikiLink[];
};

export type ParsedWiki = {
  title: string;
  summary: string;
  author: string | null;
  sourceLabel: string | null;
  sourceHref: string | null;
  ingestedAt: string | null;
  /** 用来排序的 `YYYY-MM-DD HH:mm`，解析不到就是 null */
  ingestedSort: string | null;
  bullets: WikiBullet[];
  /** H1 和开头的元数据列表之后的正文 */
  body: string;
};

export function plainWikiText(value: string): string {
  return value
    .replace(/\[([^\]]+)\]\([^)\s]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1$2")
    .replace(/\s+/g, " ")
    .trim();
}

function extractLinks(value: string): WikiLink[] {
  const links: WikiLink[] = [];
  const pattern = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(value))) {
    links.push({ label: match[1].trim(), href: match[2].trim() });
  }
  return links;
}

function parseBullets(lines: string[]): WikiBullet[] {
  const bullets: WikiBullet[] = [];
  for (const line of lines) {
    const top = line.match(/^- (.+)$/);
    if (top) {
      const raw = top[1].trim();
      const fields = raw.match(/^([^:：]{1,40})[:：]\s*(.*)$/);
      const label = fields ? fields[1].trim() : "备注";
      const value = fields ? fields[2].trim() : raw;
      bullets.push({ label, value, links: extractLinks(value) });
      continue;
    }
    const nested = line.match(/^\s+- (.+)$/);
    if (nested && bullets.length > 0) {
      const piece = nested[1].trim();
      const last = bullets[bullets.length - 1];
      last.value = last.value ? `${last.value}\n${piece}` : piece;
      last.links.push(...extractLinks(piece));
    }
  }
  return bullets;
}

function firstParagraph(lines: string[]): string {
  const parts: string[] = [];
  let started = false;
  for (const line of lines) {
    if (line.trim() === "") {
      if (started) break;
      continue;
    }
    if (/^#{1,6}\s+/.test(line.trim())) break;
    started = true;
    parts.push(line.trim());
  }
  return plainWikiText(parts.join(" "));
}

function extractSummary(body: string): string {
  const lines = body.split("\n");
  let start = -1;
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].match(/^##\s+(.+?)\s*$/);
    if (heading && heading[1].trim() === SUMMARY_HEADING) {
      start = index + 1;
      break;
    }
  }
  if (start === -1) return "";
  const chunk: string[] = [];
  for (let index = start; index < lines.length; index += 1) {
    if (/^#{1,2}\s+/.test(lines[index])) break;
    chunk.push(lines[index]);
  }
  return firstParagraph(chunk);
}

function bulletByLabel(bullets: WikiBullet[], label: string): WikiBullet | undefined {
  return bullets.find((bullet) => bullet.label === label);
}

export function parseWikiMarkdown(markdown: string, fallbackTitle: string): ParsedWiki {
  const text = markdown.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = text.split("\n");

  let index = 0;
  while (index < lines.length && lines[index].trim() === "") index += 1;

  let title = fallbackTitle;
  if (index < lines.length && /^#\s+/.test(lines[index]) && !/^##/.test(lines[index])) {
    title = lines[index].replace(/^#\s+/, "").trim() || fallbackTitle;
    index += 1;
  }

  while (index < lines.length && lines[index].trim() === "") index += 1;

  const bulletLines: string[] = [];
  while (index < lines.length) {
    const line = lines[index];
    if (/^\s*-\s+/.test(line)) {
      bulletLines.push(line);
      index += 1;
      continue;
    }
    break;
  }

  const bullets = parseBullets(bulletLines);
  while (index < lines.length && lines[index].trim() === "") index += 1;
  const body = lines.slice(index).join("\n").trim();

  const authorBullet = bulletByLabel(bullets, "作者");
  const author = authorBullet ? plainWikiText(authorBullet.value) || null : null;

  const sourceBullet = bulletByLabel(bullets, "原文链接") ?? bulletByLabel(bullets, "来源");
  let sourceLabel: string | null = null;
  let sourceHref: string | null = null;
  if (sourceBullet) {
    if (sourceBullet.links[0]) {
      sourceLabel = plainWikiText(sourceBullet.links[0].label) || null;
      sourceHref = sourceBullet.links[0].href;
    } else {
      sourceLabel = plainWikiText(sourceBullet.value) || null;
    }
  }

  const ingestedBullet = bulletByLabel(bullets, "入库");
  const ingestedAt = ingestedBullet ? plainWikiText(ingestedBullet.value) || null : null;
  const ingestedSort =
    ingestedAt?.match(/\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/)?.[0].replace("T", " ") ?? null;

  return {
    title,
    summary: extractSummary(body),
    author,
    sourceLabel,
    sourceHref,
    ingestedAt,
    ingestedSort,
    bullets,
    body,
  };
}
