import type mysql from "mysql2/promise";

import { getDialect, getMySqlPool, getPgPool } from "@/lib/db";
import { CURRENT_SEASON } from "@/lib/delta-gun/season";

export interface SeasonRank {
  weaponId: string;
  weaponName: string;
  season: string;
  rankPosition: number;
  tier: string;
}

function mapRow(row: Record<string, unknown>): SeasonRank {
  return {
    weaponId: String(row.weapon_id ?? ""),
    weaponName: String(row.weapon_name ?? ""),
    season: String(row.season ?? ""),
    rankPosition: Number(row.rank_position ?? 0),
    tier: String(row.tier ?? ""),
  };
}

export async function ensureSeasonRanksTable(): Promise<void> {
  if (getDialect() === "postgres") {
    await getPgPool().query(`
      CREATE TABLE IF NOT EXISTS weapon_season_ranks (
        id BIGSERIAL PRIMARY KEY,
        weapon_id TEXT NOT NULL,
        weapon_name TEXT NOT NULL,
        season TEXT NOT NULL,
        rank_position INTEGER NOT NULL,
        tier TEXT DEFAULT '',
        UNIQUE (weapon_id, season)
      )
    `);
    return;
  }

  await getMySqlPool().query(`
    CREATE TABLE IF NOT EXISTS weapon_season_ranks (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      weapon_id VARCHAR(64) NOT NULL,
      weapon_name VARCHAR(255) NOT NULL,
      season VARCHAR(32) NOT NULL,
      rank_position INT NOT NULL,
      tier VARCHAR(16) DEFAULT '',
      UNIQUE KEY uniq_weapon_season (weapon_id, season)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

export async function listSeasonRanks(season = CURRENT_SEASON): Promise<SeasonRank[]> {
  await ensureSeasonRanksTable();
  if (getDialect() === "postgres") {
    const result = await getPgPool().query(
      `SELECT weapon_id, weapon_name, season, rank_position, tier
       FROM weapon_season_ranks WHERE season = $1 ORDER BY rank_position ASC`,
      [season]
    );
    return result.rows.map((row) => mapRow(row));
  }
  const [rows] = await getMySqlPool().query<mysql.RowDataPacket[]>(
    `SELECT weapon_id, weapon_name, season, rank_position, tier
     FROM weapon_season_ranks WHERE season = ? ORDER BY rank_position ASC`,
    [season]
  );
  return rows.map((row) => mapRow(row));
}
