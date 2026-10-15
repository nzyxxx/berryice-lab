import type mysql from "mysql2/promise";
import { clampCopyCount } from "@/lib/delta-gun/parse-copy-count";
import { gameModeDbValues, normalizeGameMode } from "@/lib/delta-gun/game-modes";
import type { GameMode } from "@/lib/delta-gun/game-modes";
import { getDialect, getMySqlPool, getPgPool } from "@/lib/db";
import type { GunCodeRecord, StoredGunCode, UpsertSummary } from "@/lib/types/gunCode";

const EMPTY_SUMMARY: UpsertSummary = { inserted: 0, updated: 0, skipped: 0 };

/** 单行脏数据。连接中断、语法错误不在这里，那些要让整次同步失败。 */
const MYSQL_ROW_ERRNO = new Set([1264, 1265, 1366, 1406]);
const MYSQL_ROW_CODE = new Set([
  "ER_WARN_DATA_OUT_OF_RANGE",
  "WARN_DATA_TRUNCATED",
  "ER_TRUNCATED_WRONG_VALUE",
  "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD",
  "ER_DATA_TOO_LONG",
]);
const PG_ROW_CODE = new Set(["22003", "22001", "22P02"]);

function isRowDataError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { errno?: unknown; code?: unknown };
  if (typeof candidate.errno === "number" && MYSQL_ROW_ERRNO.has(candidate.errno)) return true;
  if (typeof candidate.code !== "string") return false;
  return MYSQL_ROW_CODE.has(candidate.code) || PG_ROW_CODE.has(candidate.code);
}

function logSkipped(item: GunCodeRecord, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`跳过改枪码 ${item.weapon} / ${item.fullCode}: ${message}`);
}

function mapRow(row: Record<string, unknown>): StoredGunCode {
  return {
    id: Number(row.id),
    game: normalizeGameMode(String(row.game ?? "大战场")),
    weapon: String(row.weapon ?? ""),
    fullCode: String(row.full_code ?? ""),
    description: String(row.description ?? ""),
    valueText: String(row.value_text ?? ""),
    copyCount: Number(row.copy_count ?? 0),
    source: String(row.source ?? "g.aitags.cn"),
    author: String(row.author ?? ""),
    sourceUrl: String(row.source_url ?? ""),
    collectedAt: String(row.collected_at ?? ""),
  };
}

async function ensureGunCodeColumns(): Promise<void> {
  const dialect = getDialect();
  if (dialect === "postgres") {
    await getPgPool().query(`
      ALTER TABLE gun_codes ADD COLUMN IF NOT EXISTS author TEXT DEFAULT ''
    `);
    await getPgPool().query(`
      ALTER TABLE gun_codes ADD COLUMN IF NOT EXISTS source_url TEXT DEFAULT ''
    `);
    return;
  }

  const pool = getMySqlPool();
  await pool.query(`
    ALTER TABLE gun_codes
    ADD COLUMN IF NOT EXISTS author VARCHAR(120) NOT NULL DEFAULT ''
  `).catch(() => undefined);
  await pool.query(`
    ALTER TABLE gun_codes
    ADD COLUMN IF NOT EXISTS source_url VARCHAR(512) NOT NULL DEFAULT ''
  `).catch(() => undefined);
}

export async function ensureGunCodesTable(): Promise<void> {
  const dialect = getDialect();
  if (dialect === "postgres") {
    await getPgPool().query(`
      CREATE TABLE IF NOT EXISTS gun_codes (
        id BIGSERIAL PRIMARY KEY,
        game TEXT NOT NULL DEFAULT '大战场',
        weapon TEXT NOT NULL,
        full_code TEXT NOT NULL,
        description TEXT DEFAULT '',
        value_text TEXT DEFAULT '',
        copy_count INTEGER DEFAULT 0,
        source TEXT DEFAULT 'g.aitags.cn',
        author TEXT DEFAULT '',
        source_url TEXT DEFAULT '',
        collected_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (weapon, full_code)
      )
    `);
    await ensureGunCodeColumns();
    return;
  }

  const pool = getMySqlPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS gun_codes (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      game VARCHAR(50) NOT NULL DEFAULT '大战场',
      weapon VARCHAR(255) NOT NULL,
      full_code VARCHAR(512) NOT NULL,
      description TEXT,
      value_text VARCHAR(255) DEFAULT '',
      copy_count INT DEFAULT 0,
      source VARCHAR(100) DEFAULT 'g.aitags.cn',
      author VARCHAR(120) NOT NULL DEFAULT '',
      source_url VARCHAR(512) NOT NULL DEFAULT '',
      collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_weapon_code (weapon(100), full_code(200))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  // 如果表已存在但没有 game 字段，自动补充
  await pool.query(`
    ALTER TABLE gun_codes
    ADD COLUMN IF NOT EXISTS game VARCHAR(50) NOT NULL DEFAULT '大战场'
  `).catch(() => { /* 字段已存在则忽略 */ });
  await ensureGunCodeColumns();
}

export async function upsertGunCodes(records: GunCodeRecord[]): Promise<UpsertSummary> {
  if (records.length === 0) return EMPTY_SUMMARY;

  const dialect = getDialect();
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  const writeOne = async (item: GunCodeRecord): Promise<"inserted" | "updated"> => {
    const copyCount = clampCopyCount(item.copyCount);
    if (dialect === "postgres") {
      const result = await getPgPool().query(
        `
          INSERT INTO gun_codes (game, weapon, full_code, description, value_text, copy_count, source, author, source_url, collected_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          ON CONFLICT (weapon, full_code) DO UPDATE
          SET game = EXCLUDED.game,
              description = EXCLUDED.description,
              value_text = EXCLUDED.value_text,
              copy_count = EXCLUDED.copy_count,
              source = EXCLUDED.source,
              author = EXCLUDED.author,
              source_url = EXCLUDED.source_url,
              collected_at = NOW()
          RETURNING (xmax = 0) AS inserted
        `,
        [
          item.game,
          item.weapon,
          item.fullCode,
          item.description,
          item.valueText,
          copyCount,
          item.source,
          item.author,
          item.sourceUrl,
        ]
      );
      return result.rows[0]?.inserted ? "inserted" : "updated";
    }

    const pool = getMySqlPool();
    const [existing] = await pool.query<mysql.RowDataPacket[]>(
      "SELECT id FROM gun_codes WHERE weapon = ? AND full_code = ? LIMIT 1",
      [item.weapon, item.fullCode]
    );
    await pool.query(
      `
        INSERT INTO gun_codes (game, weapon, full_code, description, value_text, copy_count, source, author, source_url, collected_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE
          game = VALUES(game),
          description = VALUES(description),
          value_text = VALUES(value_text),
          copy_count = VALUES(copy_count),
          source = VALUES(source),
          author = VALUES(author),
          source_url = VALUES(source_url),
          collected_at = CURRENT_TIMESTAMP
      `,
      [
        item.game,
        item.weapon,
        item.fullCode,
        item.description,
        item.valueText,
        copyCount,
        item.source,
        item.author,
        item.sourceUrl,
      ]
    );
    return (existing as mysql.RowDataPacket[]).length > 0 ? "updated" : "inserted";
  };

  for (const item of records) {
    try {
      const outcome = await writeOne(item);
      if (outcome === "inserted") inserted += 1;
      else updated += 1;
    } catch (error) {
      if (!isRowDataError(error)) throw error;
      skipped += 1;
      logSkipped(item, error);
    }
  }

  if (inserted + updated === 0 && skipped > 0) {
    throw new Error(`改枪码全部写入失败（跳过 ${skipped} 条），详见日志`);
  }

  return { inserted, updated, skipped };
}

export async function listGunCodes(limit = 200, game?: string): Promise<StoredGunCode[]> {
  const dialect = getDialect();
  const mode = game ? normalizeGameMode(game) : undefined;
  const dbGames = mode ? gameModeDbValues(mode as GameMode) : null;

  if (dialect === "postgres") {
    const result = dbGames
      ? await getPgPool().query(
          `SELECT id, game, weapon, full_code, description, value_text, copy_count, source, author, source_url, collected_at
           FROM gun_codes WHERE game = ANY($1) ORDER BY copy_count DESC, collected_at DESC LIMIT $2`,
          [dbGames, limit]
        )
      : await getPgPool().query(
          `SELECT id, game, weapon, full_code, description, value_text, copy_count, source, author, source_url, collected_at
           FROM gun_codes ORDER BY copy_count DESC, collected_at DESC LIMIT $1`,
          [limit]
        );
    return result.rows.map((row) => mapRow(row));
  }

  const pool = getMySqlPool();
  const [rows] = dbGames
    ? await pool.query<mysql.RowDataPacket[]>(
        `SELECT id, game, weapon, full_code, description, value_text, copy_count, source, author, source_url, collected_at
         FROM gun_codes WHERE game IN (?, ?) ORDER BY copy_count DESC, collected_at DESC LIMIT ?`,
        [...dbGames, limit]
      )
    : await pool.query<mysql.RowDataPacket[]>(
        `SELECT id, game, weapon, full_code, description, value_text, copy_count, source, author, source_url, collected_at
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
