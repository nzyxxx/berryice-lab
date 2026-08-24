import * as cheerio from "cheerio";
import type { Element } from "domhandler";

import { ensureGunCodesTable, upsertGunCodes } from "@/lib/repositories/gunCodesRepo";
import type { GunCodeRecord, UpsertSummary } from "@/lib/types/gunCode";

const SOURCE_ORIGIN = "https://g.aitags.cn";
const SOURCE_URL = `${SOURCE_ORIGIN}/`;
const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "zh-CN,zh;q=0.9",
};
const WEAPON_FETCH_CONCURRENCY = 8;

function detectGame(fullCode: string, weapon: string): string {
  if (
    fullCode.includes("烽火地带") ||
    weapon.includes("烽火地带") ||
    /烽火/.test(fullCode)
  ) {
    return "烽火";
  }
  return "大战场";
}

function parseCopyCount(raw: string): number {
  const numbers = raw.replace(/[^\d]/g, "");
  return numbers ? Number(numbers) : 0;
}

function extractCodeFromCell($cell: cheerio.Cheerio<Element>): string {
  const chip = $cell.find(".code-chip").first().text().trim();
  if (chip) return chip.replace(/`/g, "").replace(/\s+/g, "").trim();

  const lines = $cell
    .text()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const line = lines[0] ?? $cell.text();
  return line.replace(/`/g, "").replace(/\s+/g, "").trim();
}

function splitWeaponAndCode(raw: string): { weapon?: string; fullCode: string } {
  const beaconMatch = raw.match(/^(.+?)-烽火地带-(.+)$/);
  if (beaconMatch) {
    return { weapon: beaconMatch[1].trim(), fullCode: beaconMatch[2].trim() };
  }
  return { fullCode: raw };
}

function recordKey(record: GunCodeRecord): string {
  return `${record.weapon}::${record.fullCode}`;
}

function dedupeRecords(records: GunCodeRecord[]): GunCodeRecord[] {
  const map = new Map<string, GunCodeRecord>();
  for (const record of records) {
    map.set(recordKey(record), record);
  }
  return [...map.values()];
}

function pushRecord(records: GunCodeRecord[], record: GunCodeRecord): void {
  if (!record.weapon || !record.fullCode) return;
  records.push({
    ...record,
    game: detectGame(record.fullCode, record.weapon),
    source: "g.aitags.cn",
  });
}

/** 首页「热门改枪码」表格：列含武器名 + 改枪码 */
function parseFeaturedTable($: cheerio.CheerioAPI, records: GunCodeRecord[]): void {
  $("table").each((_, tableEl) => {
    const headers = $(tableEl)
      .find("th")
      .map((_, th) => $(th).text().trim())
      .get();
    if (!headers[0]?.includes("武器") || !headers.some((h) => h.includes("改枪码"))) {
      return;
    }

    $(tableEl)
      .find("tr")
      .slice(1)
      .each((_, row) => {
        const tds = $(row).find("td");
        if (tds.length < 5) return;

        pushRecord(records, {
          game: "大战场",
          weapon: $(tds[0]).text().trim(),
          fullCode: extractCodeFromCell($(tds[1])),
          description: $(tds[2]).text().trim(),
          valueText: $(tds[3]).text().trim(),
          copyCount: parseCopyCount($(tds[4]).text().trim()),
          source: "g.aitags.cn",
        });
      });
  });
}

function extractWeaponName($: cheerio.CheerioAPI): string {
  const fromHeading = $("h2")
    .filter((_, el) => $(el).text().includes("改枪码"))
    .first()
    .text()
    .trim()
    .replace(/\s*改枪码.*$/, "")
    .trim();
  if (fromHeading) return fromHeading;

  const title = $("title").text().trim();
  const match = title.match(/^(.+?)改枪码/);
  if (match?.[1]) return match[1].trim();

  return title.split("_")[0]?.trim() || "未知武器";
}

/** 武器详情页表格：首列为改枪码，武器名在页面标题 */
function parseWeaponDetailTables($: cheerio.CheerioAPI, records: GunCodeRecord[]): void {
  const weapon = extractWeaponName($);

  $("table").each((_, tableEl) => {
    const headers = $(tableEl)
      .find("th")
      .map((_, th) => $(th).text().trim())
      .get();
    if (headers[0]?.includes("武器")) return;
    if (!headers.some((h) => h.includes("改枪码"))) return;

    $(tableEl)
      .find("tr")
      .slice(1)
      .each((_, row) => {
        const tds = $(row).find("td");
        if (tds.length < 4) return;

        const rawCode = extractCodeFromCell($(tds[0]));
        if (!rawCode || rawCode.length < 8 || /配件|图片/.test(rawCode)) return;

        const parsed = splitWeaponAndCode(rawCode);

        pushRecord(records, {
          game: "大战场",
          weapon: parsed.weapon || weapon,
          fullCode: parsed.fullCode,
          description: $(tds[1]).text().trim(),
          valueText: $(tds[2]).text().trim(),
          copyCount: parseCopyCount($(tds[3]).text().trim()),
          source: "g.aitags.cn",
        });
      });
  });
}

function parseGunCodesFromHtml(html: string, mode: "home" | "weapon"): GunCodeRecord[] {
  const $ = cheerio.load(html);
  const records: GunCodeRecord[] = [];

  if (mode === "home") {
    parseFeaturedTable($, records);
  } else {
    parseWeaponDetailTables($, records);
  }

  return records;
}

function collectWeaponUrls(html: string): string[] {
  const $ = cheerio.load(html);
  const urls = new Set<string>();

  $('a[href*="/weapons/"]').each((_, el) => {
    const href = $(el).attr("href")?.trim();
    if (!href || href.includes("weapon_category")) return;
    const absolute = href.startsWith("http") ? href : `${SOURCE_ORIGIN}${href.startsWith("/") ? "" : "/"}${href}`;
    if (absolute.includes("/weapons/")) {
      urls.add(absolute.split("?")[0] ?? absolute);
    }
  });

  return [...urls];
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: FETCH_HEADERS,
    next: { revalidate: 0 },
  });
  if (!response.ok) {
    throw new Error(`抓取失败 ${url}: HTTP ${response.status} ${response.statusText}`);
  }
  return response.text();
}

async function mapInBatches<T, R>(
  items: T[],
  batchSize: number,
  mapper: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(mapper));
    results.push(...batchResults);
  }
  return results;
}

export async function scrapeGunCodes(): Promise<{ parsed: number; summary: UpsertSummary }> {
  const homeHtml = await fetchHtml(SOURCE_URL);
  const records: GunCodeRecord[] = [...parseGunCodesFromHtml(homeHtml, "home")];

  const weaponUrls = collectWeaponUrls(homeHtml);
  const weaponRecords = await mapInBatches(weaponUrls, WEAPON_FETCH_CONCURRENCY, async (url) => {
    try {
      const html = await fetchHtml(url);
      return parseGunCodesFromHtml(html, "weapon");
    } catch (error) {
      console.warn(`跳过武器页 ${url}:`, error instanceof Error ? error.message : error);
      return [];
    }
  });

  for (const batch of weaponRecords) {
    records.push(...batch);
  }

  const uniqueRecords = dedupeRecords(records);

  if (uniqueRecords.length === 0) {
    throw new Error("解析到 0 条改枪码，页面结构可能已变更");
  }

  await ensureGunCodesTable();
  const summary = await upsertGunCodes(uniqueRecords);

  return { parsed: uniqueRecords.length, summary };
}
