/**
 * 把稍后放到 sharedvids/streamer-codes/codes.json 的主播枪码导入数据库。
 *
 *   npx tsx scripts/import-streamer-codes.ts
 *   npx tsx scripts/import-streamer-codes.ts /path/to/codes.json
 *
 * 每条至少要有：streamer, weapon, mode, code, source_url, posted_at, note
 * 需要 DATABASE_URL。重复的「主播 + 枪码」会更新，不会再插一条。
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import type mysql from "mysql2/promise";

import { getDialect, getMySqlPool, getPgPool } from "@/lib/db";
import { normalizeGameMode } from "@/lib/delta-gun/game-modes";
import { CURRENT_SEASON } from "@/lib/delta-gun/season";
import { ensureStreamerTables, upsertStreamerLoadouts, upsertStreamers } from "@/lib/repositories/streamersRepo";
import type { StreamerLoadoutRecord, StreamerRecord } from "@/lib/types/streamer";

interface IncomingCode {
  streamer?: unknown;
  weapon?: unknown;
  mode?: unknown;
  code?: unknown;
  source_url?: unknown;
  posted_at?: unknown;
  note?: unknown;
}

function slugify(name: string): string {
  const ascii = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (ascii.length >= 2) return ascii.slice(0, 60);
  return `s-${createHash("sha256").update(name).digest("hex").slice(0, 10)}`;
}

function remoteId(streamer: string, code: string): number {
  const hex = createHash("sha256").update(`${streamer}\n${code}`).digest();
  return 1_000_000_000 + (hex.readUInt32BE(0) % 800_000_000);
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function ensureImportTable(): Promise<void> {
  if (getDialect() === "postgres") {
    await getPgPool().query(`
      CREATE TABLE IF NOT EXISTS imported_streamer_codes (
        id BIGSERIAL PRIMARY KEY,
        streamer TEXT NOT NULL,
        weapon TEXT NOT NULL,
        game TEXT NOT NULL,
        full_code TEXT NOT NULL,
        source_url TEXT DEFAULT '',
        posted_at TIMESTAMPTZ,
        note TEXT DEFAULT '',
        season TEXT DEFAULT '',
        UNIQUE (streamer, full_code)
      )
    `);
    return;
  }
  await getMySqlPool().query(`
    CREATE TABLE IF NOT EXISTS imported_streamer_codes (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      streamer VARCHAR(191) NOT NULL,
      weapon VARCHAR(255) NOT NULL,
      game VARCHAR(50) NOT NULL,
      full_code VARCHAR(512) NOT NULL,
      source_url VARCHAR(512) DEFAULT '',
      posted_at DATETIME NULL,
      note TEXT,
      season VARCHAR(32) NOT NULL DEFAULT '',
      UNIQUE KEY uniq_imported_code (streamer(64), full_code(180))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

async function main(): Promise<void> {
  const file = process.argv[2] ?? "/workspace/sharedvids/streamer-codes/codes.json";
  const raw = JSON.parse(await readFile(file, "utf8")) as unknown;
  if (!Array.isArray(raw)) throw new Error("codes.json 应该是数组");

  const rows = raw.flatMap((item, index) => {
    const row = item as IncomingCode;
    const streamer = text(row.streamer);
    const weapon = text(row.weapon);
    const code = text(row.code);
    if (!streamer || !weapon || !code) {
      console.warn(`跳过第 ${index + 1} 条：缺少 streamer / weapon / code`);
      return [];
    }
    return [{
      streamer,
      weapon,
      game: normalizeGameMode(text(row.mode) || "烽火"),
      code,
      sourceUrl: text(row.source_url),
      postedAt: text(row.posted_at),
      note: text(row.note),
    }];
  });

  await ensureImportTable();
  await ensureStreamerTables();

  for (const row of rows) {
    if (getDialect() === "postgres") {
      await getPgPool().query(
        `INSERT INTO imported_streamer_codes (streamer, weapon, game, full_code, source_url, posted_at, note, season)
         VALUES ($1, $2, $3, $4, $5, NULLIF($6, '')::timestamptz, $7, $8)
         ON CONFLICT (streamer, full_code) DO UPDATE
         SET weapon = EXCLUDED.weapon, game = EXCLUDED.game, source_url = EXCLUDED.source_url,
             posted_at = EXCLUDED.posted_at, note = EXCLUDED.note, season = EXCLUDED.season`,
        [row.streamer, row.weapon, row.game, row.code, row.sourceUrl, row.postedAt, row.note, CURRENT_SEASON]
      );
    } else {
      await getMySqlPool().query<mysql.ResultSetHeader>(
        `INSERT INTO imported_streamer_codes (streamer, weapon, game, full_code, source_url, posted_at, note, season)
         VALUES (?, ?, ?, ?, ?, NULLIF(?, ''), ?, ?)
         ON DUPLICATE KEY UPDATE weapon = VALUES(weapon), game = VALUES(game), source_url = VALUES(source_url),
           posted_at = VALUES(posted_at), note = VALUES(note), season = VALUES(season)`,
        [row.streamer, row.weapon, row.game, row.code, row.sourceUrl, row.postedAt, row.note, CURRENT_SEASON]
      );
    }
  }

  const streamers = new Map<string, StreamerRecord>();
  const loadouts: StreamerLoadoutRecord[] = [];
  for (const row of rows) {
    const slug = slugify(row.streamer);
    const prev = streamers.get(slug);
    streamers.set(slug, {
      slug,
      name: row.streamer,
      roles: ["主播"],
      signatureWeapon: prev?.signatureWeapon || row.weapon,
      bio: "",
      platform: "pc",
      accentColor: "#9aa4b2",
      avatarInitial: row.streamer.slice(0, 1),
      loadoutCount: (prev?.loadoutCount ?? 0) + 1,
      source: "streamer-codes.json",
    });
    let host = "import";
    try {
      host = row.sourceUrl ? new URL(row.sourceUrl).host : "import";
    } catch {
      host = "import";
    }
    loadouts.push({
      remoteId: remoteId(row.streamer, row.code),
      streamerSlug: slug,
      title: row.note || row.weapon,
      weapon: row.weapon,
      game: row.game,
      fullCode: row.code,
      valueText: "",
      copyCount: 0,
      source: host.slice(0, 100),
    });
  }

  const streamerCount = await upsertStreamers([...streamers.values()]);
  const loadoutCount = await upsertStreamerLoadouts(loadouts);
  console.log(`导入 ${rows.length} 条，主播 ${streamerCount}，方案 ${loadoutCount}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
