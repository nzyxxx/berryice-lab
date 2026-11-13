import { existsSync } from "node:fs";
import path from "node:path";

import { isWikiSlug } from "./wiki-parse";

const STILL_EXT = [".webp", ".jpg", ".jpeg", ".png", ".gif"] as const;

/** 只认反引号里的图片文件名，用来判断「笔记提过画面，但没有公开原图」。 */
const STILL_MENTION = /`[^`\n]*\.(?:gif|png|jpe?g|webp)[^`\n]*`/i;

const PRIVATE_PATH = /wiki\/(?:inbox|sources)\//;

export function noteMentionsStill(parts: readonly string[]): boolean {
  return parts.some((part) => STILL_MENTION.test(part));
}

export function bulletExposesPrivatePath(value: string): boolean {
  return PRIVATE_PATH.test(value);
}

/**
 * 只在 `public/wiki-covers/<slug>.<ext>` 里找一张静图。
 * 不读收录盘，也不接受笔记正文里的路径。
 */
export function findPublicNoteStill(
  slug: string,
  publicDir = path.join(process.cwd(), "public")
): string | null {
  if (!isWikiSlug(slug)) return null;
  const root = path.resolve(publicDir, "wiki-covers");
  for (const ext of STILL_EXT) {
    const file = path.resolve(root, `${slug}${ext}`);
    const relative = path.relative(root, file);
    if (relative.startsWith("..") || path.isAbsolute(relative)) continue;
    if (!existsSync(file)) continue;
    return `/wiki-covers/${slug}${ext}`;
  }
  return null;
}
