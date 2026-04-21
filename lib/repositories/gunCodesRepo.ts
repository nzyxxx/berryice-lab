import type mysql from "mysql2/promise";
import { getDialect, getMySqlPool, getPgPool } from "@/lib/db";
import type { GunCodeRecord, StoredGunCode, UpsertSummary } from "@/lib/types/gunCode";

function mapRow(row: Record<string, unknown>): StoredGunCode {
  return {
    id: Number(row.id),
    game: String(row.game ?? "三角洲行动"),
    weapon: String(row.weapon ?? ""),
    fullCode: String(row.full_code ?? ""),
    description: String(row.description ?? ""),
    valueText: String(row.value_text ?? ""),
    copyCount: Number(row.copy_count ?? 0),
    source: String(row.source ?? "g.aitags.cn"),
    collectedAt: String(row.collected_at ?? ""),
  };
}

export async function ensureGunCodesTable(): Promise<void> {
  const dialect = getDialect();
  if (dialect === "postgres") {
    await getPgPool().query(`
      CREATE TABLE IF NOT EXISTS gun_codes (
        id BIGSERIAL PRIMARY KEY,
        game TEXT NOT NULL DEFAULT '三角洲行动',
        weapon TEXT NOT NULL,
        full_code TEXT NOT NULL,
        description TEXT DEFAULT '',
        value_text TEXT DEFAULT '',
        copy_count INTEGER DEFAULT 0,
        source TEXT DEFAULT 'g.aitags.cn',
        collected_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (weapon, full_code)
      )
    `);
    return;
  }

  const pool = getMySqlPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS gun_codes (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      game VARCHAR(50) NOT NULL DEFAULT '三角洲行动',
      weapon VARCHAR(255) NOT NULL,
      full_code VARCHAR(512) NOT NULL,
      description TEXT,
      value_text VARCHAR(255) DEFAULT '',
      copy_count INT DEFAULT 0,
      source VARCHAR(100) DEFAULT 'g.aitags.cn',
      collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_weapon_code (weapon(100), full_code(200))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  // 如果表已存在但没有 game 字段，自动补充
  await pool.query(`
    ALTER TABLE gun_codes
    ADD COLUMN IF NOT EXISTS game VARCHAR(50) NOT NULL DEFAULT '三角洲行动'
  `).catch(() => { /* 字段已存在则忽略 */ });
}

export async function upsertGunCodes(records: GunCodeRecord[]): Promise<UpsertSummary> {
  if (records.length === 0) return { inserted: 0, updated: 0 };

  const dialect = getDialect();
  let inserted = 0;
  let updated = 0;

  if (dialect === "postgres") {
    const pool = getPgPool();
    for (const item of records) {
      const result = await pool.query(
        `
          INSERT INTO gun_codes (game, weapon, full_code, description, value_text, copy_count, source, collected_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          ON CONFLICT (weapon, full_code) DO UPDATE
          SET game = EXCLUDED.game,
              description = EXCLUDED.description,
              value_text = EXCLUDED.value_text,
              copy_count = EXCLUDED.copy_count,
              source = EXCLUDED.source,
              collected_at = NOW()
          RETURNING (xmax = 0) AS inserted
        `,
        [item.game, item.weapon, item.fullCode, item.description, item.valueText, item.copyCount, item.source]
      );
      if (result.rows[0]?.inserted) inserted += 1;
      else updated += 1;
    }
    return { inserted, updated };
  }

  const pool = getMySqlPool();
  for (const item of records) {
    const [existing] = await pool.query<mysql.RowDataPacket[]>(
      "SELECT id FROM gun_codes WHERE weapon = ? AND full_code = ? LIMIT 1",
      [item.weapon, item.fullCode]
    );
    if ((existing as mysql.RowDataPacket[]).length > 0) updated += 1;
    else inserted += 1;

    await pool.query(
      `
        INSERT INTO gun_codes (game, weapon, full_code, description, value_text, copy_count, source, collected_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE
          game = VALUES(game),
          description = VALUES(description),
          value_text = VALUES(value_text),
          copy_count = VALUES(copy_count),
          source = VALUES(source),
          collected_at = CURRENT_TIMESTAMP
      `,
      [item.game, item.weapon, item.fullCode, item.description, item.valueText, item.copyCount, item.source]
    );
  }
  return { inserted, updated };
}

export async function listGunCodes(limit = 200, game?: string): Promise<StoredGunCode[]> {
  const dialect = getDialect();
  if (dialect === "postgres") {
    const result = game
      ? await getPgPool().query(
          `SELECT id, game, weapon, full_code, description, value_text, copy_count, source, collected_at
           FROM gun_codes WHERE game = $1 ORDER BY copy_count DESC, collected_at DESC LIMIT $2`,
          [game, limit]
        )
      : await getPgPool().query(
          `SELECT id, game, weapon, full_code, description, value_text, copy_count, source, collected_at
           FROM gun_codes ORDER BY copy_count DESC, collected_at DESC LIMIT $1`,
          [limit]
        );
    return result.rows.map((row) => mapRow(row));
  }

  const pool = getMySqlPool();
  const [rows] = game
    ? await pool.query<mysql.RowDataPacket[]>(
        `SELECT id, game, weapon, full_code, description, value_text, copy_count, source, collected_at
         FROM gun_codes WHERE game = ? ORDER BY copy_count DESC, collected_at DESC LIMIT ?`,
        [game, limit]
      )
    : await pool.query<mysql.RowDataPacket[]>(
        `SELECT id, game, weapon, full_code, description, value_text, copy_count, source, collected_at
         FROM gun_codes ORDER BY copy_count DESC, collected_at DESC LIMIT ?`,
        [limit]
      );
  return (rows as mysql.RowDataPacket[]).map((row) => mapRow(row as unknown as Record<string, unknown>));
}

export async function cleanupOldGunCodes(days = 30): Promise<number> {
  const dialect = getDialect();
  if (dialect === "postgres") {
    const result = await getPgPool().query(
      "DELETE FROM gun_codes WHERE collected_at < NOW() - ($1 || ' days')::INTERVAL",
      [days]
    );
    return result.rowCount ?? 0;
  }

  const pool = getMySqlPool();
  const [result] = await pool.query<mysql.ResultSetHeader>(
    "DELETE FROM gun_codes WHERE collected_at < DATE_SUB(NOW(), INTERVAL ? DAY)",
    [days]
  );
  return result.affectedRows;
}
