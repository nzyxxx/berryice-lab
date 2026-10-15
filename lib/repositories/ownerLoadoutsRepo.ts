import type mysql from "mysql2/promise";

import { getDialect, getMySqlPool, getPgPool } from "@/lib/db";
import { GAME_MODES, normalizeGameMode } from "@/lib/delta-gun/game-modes";
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
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
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

  return { weaponId, code, title, notes, tags: cleanTags, game };
}

export async function listOwnerLoadouts(): Promise<OwnerLoadout[]> {
  await ensureOwnerLoadoutsTable();
  if (getDialect() === "postgres") {
    const result = await getPgPool().query(
      `SELECT id, weapon_id, weapon_name, full_code, title, notes, tags, game, updated_at
       FROM owner_loadouts ORDER BY updated_at DESC, id DESC`
    );
    return result.rows.map((row) => mapRow(row));
  }

  const [rows] = await getMySqlPool().query<mysql.RowDataPacket[]>(
    `SELECT id, weapon_id, weapon_name, full_code, title, notes, tags, game, updated_at
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
      `INSERT INTO owner_loadouts (weapon_id, weapon_name, full_code, title, notes, tags, game)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, weapon_id, weapon_name, full_code, title, notes, tags, game, updated_at`,
      [weapon.weaponId, weapon.weaponName, weapon.code, weapon.title, weapon.notes, weapon.tags, weapon.game]
    );
    return mapRow(result.rows[0]);
  }

  const pool = getMySqlPool();
  const [header] = await pool.query<mysql.ResultSetHeader>(
    `INSERT INTO owner_loadouts (weapon_id, weapon_name, full_code, title, notes, tags, game)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [weapon.weaponId, weapon.weaponName, weapon.code, weapon.title, weapon.notes, weapon.tags, weapon.game]
  );
  const [rows] = await pool.query<mysql.RowDataPacket[]>(
    `SELECT id, weapon_id, weapon_name, full_code, title, notes, tags, game, updated_at
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
       SET weapon_id = $1, weapon_name = $2, full_code = $3, title = $4, notes = $5, tags = $6, game = $7, updated_at = NOW()
       WHERE id = $8
       RETURNING id, weapon_id, weapon_name, full_code, title, notes, tags, game, updated_at`,
      [weapon.weaponId, weapon.weaponName, weapon.code, weapon.title, weapon.notes, weapon.tags, weapon.game, id]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

  const pool = getMySqlPool();
  const [header] = await pool.query<mysql.ResultSetHeader>(
    `UPDATE owner_loadouts
     SET weapon_id = ?, weapon_name = ?, full_code = ?, title = ?, notes = ?, tags = ?, game = ?
     WHERE id = ?`,
    [weapon.weaponId, weapon.weaponName, weapon.code, weapon.title, weapon.notes, weapon.tags, weapon.game, id]
  );
  if (header.affectedRows === 0) return null;
  const [rows] = await pool.query<mysql.RowDataPacket[]>(
    `SELECT id, weapon_id, weapon_name, full_code, title, notes, tags, game, updated_at
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
