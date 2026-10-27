import type mysql from "mysql2/promise";

import { getDialect, getMySqlPool, getPgPool } from "@/lib/db";
import { normalizeGameMode } from "@/lib/delta-gun/game-modes";
import {
  VERIFIED_STREAMER_SEASON,
  type StoredStreamer,
  type StoredStreamerLoadout,
  type StreamerLoadoutRecord,
  type StreamerPlatform,
  type StreamerRecord,
} from "@/lib/types/streamer";

function parseRoles(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((item) => String(item));
  const text = String(raw ?? "").trim();
  if (!text) return [];
  try {
    const parsed: unknown = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map((item) => String(item));
  } catch {
    /* 落库格式异常时退回逗号分隔 */
  }
  return text.split(",").map((item) => item.trim()).filter(Boolean);
}

function mapStreamer(row: Record<string, unknown>): StoredStreamer {
  const platform = String(row.platform ?? "pc");
  return {
    id: Number(row.id),
    slug: String(row.slug ?? ""),
    name: String(row.name ?? ""),
    roles: parseRoles(row.roles),
    signatureWeapon: String(row.signature_weapon ?? ""),
    bio: String(row.bio ?? ""),
    platform: (platform === "mobile" ? "mobile" : "pc") as StreamerPlatform,
    accentColor: String(row.accent_color ?? "#38bdf8"),
    avatarInitial: String(row.avatar_initial ?? ""),
    loadoutCount: Number(row.loadout_count ?? 0),
    source: String(row.source ?? "yunmaku.com"),
    collectedAt: String(row.collected_at ?? ""),
  };
}

function mapLoadout(row: Record<string, unknown>): StoredStreamerLoadout {
  return {
    id: Number(row.id),
    remoteId: Number(row.remote_id ?? 0),
    streamerSlug: String(row.streamer_slug ?? ""),
    title: String(row.title ?? ""),
    weapon: String(row.weapon ?? ""),
    game: normalizeGameMode(String(row.game ?? "大战场")),
    fullCode: String(row.full_code ?? ""),
    valueText: String(row.value_text ?? ""),
    copyCount: Number(row.copy_count ?? 0),
    source: String(row.source ?? "yunmaku.com"),
    collectedAt: String(row.collected_at ?? ""),
    focusTags: String(row.focus_tags ?? "")
      .split(/[,，]/)
      .map((item) => item.trim())
      .filter(Boolean),
    recommendation:
      row.recommendation == null || row.recommendation === "" ? null : Number(row.recommendation),
    season: String(row.season ?? ""),
    postedAt: row.posted_at == null || row.posted_at === "" ? null : String(row.posted_at),
    sourceUrl: String(row.source_url ?? ""),
    archived: Number(row.archived ?? 0) === 1,
  };
}

const LOADOUT_COLUMNS =
  "id, remote_id, streamer_slug, title, weapon, game, full_code, value_text, copy_count, source, collected_at, focus_tags, recommendation, season, posted_at, source_url, archived";

function visibleLoadoutCountSql(slugColumn: string): string {
  const token = VERIFIED_STREAMER_SEASON.replace(/[^A-Za-z0-9]/g, "");
  return `(SELECT COUNT(*) FROM streamer_loadouts l WHERE l.streamer_slug = ${slugColumn} AND l.archived = 0 AND l.season LIKE '${token}%')`;
}

export async function ensureStreamerTables(): Promise<void> {
  if (getDialect() === "postgres") {
    const pool = getPgPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS streamers (
        id BIGSERIAL PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        roles TEXT DEFAULT '[]',
        signature_weapon TEXT DEFAULT '',
        bio TEXT DEFAULT '',
        platform TEXT NOT NULL DEFAULT 'pc',
        accent_color TEXT DEFAULT '#38bdf8',
        avatar_initial TEXT DEFAULT '',
        loadout_count INTEGER DEFAULT 0,
        source TEXT DEFAULT 'yunmaku.com',
        collected_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS streamer_loadouts (
        id BIGSERIAL PRIMARY KEY,
        remote_id BIGINT NOT NULL UNIQUE,
        streamer_slug TEXT NOT NULL,
        title TEXT DEFAULT '',
        weapon TEXT NOT NULL,
        game TEXT NOT NULL DEFAULT '大战场',
        full_code TEXT NOT NULL,
        value_text TEXT DEFAULT '',
        copy_count INTEGER DEFAULT 0,
        source TEXT DEFAULT 'yunmaku.com',
        collected_at TIMESTAMPTZ DEFAULT NOW(),
        focus_tags TEXT DEFAULT '',
        recommendation INTEGER,
        season TEXT DEFAULT '',
        posted_at TIMESTAMPTZ,
        source_url TEXT DEFAULT '',
        archived INTEGER NOT NULL DEFAULT 0
      )
    `);
    await pool.query(
      "CREATE INDEX IF NOT EXISTS idx_streamer_loadouts_slug ON streamer_loadouts (streamer_slug)"
    );
    await pool.query(`ALTER TABLE streamer_loadouts ADD COLUMN IF NOT EXISTS focus_tags TEXT DEFAULT ''`);
    await pool.query(`ALTER TABLE streamer_loadouts ADD COLUMN IF NOT EXISTS recommendation INTEGER`);
    await pool.query(`ALTER TABLE streamer_loadouts ADD COLUMN IF NOT EXISTS season TEXT DEFAULT ''`);
    await pool.query(`ALTER TABLE streamer_loadouts ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ`);
    await pool.query(`ALTER TABLE streamer_loadouts ADD COLUMN IF NOT EXISTS source_url TEXT DEFAULT ''`);
    await pool.query(
      `ALTER TABLE streamer_loadouts ADD COLUMN IF NOT EXISTS archived INTEGER NOT NULL DEFAULT 0`
    );
    return;
  }

  const pool = getMySqlPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS streamers (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(191) NOT NULL,
      name VARCHAR(191) NOT NULL,
      roles TEXT,
      signature_weapon VARCHAR(191) DEFAULT '',
      bio TEXT,
      platform VARCHAR(16) NOT NULL DEFAULT 'pc',
      accent_color VARCHAR(32) DEFAULT '#38bdf8',
      avatar_initial VARCHAR(8) DEFAULT '',
      loadout_count INT DEFAULT 0,
      source VARCHAR(100) DEFAULT 'yunmaku.com',
      collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_streamer_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS streamer_loadouts (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      remote_id BIGINT NOT NULL,
      streamer_slug VARCHAR(191) NOT NULL,
      title VARCHAR(512) DEFAULT '',
      weapon VARCHAR(255) NOT NULL,
      game VARCHAR(50) NOT NULL DEFAULT '大战场',
      full_code VARCHAR(512) NOT NULL,
      value_text VARCHAR(255) DEFAULT '',
      copy_count INT DEFAULT 0,
      source VARCHAR(100) DEFAULT 'yunmaku.com',
      collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      focus_tags VARCHAR(255) NOT NULL DEFAULT '',
      recommendation TINYINT NULL,
      season VARCHAR(32) NOT NULL DEFAULT '',
      posted_at DATETIME NULL,
      source_url VARCHAR(512) NOT NULL DEFAULT '',
      archived TINYINT NOT NULL DEFAULT 0,
      UNIQUE KEY uniq_streamer_loadout_remote (remote_id),
      KEY idx_streamer_loadouts_slug (streamer_slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  const alters = [
    `ALTER TABLE streamer_loadouts ADD COLUMN IF NOT EXISTS focus_tags VARCHAR(255) NOT NULL DEFAULT ''`,
    `ALTER TABLE streamer_loadouts ADD COLUMN IF NOT EXISTS recommendation TINYINT NULL`,
    `ALTER TABLE streamer_loadouts ADD COLUMN IF NOT EXISTS season VARCHAR(32) NOT NULL DEFAULT ''`,
    `ALTER TABLE streamer_loadouts ADD COLUMN IF NOT EXISTS posted_at DATETIME NULL`,
    `ALTER TABLE streamer_loadouts ADD COLUMN IF NOT EXISTS source_url VARCHAR(512) NOT NULL DEFAULT ''`,
    `ALTER TABLE streamer_loadouts ADD COLUMN IF NOT EXISTS archived TINYINT NOT NULL DEFAULT 0`,
  ];
  for (const statement of alters) {
    await pool.query(statement).catch(() => undefined);
  }
}

export async function upsertStreamers(records: StreamerRecord[]): Promise<number> {
  if (records.length === 0) return 0;

  if (getDialect() === "postgres") {
    const pool = getPgPool();
    for (const item of records) {
      await pool.query(
        `
          INSERT INTO streamers
            (slug, name, roles, signature_weapon, bio, platform, accent_color, avatar_initial, loadout_count, source, collected_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
          ON CONFLICT (slug) DO UPDATE
          SET name = EXCLUDED.name,
              roles = EXCLUDED.roles,
              signature_weapon = EXCLUDED.signature_weapon,
              bio = EXCLUDED.bio,
              platform = EXCLUDED.platform,
              accent_color = EXCLUDED.accent_color,
              avatar_initial = EXCLUDED.avatar_initial,
              loadout_count = EXCLUDED.loadout_count,
              source = EXCLUDED.source,
              collected_at = NOW()
        `,
        [
          item.slug,
          item.name,
          JSON.stringify(item.roles),
          item.signatureWeapon,
          item.bio,
          item.platform,
          item.accentColor,
          item.avatarInitial,
          item.loadoutCount,
          item.source,
        ]
      );
    }
    return records.length;
  }

  const pool = getMySqlPool();
  for (const item of records) {
    await pool.query(
      `
        INSERT INTO streamers
          (slug, name, roles, signature_weapon, bio, platform, accent_color, avatar_initial, loadout_count, source, collected_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          roles = VALUES(roles),
          signature_weapon = VALUES(signature_weapon),
          bio = VALUES(bio),
          platform = VALUES(platform),
          accent_color = VALUES(accent_color),
          avatar_initial = VALUES(avatar_initial),
          loadout_count = VALUES(loadout_count),
          source = VALUES(source),
          collected_at = CURRENT_TIMESTAMP
      `,
      [
        item.slug,
        item.name,
        JSON.stringify(item.roles),
        item.signatureWeapon,
        item.bio,
        item.platform,
        item.accentColor,
        item.avatarInitial,
        item.loadoutCount,
        item.source,
      ]
    );
  }
  return records.length;
}

export async function upsertStreamerLoadouts(records: StreamerLoadoutRecord[]): Promise<number> {
  if (records.length === 0) return 0;

  if (getDialect() === "postgres") {
    const pool = getPgPool();
    for (const item of records) {
      await pool.query(
        `
          INSERT INTO streamer_loadouts
            (remote_id, streamer_slug, title, weapon, game, full_code, value_text, copy_count, source, collected_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          ON CONFLICT (remote_id) DO UPDATE
          SET streamer_slug = EXCLUDED.streamer_slug,
              title = EXCLUDED.title,
              weapon = EXCLUDED.weapon,
              game = EXCLUDED.game,
              full_code = EXCLUDED.full_code,
              value_text = EXCLUDED.value_text,
              copy_count = EXCLUDED.copy_count,
              source = EXCLUDED.source,
              collected_at = NOW()
        `,
        [
          item.remoteId,
          item.streamerSlug,
          item.title,
          item.weapon,
          item.game,
          item.fullCode,
          item.valueText,
          item.copyCount,
          item.source,
        ]
      );
    }
    return records.length;
  }

  const pool = getMySqlPool();
  for (const item of records) {
    await pool.query(
      `
        INSERT INTO streamer_loadouts
          (remote_id, streamer_slug, title, weapon, game, full_code, value_text, copy_count, source, collected_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE
          streamer_slug = VALUES(streamer_slug),
          title = VALUES(title),
          weapon = VALUES(weapon),
          game = VALUES(game),
          full_code = VALUES(full_code),
          value_text = VALUES(value_text),
          copy_count = VALUES(copy_count),
          source = VALUES(source),
          collected_at = CURRENT_TIMESTAMP
      `,
      [
        item.remoteId,
        item.streamerSlug,
        item.title,
        item.weapon,
        item.game,
        item.fullCode,
        item.valueText,
        item.copyCount,
        item.source,
      ]
    );
  }
  return records.length;
}

function verifiedLoadoutParams(item: StreamerLoadoutRecord): unknown[] {
  return [
    item.remoteId,
    item.streamerSlug,
    item.title,
    item.weapon,
    item.game,
    item.fullCode,
    item.valueText,
    item.copyCount,
    item.source,
    (item.focusTags ?? []).join(","),
    item.recommendation ?? null,
    item.season ?? "",
    item.postedAt || null,
    item.sourceUrl ?? "",
    item.archived ? 1 : 0,
  ];
}

/** 核对过的主播方案。按 remote_id 更新，重复导入不会再插一行。不改已有复制次数。 */
export async function upsertVerifiedStreamerLoadouts(records: StreamerLoadoutRecord[]): Promise<number> {
  if (records.length === 0) return 0;

  if (getDialect() === "postgres") {
    const pool = getPgPool();
    for (const item of records) {
      await pool.query(
        `
          INSERT INTO streamer_loadouts
            (remote_id, streamer_slug, title, weapon, game, full_code, value_text, copy_count, source, collected_at,
             focus_tags, recommendation, season, posted_at, source_url, archived)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, $11, $12, $13, $14, $15)
          ON CONFLICT (remote_id) DO UPDATE
          SET streamer_slug = EXCLUDED.streamer_slug,
              title = EXCLUDED.title,
              weapon = EXCLUDED.weapon,
              game = EXCLUDED.game,
              full_code = EXCLUDED.full_code,
              value_text = EXCLUDED.value_text,
              source = EXCLUDED.source,
              focus_tags = EXCLUDED.focus_tags,
              recommendation = EXCLUDED.recommendation,
              season = EXCLUDED.season,
              posted_at = EXCLUDED.posted_at,
              source_url = EXCLUDED.source_url,
              archived = EXCLUDED.archived,
              collected_at = NOW()
        `,
        verifiedLoadoutParams(item)
      );
    }
    return records.length;
  }

  const pool = getMySqlPool();
  for (const item of records) {
    await pool.query(
      `
        INSERT INTO streamer_loadouts
          (remote_id, streamer_slug, title, weapon, game, full_code, value_text, copy_count, source, collected_at,
           focus_tags, recommendation, season, posted_at, source_url, archived)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          streamer_slug = VALUES(streamer_slug),
          title = VALUES(title),
          weapon = VALUES(weapon),
          game = VALUES(game),
          full_code = VALUES(full_code),
          value_text = VALUES(value_text),
          source = VALUES(source),
          focus_tags = VALUES(focus_tags),
          recommendation = VALUES(recommendation),
          season = VALUES(season),
          posted_at = VALUES(posted_at),
          source_url = VALUES(source_url),
          archived = VALUES(archived),
          collected_at = CURRENT_TIMESTAMP
      `,
      verifiedLoadoutParams(item)
    );
  }
  return records.length;
}

/**
 * 把不在本次核对名单里的方案标成归档。不删除。
 * keepRemoteIds 为空时不动数据，避免空文件把整表藏掉。
 */
export async function archiveStreamerLoadoutsExcept(
  season: string,
  keepRemoteIds: number[]
): Promise<number> {
  const safeIds = [...new Set(keepRemoteIds.filter((id) => Number.isInteger(id) && id > 0))];
  if (safeIds.length === 0) return 0;

  const prefix = `${season.replace(/[^A-Za-z0-9]/g, "")}%`;
  if (!prefix || prefix === "%") return 0;

  if (getDialect() === "postgres") {
    const result = await getPgPool().query(
      `UPDATE streamer_loadouts
       SET archived = 1
       WHERE archived = 0
         AND NOT (season LIKE $1 AND remote_id = ANY($2::bigint[]))`,
      [prefix, safeIds]
    );
    return result.rowCount ?? 0;
  }

  const placeholders = safeIds.map(() => "?").join(", ");
  const [result] = await getMySqlPool().query<mysql.ResultSetHeader>(
    `UPDATE streamer_loadouts
     SET archived = 1
     WHERE archived = 0
       AND NOT (season LIKE ? AND remote_id IN (${placeholders}))`,
    [prefix, ...safeIds]
  );
  return result.affectedRows;
}

/**
 * 抓取同步时，远端已经没有的旧方案改为归档，不删除。
 * S11 核对方案不在这里动。keepRemoteIds 为空表示这轮没抓到，此时不归档，避免误伤。
 */
export async function pruneStreamerLoadouts(
  streamerSlug: string,
  keepRemoteIds: number[]
): Promise<number> {
  const safeIds = keepRemoteIds.filter((id) => Number.isInteger(id) && id > 0);
  if (safeIds.length === 0) return 0;

  if (getDialect() === "postgres") {
    const result = await getPgPool().query(
      `UPDATE streamer_loadouts
       SET archived = 1
       WHERE streamer_slug = $1
         AND season NOT LIKE $2
         AND remote_id <> ALL($3::bigint[])`,
      [streamerSlug, `${VERIFIED_STREAMER_SEASON}%`, safeIds]
    );
    return result.rowCount ?? 0;
  }

  const placeholders = safeIds.map(() => "?").join(", ");
  const [result] = await getMySqlPool().query<mysql.ResultSetHeader>(
    `UPDATE streamer_loadouts
     SET archived = 1
     WHERE streamer_slug = ?
       AND season NOT LIKE ?
       AND remote_id NOT IN (${placeholders})`,
    [streamerSlug, `${VERIFIED_STREAMER_SEASON}%`, ...safeIds]
  );
  return result.affectedRows;
}

export async function listStreamers(platform?: StreamerPlatform): Promise<StoredStreamer[]> {
  const columns = `id, slug, name, roles, signature_weapon, bio, platform, accent_color, avatar_initial, ${visibleLoadoutCountSql("streamers.slug")} AS loadout_count, source, collected_at`;

  if (getDialect() === "postgres") {
    const result = platform
      ? await getPgPool().query(
          `SELECT ${columns} FROM streamers WHERE platform = $1 ORDER BY loadout_count DESC, name ASC`,
          [platform]
        )
      : await getPgPool().query(
          `SELECT ${columns} FROM streamers ORDER BY loadout_count DESC, name ASC`
        );
    return result.rows.map((row) => mapStreamer(row));
  }

  const pool = getMySqlPool();
  const [rows] = platform
    ? await pool.query<mysql.RowDataPacket[]>(
        `SELECT ${columns} FROM streamers WHERE platform = ? ORDER BY loadout_count DESC, name ASC`,
        [platform]
      )
    : await pool.query<mysql.RowDataPacket[]>(
        `SELECT ${columns} FROM streamers ORDER BY loadout_count DESC, name ASC`
      );
  return rows.map((row) => mapStreamer(row as unknown as Record<string, unknown>));
}

export async function getStreamerBySlug(slug: string): Promise<StoredStreamer | null> {
  const columns = `id, slug, name, roles, signature_weapon, bio, platform, accent_color, avatar_initial, ${visibleLoadoutCountSql("streamers.slug")} AS loadout_count, source, collected_at`;

  if (getDialect() === "postgres") {
    const result = await getPgPool().query(
      `SELECT ${columns} FROM streamers WHERE slug = $1 LIMIT 1`,
      [slug]
    );
    const row = result.rows[0];
    return row ? mapStreamer(row) : null;
  }

  const [rows] = await getMySqlPool().query<mysql.RowDataPacket[]>(
    `SELECT ${columns} FROM streamers WHERE slug = ? LIMIT 1`,
    [slug]
  );
  const row = rows[0];
  return row ? mapStreamer(row as unknown as Record<string, unknown>) : null;
}

export async function listStreamerLoadouts(slug: string): Promise<StoredStreamerLoadout[]> {
  if (getDialect() === "postgres") {
    const result = await getPgPool().query(
      `SELECT ${LOADOUT_COLUMNS} FROM streamer_loadouts
       WHERE streamer_slug = $1 AND archived = 0 AND season LIKE $2
       ORDER BY posted_at DESC NULLS LAST, id ASC`,
      [slug, `${VERIFIED_STREAMER_SEASON}%`]
    );
    return result.rows.map((row) => mapLoadout(row));
  }

  const [rows] = await getMySqlPool().query<mysql.RowDataPacket[]>(
    `SELECT ${LOADOUT_COLUMNS} FROM streamer_loadouts
     WHERE streamer_slug = ? AND archived = 0 AND season LIKE ?
     ORDER BY posted_at DESC, id ASC`,
    [slug, `${VERIFIED_STREAMER_SEASON}%`]
  );
  return rows.map((row) => mapLoadout(row as unknown as Record<string, unknown>));
}
