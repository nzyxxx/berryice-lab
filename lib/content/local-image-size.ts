import { readFileSync } from "node:fs";
import path from "node:path";

import { safeWikiImageSrc } from "./wiki-markdown";

const cache = new Map<string, { width: number; height: number } | null>();

function jpegSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let index = 2;
  while (index + 8 < buf.length) {
    if (buf[index] !== 0xff) return null;
    const marker = buf[index + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      index += 2;
      continue;
    }
    const length = buf.readUInt16BE(index + 2);
    if (length < 2 || index + 2 + length > buf.length) return null;
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      return { height: buf.readUInt16BE(index + 5), width: buf.readUInt16BE(index + 7) };
    }
    index += 2 + length;
  }
  return null;
}

function pngSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 24 || buf.toString("ascii", 1, 4) !== "PNG") return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function gifSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 10 || buf.toString("ascii", 0, 3) !== "GIF") return null;
  return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
}

function webpSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 30 || buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") {
    return null;
  }
  const format = buf.toString("ascii", 12, 16);
  if (format === "VP8X" && buf.length >= 30) {
    return {
      width: 1 + buf.readUIntLE(24, 3),
      height: 1 + buf.readUIntLE(27, 3),
    };
  }
  if (format === "VP8 " && buf.length >= 30) {
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  }
  if (format === "VP8L" && buf.length >= 25 && buf[20] === 0x2f) {
    const bits = buf.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
}

/** 只读 public 里的站内图，用来给块级图写上真实宽高。读不到就空着，不猜。 */
export function localImageSize(src: string): { width: number; height: number } | null {
  if (cache.has(src)) return cache.get(src) ?? null;
  const safe = safeWikiImageSrc(src);
  const root = path.resolve(process.cwd(), "public");
  if (!safe) {
    cache.set(src, null);
    return null;
  }
  const file = path.resolve(root, safe.slice(1));
  if (file !== root && !file.startsWith(`${root}${path.sep}`)) {
    cache.set(src, null);
    return null;
  }
  let size: { width: number; height: number } | null = null;
  try {
    const buf = readFileSync(file);
    size = jpegSize(buf) ?? pngSize(buf) ?? gifSize(buf) ?? webpSize(buf);
  } catch {
    size = null;
  }
  cache.set(src, size);
  return size;
}
