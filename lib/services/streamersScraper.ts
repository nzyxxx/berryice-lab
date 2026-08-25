import * as cheerio from "cheerio";
import type { Element } from "domhandler";

import { normalizeGameMode } from "@/lib/delta-gun/game-modes";
import {
  ensureStreamerTables,
  pruneStreamerLoadouts,
  upsertStreamerLoadouts,
  upsertStreamers,
} from "@/lib/repositories/streamersRepo";
import type {
  StreamerLoadoutRecord,
  StreamerPlatform,
  StreamerRecord,
  StreamerSyncSummary,
} from "@/lib/types/streamer";

const SOURCE_ORIGIN = "https://www.yunmaku.com";
const SOURCE_NAME = "yunmaku.com";
const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "zh-CN,zh;q=0.9",
};
/** 对方是小站，控制并发并留出间隔，避免把人打挂 */
const DETAIL_CONCURRENCY = 4;
const BATCH_DELAY_MS = 250;
const MAX_INDEX_PAGES = 10;
const VALUE_BADGE = /^[\d.]+\s*[wW万kK]$/;
const MODE_SEGMENT = /^(烽火地带|全面战场|大战场|烽火)$/;

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, { headers: FETCH_HEADERS, next: { revalidate: 0 } });
  if (!response.ok) {
    throw new Error(`抓取失败 ${url}: HTTP ${response.status} ${response.statusText}`);
  }
  return response.text();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function mapInBatches<T, R>(
  items: T[],
  batchSize: number,
  mapper: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    results.push(...(await Promise.all(batch.map(mapper))));
    if (i + batchSize < items.length) await sleep(BATCH_DELAY_MS);
  }
  return results;
}

function textOf($el: cheerio.Cheerio<Element>): string {
  return $el.text().replace(/\s+/g, " ").trim();
}

function detectPlatform(roles: string[]): StreamerPlatform {
  return roles.some((role) => role.includes("手游")) ? "mobile" : "pc";
}

function parseCount(raw: string): number {
  const digits = raw.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

/** 列表页一张主播卡 */
function parseStreamerCard($: cheerio.CheerioAPI, anchor: Element): StreamerRecord | null {
  const $anchor = $(anchor);
  const href = $anchor.attr("href") ?? "";
  const slugRaw = href.split("slug=")[1];
  if (!slugRaw) return null;

  let slug: string;
  try {
    slug = decodeURIComponent(slugRaw);
  } catch {
    slug = slugRaw;
  }
  if (!slug) return null;

  const $card = $anchor.closest("div.group");
  const scope = $card.length > 0 ? $card : $anchor.parent();

  const name = textOf(scope.find("h3").first());
  if (!name) return null;

  const roles = scope
    .find("span.player-tag")
    .map((_, el) => textOf($(el)))
    .get()
    .filter(Boolean);

  const $avatar = scope.find('div[style*="background:"]').first();
  const accentColor = ($avatar.attr("style") ?? "").match(/background:\s*(#[0-9a-fA-F]{3,8})/)?.[1];

  return {
    slug,
    name,
    roles,
    signatureWeapon: textOf(scope.find("span.truncate").first()),
    bio: textOf(scope.find("p.line-clamp-2").first()),
    platform: detectPlatform(roles),
    accentColor: accentColor ?? "#38bdf8",
    avatarInitial: textOf($avatar).slice(0, 2) || name.slice(0, 1),
    loadoutCount: 0,
    source: SOURCE_NAME,
  };
}

function parseStreamerIndex(html: string): StreamerRecord[] {
  const $ = cheerio.load(html);
  const records: StreamerRecord[] = [];

  $('a[href^="player.php?slug="]').each((_, anchor) => {
    const record = parseStreamerCard($, anchor);
    if (record) records.push(record);
  });

  return records;
}

function parseTotalIndexPages(html: string): number {
  const pages = [...html.matchAll(/index\.php\?p_page=(\d+)/g)]
    .map((match) => Number(match[1]))
    .filter((page) => Number.isInteger(page) && page > 0);
  const max = pages.length > 0 ? Math.max(...pages) : 1;
  return Math.min(max, MAX_INDEX_PAGES);
}

/**
 * 徽章行的语义靠内容判断，不靠位置：
 * 含「烽火 / 战场」是模式，形如「37w」是价值，剩下第一个才是武器名。
 */
function classifyBadges(badges: string[]): { weapon: string; game: string; valueText: string } {
  let weapon = "";
  let game = "";
  let valueText = "";

  for (const badge of badges) {
    if (!badge) continue;
    if (!game && /烽火|战场/.test(badge)) {
      game = badge;
      continue;
    }
    if (!valueText && VALUE_BADGE.test(badge)) {
      valueText = badge;
      continue;
    }
    if (!weapon) weapon = badge;
  }

  return { weapon, game, valueText };
}

/**
 * 枪码可能是「武器-模式-码」或裸码两种形态。
 * 武器名自带连字符（FS-12、SR-25、AR-57），所以只能以模式段为锚点切，不能按下标切。
 */
function splitFullCode(raw: string): { weapon?: string; game?: string; code: string } {
  const parts = raw.split("-");
  const modeIndex = parts.findIndex((part) => MODE_SEGMENT.test(part.trim()));
  if (modeIndex > 0 && modeIndex < parts.length - 1) {
    return {
      weapon: parts.slice(0, modeIndex).join("-").trim(),
      game: parts[modeIndex].trim(),
      code: parts.slice(modeIndex + 1).join("-").trim(),
    };
  }
  return { code: raw.trim() };
}

function parseStreamerLoadouts(html: string, slug: string): StreamerLoadoutRecord[] {
  const $ = cheerio.load(html);
  const records: StreamerLoadoutRecord[] = [];

  $('code[id^="code-"]').each((_, el) => {
    const $code = $(el);
    const remoteId = Number($code.attr("id")?.replace("code-", ""));
    if (!Number.isInteger(remoteId) || remoteId <= 0) return;

    const rawCode = $code.text().replace(/\s+/g, "").trim();
    if (!rawCode) return;

    const $card = $code.closest("div.group");
    const scope = $card.length > 0 ? $card : $code.parent();

    const badges = scope
      .find("span.inline-flex")
      .map((_, badge) => textOf($(badge)))
      .get();
    const classified = classifyBadges(badges);
    const parsed = splitFullCode(rawCode);

    const weapon = parsed.weapon || classified.weapon;
    if (!weapon) return;

    const gameRaw = parsed.game || classified.game || "";

    records.push({
      remoteId,
      streamerSlug: slug,
      title: textOf(scope.find("h3").first()),
      weapon,
      game: normalizeGameMode(gameRaw),
      fullCode: parsed.code || rawCode,
      valueText: classified.valueText,
      copyCount: parseCount(textOf(scope.find('span[id^="copycnt-"]').first())),
      source: SOURCE_NAME,
    });
  });

  return records;
}

export async function scrapeStreamers(): Promise<StreamerSyncSummary> {
  const firstPage = await fetchHtml(`${SOURCE_ORIGIN}/index.php?p_page=1`);
  const totalPages = parseTotalIndexPages(firstPage);

  const bySlug = new Map<string, StreamerRecord>();
  for (const record of parseStreamerIndex(firstPage)) {
    bySlug.set(record.slug, record);
  }

  for (let page = 2; page <= totalPages; page += 1) {
    try {
      const html = await fetchHtml(`${SOURCE_ORIGIN}/index.php?p_page=${page}`);
      for (const record of parseStreamerIndex(html)) {
        bySlug.set(record.slug, record);
      }
    } catch (error) {
      console.warn(`跳过主播列表第 ${page} 页:`, error instanceof Error ? error.message : error);
    }
    await sleep(BATCH_DELAY_MS);
  }

  const streamers = [...bySlug.values()];
  if (streamers.length === 0) {
    throw new Error("解析到 0 位主播，yunmaku 页面结构可能已变更");
  }

  let skipped = 0;

  const loadoutsByStreamer = await mapInBatches(streamers, DETAIL_CONCURRENCY, async (streamer) => {
    const url = `${SOURCE_ORIGIN}/player.php?slug=${encodeURIComponent(streamer.slug)}`;
    try {
      const html = await fetchHtml(url);
      return parseStreamerLoadouts(html, streamer.slug);
    } catch (error) {
      skipped += 1;
      console.warn(`跳过主播 ${streamer.slug}:`, error instanceof Error ? error.message : error);
      return [] as StreamerLoadoutRecord[];
    }
  });

  const allLoadouts: StreamerLoadoutRecord[] = [];
  loadoutsByStreamer.forEach((loadouts, index) => {
    streamers[index].loadoutCount = loadouts.length;
    allLoadouts.push(...loadouts);
  });

  await ensureStreamerTables();
  await upsertStreamers(streamers);
  await upsertStreamerLoadouts(allLoadouts);

  for (let i = 0; i < streamers.length; i += 1) {
    const remoteIds = loadoutsByStreamer[i].map((item) => item.remoteId);
    await pruneStreamerLoadouts(streamers[i].slug, remoteIds);
  }

  return { streamers: streamers.length, loadouts: allLoadouts.length, skipped };
}
