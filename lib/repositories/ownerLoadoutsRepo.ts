import type mysql from "mysql2/promise";

import { getDialect, getMySqlPool, getPgPool } from "@/lib/db";
import { GAME_MODES, normalizeGameMode } from "@/lib/delta-gun/game-modes";
import { CURRENT_SEASON, clampRecommendation, parseFocusTags } from "@/lib/delta-gun/season";
import { getGunById } from "@/lib/data/guns";
import type { OwnerLoadout, OwnerLoadoutInput } from "@/lib/types/ownerLoadout";

function mapRow(row: Record<string, unknown>): OwnerLoadout {
  const tags = String(row.tags ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  return {
    id: Number(row.id),
    weaponId: String(row.weapon_id ?? ""),
    weaponName: String(row.weapon_name ?? ""),
    code: String(row.full_code ?? ""),
    title: String(row.title ?? ""),
    notes: String(row.notes ?? ""),
    tags,
    game: normalizeGameMode(String(row.game ?? "烽火")),
    focusTags: parseFocusTags(String(row.focus_tags ?? "")),
    recommendation: clampRecommendation(row.recommendation) ?? 3,
    rankPosition: row.rank_position == null || row.rank_position === "" ? null : Number(row.rank_position),
    season: String(row.season ?? "") || CURRENT_SEASON,
    postedAt: String(row.posted_at ?? row.updated_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

export async function ensureOwnerLoadoutsTable(): Promise<void> {
  if (getDialect() === "postgres") {
    await getPgPool().query(`
      CREATE TABLE IF NOT EXISTS owner_loadouts (
        id BIGSERIAL PRIMARY KEY,
        weapon_id TEXT NOT NULL,
        weapon_name TEXT NOT NULL,
        full_code TEXT NOT NULL,
        title TEXT NOT NULL,
        notes TEXT DEFAULT '',
        tags TEXT DEFAULT '',
        game TEXT NOT NULL DEFAULT '烽火',
        focus_tags TEXT DEFAULT '',
        recommendation INTEGER DEFAULT 3,
        rank_position INTEGER,
        season TEXT DEFAULT '',
        posted_at DATE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await getPgPool().query(`ALTER TABLE owner_loadouts ADD COLUMN IF NOT EXISTS focus_tags TEXT DEFAULT ''`);
    await getPgPool().query(`ALTER TABLE owner_loadouts ADD COLUMN IF NOT EXISTS recommendation INTEGER DEFAULT 3`);
    await getPgPool().query(`ALTER TABLE owner_loadouts ADD COLUMN IF NOT EXISTS rank_position INTEGER`);
    await getPgPool().query(`ALTER TABLE owner_loadouts ADD COLUMN IF NOT EXISTS season TEXT DEFAULT ''`);
    await getPgPool().query(`ALTER TABLE owner_loadouts ADD COLUMN IF NOT EXISTS posted_at DATE`);
    return;
  }

  await getMySqlPool().query(`
    CREATE TABLE IF NOT EXISTS owner_loadouts (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      weapon_id VARCHAR(64) NOT NULL,
      weapon_name VARCHAR(255) NOT NULL,
      full_code VARCHAR(512) NOT NULL,
      title VARCHAR(120) NOT NULL,
      notes TEXT,
      tags VARCHAR(255) DEFAULT '',
      game VARCHAR(50) NOT NULL DEFAULT '烽火',
      focus_tags VARCHAR(120) NOT NULL DEFAULT '',
      recommendation TINYINT NOT NULL DEFAULT 3,
      rank_position INT NULL,
      season VARCHAR(32) NOT NULL DEFAULT '',
      posted_at DATE NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  const pool = getMySqlPool();
  await pool.query(`ALTER TABLE owner_loadouts ADD COLUMN IF NOT EXISTS focus_tags VARCHAR(120) NOT NULL DEFAULT ''`).catch(() => undefined);
  await pool.query(`ALTER TABLE owner_loadouts ADD COLUMN IF NOT EXISTS recommendation TINYINT NOT NULL DEFAULT 3`).catch(() => undefined);
  await pool.query(`ALTER TABLE owner_loadouts ADD COLUMN IF NOT EXISTS rank_position INT NULL`).catch(() => undefined);
  await pool.query(`ALTER TABLE owner_loadouts ADD COLUMN IF NOT EXISTS season VARCHAR(32) NOT NULL DEFAULT ''`).catch(() => undefined);
  await pool.query(`ALTER TABLE owner_loadouts ADD COLUMN IF NOT EXISTS posted_at DATE NULL`).catch(() => undefined);
}

export function parseOwnerLoadoutInput(body: unknown): OwnerLoadoutInput | string {
  if (!body || typeof body !== "object") return "请求格式不对";
  const raw = body as Record<string, unknown>;
  const weaponId = typeof raw.weaponId === "string" ? raw.weaponId.trim() : "";
  const code = typeof raw.code === "string" ? raw.code.trim() : "";
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const notes = typeof raw.notes === "string" ? raw.notes.trim() : "";
  const game = typeof raw.game === "string" ? normalizeGameMode(raw.game) : "烽火";
  const tags = Array.isArray(raw.tags)
    ? raw.tags.filter((tag): tag is string => typeof tag === "string")
    : typeof raw.tags === "string"
      ? raw.tags.split(/[,，\s]+/)
      : [];

  if (!weaponId) return "先选一把枪";
  if (!code || code.length > 512) return "枪码不能为空，也不要超过 512 字";
  if (!title || title.length > 80) return "标题不能为空，也不要超过 80 字";
  if (notes.length > 1000) return "备注不要超过 1000 字";
  if (!GAME_MODES.includes(game)) return "模式不对";

  const cleanTags = [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))].slice(0, 8);
  if (cleanTags.some((tag) => tag.length > 16)) return "每个标签不要超过 16 字";

  const focusTags = parseFocusTags(
    Array.isArray(raw.focusTags) ? (raw.focusTags as string[]) : typeof raw.focusTags === "string" ? raw.focusTags : []
  );
  if (focusTags.length === 0) return "至少选一个方向";
  const recommendation = clampRecommendation(raw.recommendation);
  if (!recommendation) return "推荐指数要在 1 到 5 之间";
  const rankRaw = raw.rankPosition;
  const rankPosition =
    rankRaw == null || rankRaw === ""
      ? null
      : Number(rankRaw);
  if (rankPosition != null && (!Number.isInteger(rankPosition) || rankPosition < 1 || rankPosition > 200)) {
    return "版本排行要是 1 到 200 的名次，或者留空";
  }
  const season = typeof raw.season === "string" && raw.season.trim() ? raw.season.trim().slice(0, 32) : CURRENT_SEASON;
  const postedAt = typeof raw.postedAt === "string" && raw.postedAt.trim() ? raw.postedAt.trim().slice(0, 10) : new Date().toISOString().slice(0, 10);

  return { weaponId, code, title, notes, tags: cleanTags, game, focusTags, recommendation, rankPosition, season, postedAt };
}

export async function listOwnerLoadouts(): Promise<OwnerLoadout[]> {
  await ensureOwnerLoadoutsTable();
  if (getDialect() === "postgres") {
    const result = await getPgPool().query(
      `SELECT id, weapon_id, weapon_name, full_code, title, notes, tags, game, focus_tags, recommendation, rank_position, season, posted_at, updated_at
       FROM owner_loadouts ORDER BY updated_at DESC, id DESC`
    );
    return result.rows.map((row) => mapRow(row));
  }

  const [rows] = await getMySqlPool().query<mysql.RowDataPacket[]>(
    `SELECT id, weapon_id, weapon_name, full_code, title, notes, tags, game, focus_tags, recommendation, rank_position, season, posted_at, updated_at
     FROM owner_loadouts ORDER BY updated_at DESC, id DESC`
  );
  return rows.map((row) => mapRow(row));
}

async function resolvedWeapon(input: OwnerLoadoutInput) {
  const gun = await getGunById(input.weaponId);
  if (!gun) return null;
  return { ...input, weaponName: gun.name, tags: input.tags.join(",") };
}

export async function createOwnerLoadout(input: OwnerLoadoutInput): Promise<OwnerLoadout | null> {
  const weapon = await resolvedWeapon(input);
  if (!weapon) return null;
  await ensureOwnerLoadoutsTable();

  if (getDialect() === "postgres") {
    const result = await getPgPool().query(
      `INSERT INTO owner_loadouts (weapon_id, weapon_name, full_code, title, notes, tags, game, focus_tags, recommendation, rank_position, season, posted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, weapon_id, weapon_name, full_code, title, notes, tags, game, focus_tags, recommendation, rank_position, season, posted_at, updated_at`,
      [weapon.weaponId, weapon.weaponName, weapon.code, weapon.title, weapon.notes, weapon.tags, weapon.game, weapon.focusTags.join(","), weapon.recommendation, weapon.rankPosition, weapon.season, weapon.postedAt]
    );
    return mapRow(result.rows[0]);
  }

  const pool = getMySqlPool();
  const [header] = await pool.query<mysql.ResultSetHeader>(
    `INSERT INTO owner_loadouts (weapon_id, weapon_name, full_code, title, notes, tags, game, focus_tags, recommendation, rank_position, season, posted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [weapon.weaponId, weapon.weaponName, weapon.code, weapon.title, weapon.notes, weapon.tags, weapon.game, weapon.focusTags.join(","), weapon.recommendation, weapon.rankPosition, weapon.season, weapon.postedAt]
  );
  const [rows] = await pool.query<mysql.RowDataPacket[]>(
    `SELECT id, weapon_id, weapon_name, full_code, title, notes, tags, game, focus_tags, recommendation, rank_position, season, posted_at, updated_at
     FROM owner_loadouts WHERE id = ?`,
    [header.insertId]
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function updateOwnerLoadout(id: number, input: OwnerLoadoutInput): Promise<OwnerLoadout | null> {
  const weapon = await resolvedWeapon(input);
  if (!weapon) return null;
  await ensureOwnerLoadoutsTable();

  if (getDialect() === "postgres") {
    const result = await getPgPool().query(
      `UPDATE owner_loadouts
       SET weapon_id = $1, weapon_name = $2, full_code = $3, title = $4, notes = $5, tags = $6, game = $7,
           focus_tags = $8, recommendation = $9, rank_position = $10, season = $11, posted_at = $12, updated_at = NOW()
       WHERE id = $13
       RETURNING id, weapon_id, weapon_name, full_code, title, notes, tags, game, focus_tags, recommendation, rank_position, season, posted_at, updated_at`,
      [weapon.weaponId, weapon.weaponName, weapon.code, weapon.title, weapon.notes, weapon.tags, weapon.game, weapon.focusTags.join(","), weapon.recommendation, weapon.rankPosition, weapon.season, weapon.postedAt, id]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

  const pool = getMySqlPool();
  const [header] = await pool.query<mysql.ResultSetHeader>(
    `UPDATE owner_loadouts
     SET weapon_id = ?, weapon_name = ?, full_code = ?, title = ?, notes = ?, tags = ?, game = ?,
         focus_tags = ?, recommendation = ?, rank_position = ?, season = ?, posted_at = ?
     WHERE id = ?`,
    [weapon.weaponId, weapon.weaponName, weapon.code, weapon.title, weapon.notes, weapon.tags, weapon.game, weapon.focusTags.join(","), weapon.recommendation, weapon.rankPosition, weapon.season, weapon.postedAt, id]
  );
  if (header.affectedRows === 0) return null;
  const [rows] = await pool.query<mysql.RowDataPacket[]>(
    `SELECT id, weapon_id, weapon_name, full_code, title, notes, tags, game, focus_tags, recommendation, rank_position, season, posted_at, updated_at
     FROM owner_loadouts WHERE id = ?`,
    [id]
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function deleteOwnerLoadout(id: number): Promise<boolean> {
  await ensureOwnerLoadoutsTable();
  if (getDialect() === "postgres") {
    const result = await getPgPool().query("DELETE FROM owner_loadouts WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  }
  const [header] = await getMySqlPool().query<mysql.ResultSetHeader>(
    "DELETE FROM owner_loadouts WHERE id = ?",
    [id]
  );
  return header.affectedRows > 0;
}
