import type mysql from "mysql2/promise";

import { getDialect, getMySqlPool, getPgPool } from "@/lib/db";
import { normalizeGameMode } from "@/lib/delta-gun/game-modes";
import type {
  StoredStreamer,
  StoredStreamerLoadout,
  StreamerLoadoutRecord,
  StreamerPlatform,
  StreamerRecord,
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
  };
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
        collected_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(
      "CREATE INDEX IF NOT EXISTS idx_streamer_loadouts_slug ON streamer_loadouts (streamer_slug)"
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
      UNIQUE KEY uniq_streamer_loadout_remote (remote_id),
      KEY idx_streamer_loadouts_slug (streamer_slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
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

/**
 * 远端删掉的方案本地也要跟着消失，否则会留下永远无法更新的僵尸枪码。
 * keepRemoteIds 为空表示该主播这轮一条都没抓到，此时不做删除，避免把好数据清空。
 */
export async function pruneStreamerLoadouts(
  streamerSlug: string,
  keepRemoteIds: number[]
): Promise<number> {
  const safeIds = keepRemoteIds.filter((id) => Number.isInteger(id) && id > 0);
  if (safeIds.length === 0) return 0;

  if (getDialect() === "postgres") {
    const result = await getPgPool().query(
      "DELETE FROM streamer_loadouts WHERE streamer_slug = $1 AND remote_id <> ALL($2::bigint[])",
      [streamerSlug, safeIds]
    );
    return result.rowCount ?? 0;
  }

  const placeholders = safeIds.map(() => "?").join(", ");
  const [result] = await getMySqlPool().query<mysql.ResultSetHeader>(
    `DELETE FROM streamer_loadouts WHERE streamer_slug = ? AND remote_id NOT IN (${placeholders})`,
    [streamerSlug, ...safeIds]
  );
  return result.affectedRows;
}

export async function listStreamers(platform?: StreamerPlatform): Promise<StoredStreamer[]> {
  const columns =
    "id, slug, name, roles, signature_weapon, bio, platform, accent_color, avatar_initial, loadout_count, source, collected_at";

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
  const columns =
    "id, slug, name, roles, signature_weapon, bio, platform, accent_color, avatar_initial, loadout_count, source, collected_at";

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
  const columns =
    "id, remote_id, streamer_slug, title, weapon, game, full_code, value_text, copy_count, source, collected_at";

  if (getDialect() === "postgres") {
    const result = await getPgPool().query(
      `SELECT ${columns} FROM streamer_loadouts WHERE streamer_slug = $1 ORDER BY copy_count DESC, id ASC`,
      [slug]
    );
    return result.rows.map((row) => mapLoadout(row));
  }

  const [rows] = await getMySqlPool().query<mysql.RowDataPacket[]>(
    `SELECT ${columns} FROM streamer_loadouts WHERE streamer_slug = ? ORDER BY copy_count DESC, id ASC`,
    [slug]
  );
  return rows.map((row) => mapLoadout(row as unknown as Record<string, unknown>));
}
