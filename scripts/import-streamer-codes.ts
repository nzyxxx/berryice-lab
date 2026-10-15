/**
 * 把 data/streamer-codes-s11.json 里核对过的 S11 主播枪码写入 berryice 库。
 *
 *   npx tsx scripts/import-streamer-codes.ts
 *   npx tsx scripts/import-streamer-codes.ts data/streamer-codes-s11.json
 *
 * 需要 DATABASE_URL。同一条「主播 + 枪码」重复导入会更新，不会再插一行。
 * 不在这份名单里的旧方案，以及赛季不是 S11 的方案，只标 archived=1，不删除。
 * 主播改枪页只读 archived=0 且 season=S11 的行。
 *
 * 每条至少要有 streamer、weapon、code。其余字段：
 * mode / game、source_url、posted_at、note、focus / focus_tags、rating、season。
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { normalizeGameMode } from "../lib/delta-gun/game-modes";
import { clampRecommendation, parseFocusTags } from "../lib/delta-gun/season";
import {
  archiveStreamerLoadoutsExcept,
  ensureStreamerTables,
  upsertStreamers,
  upsertVerifiedStreamerLoadouts,
} from "../lib/repositories/streamersRepo";
import { VERIFIED_STREAMER_SEASON, type StreamerLoadoutRecord, type StreamerRecord } from "../lib/types/streamer";

const DEFAULT_FILE = path.resolve("data/streamer-codes-s11.json");

interface IncomingCode {
  streamer?: unknown;
  name?: unknown;
  author?: unknown;
  slug?: unknown;
  weapon?: unknown;
  mode?: unknown;
  game?: unknown;
  code?: unknown;
  full_code?: unknown;
  fullCode?: unknown;
  source_url?: unknown;
  sourceUrl?: unknown;
  url?: unknown;
  posted_at?: unknown;
  postedAt?: unknown;
  date?: unknown;
  note?: unknown;
  title?: unknown;
  description?: unknown;
  focus?: unknown;
  focus_tags?: unknown;
  focusTags?: unknown;
  rating?: unknown;
  recommendation?: unknown;
  stars?: unknown;
  season?: unknown;
  platform?: unknown;
}

interface NormalizedCode {
  streamer: string;
  slug: string;
  weapon: string;
  game: string;
  code: string;
  sourceUrl: string;
  postedAt: string | null;
  note: string;
  focusTags: string[];
  recommendation: number | null;
  season: string;
  platform: "pc" | "mobile";
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function slugify(name: string, explicit: string): string {
  const given = explicit.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
  if (given.length >= 2) return given.slice(0, 60);
  const ascii = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (ascii.length >= 2) return ascii.slice(0, 60);
  return `s-${createHash("sha256").update(name).digest("hex").slice(0, 10)}`;
}

function remoteId(streamer: string, code: string): number {
  const hex = createHash("sha256").update(`${streamer}\n${code}`).digest();
  return 1_000_000_000 + (hex.readUInt32BE(0) % 800_000_000);
}

function focusOf(value: unknown): string[] {
  if (Array.isArray(value)) {
    const parsed = parseFocusTags(value.map((item) => String(item)));
    if (parsed.length > 0) return parsed;
    return value
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0 && item.length <= 8)
      .slice(0, 6);
  }
  const raw = text(value);
  const parsed = parseFocusTags(raw);
  if (parsed.length > 0) return parsed;
  return raw
    .split(/[,，/|、\s]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && item.length <= 8)
    .slice(0, 6);
}

function postedAtOf(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  const date = new Date(raw.includes("T") || raw.includes("-") ? raw : raw.replace(/\./g, "-"));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function asRecord(item: unknown): IncomingCode {
  return item && typeof item === "object" ? (item as IncomingCode) : {};
}

export function normalizeStreamerCodes(raw: unknown): NormalizedCode[] {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { codes?: unknown }).codes)
      ? (raw as { codes: unknown[] }).codes
      : null;
  if (!list) throw new Error("枪码文件应该是数组，或 { codes: [] }");

  return list.flatMap((item, index) => {
    const row = asRecord(item);
    const streamer = text(row.streamer) || text(row.name) || text(row.author);
    const weapon = text(row.weapon);
    const code = text(row.code) || text(row.full_code) || text(row.fullCode);
    if (!streamer || !weapon || !code) {
      console.warn(`跳过第 ${index + 1} 条：缺少 streamer / weapon / code`);
      return [];
    }
    const season = text(row.season) || VERIFIED_STREAMER_SEASON;
    const platformRaw = text(row.platform);
    return [
      {
        streamer,
        slug: slugify(streamer, text(row.slug)),
        weapon,
        game: normalizeGameMode(text(row.mode) || text(row.game) || "烽火"),
        code,
        sourceUrl: text(row.source_url) || text(row.sourceUrl) || text(row.url),
        postedAt: postedAtOf(row.posted_at ?? row.postedAt ?? row.date),
        note: text(row.note) || text(row.title) || text(row.description),
        focusTags: focusOf(row.focus_tags ?? row.focusTags ?? row.focus),
        recommendation: clampRecommendation(row.rating ?? row.recommendation ?? row.stars),
        season,
        platform: platformRaw === "mobile" || platformRaw.includes("手游") ? "mobile" : "pc",
      },
    ];
  });
}

function hostOf(url: string): string {
  if (!url) return "s11-verified";
  try {
    return new URL(url).host.slice(0, 100) || "s11-verified";
  } catch {
    return "s11-verified";
  }
}

async function main(): Promise<void> {
  const file = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_FILE;
  const raw = JSON.parse(await readFile(file, "utf8")) as unknown;
  const rows = normalizeStreamerCodes(raw);
  if (rows.length === 0) throw new Error(`${file} 里没有可导入的枪码，已停止，避免把现有方案全部归档`);

  const loadoutsByRemote = new Map<number, StreamerLoadoutRecord>();
  for (const row of rows) {
    const visible = row.season === VERIFIED_STREAMER_SEASON;
    const id = remoteId(row.streamer, row.code);
    const previous = loadoutsByRemote.get(id);
    if (previous && !previous.archived && !visible) continue;
    loadoutsByRemote.set(id, {
      remoteId: id,
      streamerSlug: row.slug,
      title: row.note || row.weapon,
      weapon: row.weapon,
      game: row.game,
      fullCode: row.code,
      valueText: "",
      copyCount: 0,
      source: hostOf(row.sourceUrl),
      focusTags: row.focusTags,
      recommendation: row.recommendation,
      season: row.season,
      postedAt: row.postedAt,
      sourceUrl: row.sourceUrl,
      archived: !visible,
    });
  }
  const loadouts = [...loadoutsByRemote.values()];

  const streamers = new Map<string, StreamerRecord>();
  for (const row of rows) {
    const prev = streamers.get(row.slug);
    streamers.set(row.slug, {
      slug: row.slug,
      name: row.streamer,
      roles: ["主播"],
      signatureWeapon: prev?.signatureWeapon || row.weapon,
      bio: `${VERIFIED_STREAMER_SEASON} 核对方案`,
      platform: row.platform,
      accentColor: "#9aa4b2",
      avatarInitial: row.streamer.slice(0, 1),
      loadoutCount: 0,
      source: "s11-verified",
    });
  }
  for (const item of loadouts) {
    const streamer = streamers.get(item.streamerSlug);
    if (streamer && !item.archived) streamer.loadoutCount += 1;
  }

  await ensureStreamerTables();
  const streamerCount = await upsertStreamers([...streamers.values()]);
  const loadoutCount = await upsertVerifiedStreamerLoadouts(loadouts);
  const visibleIds = loadouts.filter((item) => !item.archived).map((item) => item.remoteId);
  const archived = await archiveStreamerLoadoutsExcept(VERIFIED_STREAMER_SEASON, visibleIds);
  const hiddenInFile = loadouts.length - visibleIds.length;
  console.log(
    `导入 ${loadouts.length} 条（页面展示 ${visibleIds.length}，文件内非 ${VERIFIED_STREAMER_SEASON} ${hiddenInFile}），主播 ${streamerCount}，方案写入 ${loadoutCount}，另外归档 ${archived} 条旧方案`
  );
}

const isDirectRun = process.argv[1]?.includes("import-streamer-codes");
if (isDirectRun) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
