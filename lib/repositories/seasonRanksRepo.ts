import type mysql from "mysql2/promise";

import { getDialect, getMySqlPool, getPgPool } from "@/lib/db";
import { getGuns } from "@/lib/data/guns";
import { CURRENT_SEASON, seasonToken } from "@/lib/delta-gun/season";
import { ensureGunCodesTable } from "@/lib/repositories/gunCodesRepo";
import { VERIFIED_STREAMER_SEASON } from "@/lib/types/streamer";

/** 名次不是官方榜，页面上要写明。 */
export const SITE_COMPUTED_TIER = "本站推算";
export const SITE_COMPUTED_ALL_TIER = "全库推算";

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

function rankSeasonPrefix(season = CURRENT_SEASON): string {
  return `${seasonToken(season) || VERIFIED_STREAMER_SEASON}%`;
}

export async function listSeasonRanks(season = CURRENT_SEASON): Promise<SeasonRank[]> {
  await ensureSeasonRanksTable();
  const prefix = rankSeasonPrefix(season);
  if (getDialect() === "postgres") {
    const result = await getPgPool().query(
      `SELECT weapon_id, weapon_name, season, rank_position, tier
       FROM weapon_season_ranks
       WHERE season = $1 OR season LIKE $2
       ORDER BY rank_position ASC`,
      [season, prefix]
    );
    return result.rows.map((row) => mapRow(row));
  }
  const [rows] = await getMySqlPool().query<mysql.RowDataPacket[]>(
    `SELECT weapon_id, weapon_name, season, rank_position, tier
     FROM weapon_season_ranks
     WHERE season = ? OR season LIKE ?
     ORDER BY rank_position ASC`,
    [season, prefix]
  );
  return rows.map((row) => mapRow(row));
}

type ScoreRow = { weapon: string; s11Count: number; copies: number; recommendation: number };

async function loadWeaponScores(token: string): Promise<ScoreRow[]> {
  const like = `${token}%`;
  const sql = `
    SELECT weapon,
      SUM(CASE WHEN UPPER(season) LIKE ? THEN 1 ELSE 0 END) AS s11_count,
      SUM(COALESCE(copy_count, 0)) AS copies,
      AVG(recommendation) AS rec
    FROM gun_codes
    WHERE TRIM(weapon) <> ''
    GROUP BY weapon
  `;
  if (getDialect() === "postgres") {
    const result = await getPgPool().query(sql.replaceAll("?", "$1"), [like]);
    return result.rows.map((row) => ({
      weapon: String(row.weapon ?? ""),
      s11Count: Number(row.s11_count ?? 0),
      copies: Number(row.copies ?? 0),
      recommendation: Number(row.rec ?? 0),
    }));
  }
  const [rows] = await getMySqlPool().query<mysql.RowDataPacket[]>(sql, [like]);
  return rows.map((row) => ({
    weapon: String(row.weapon ?? ""),
    s11Count: Number(row.s11_count ?? 0),
    copies: Number(row.copies ?? 0),
    recommendation: Number(row.rec ?? 0),
  }));
}

/**
 * 表是空的时候，用现有枪码推一版名次。
 * 优先只数赛季号对得上的码；一条都没有时，才退回全部枪码的复制量。
 * 没有枪码的武器不进榜。
 */
export async function seedComputedSeasonRanks(): Promise<SeasonRank[]> {
  await ensureSeasonRanksTable();
  const token = seasonToken(CURRENT_SEASON) || VERIFIED_STREAMER_SEASON;
  const existing = await listSeasonRanks(token);
  if (existing.length > 0) return existing;

  await ensureGunCodesTable();
  const scores = await loadWeaponScores(token);
  const tagged = scores.filter((row) => row.s11Count > 0);
  const usingTagged = tagged.length > 0;
  const pool = usingTagged ? tagged : scores.filter((row) => row.copies > 0);
  if (pool.length === 0) return [];

  const guns = await getGuns();
  const byName = new Map(guns.map((gun) => [gun.name.replace(/\s+/g, "").toLowerCase(), gun]));
  const tier = usingTagged ? SITE_COMPUTED_TIER : SITE_COMPUTED_ALL_TIER;
  const ranked = pool
    .map((row) => {
      const gun = byName.get(row.weapon.replace(/\s+/g, "").toLowerCase());
      const score = usingTagged
        ? row.s11Count * 1000 + row.copies + row.recommendation * 50
        : row.copies;
      return {
        weaponId: (gun?.id || row.weapon).slice(0, 64),
        weaponName: gun?.name || row.weapon,
        score,
      };
    })
    .sort((a, b) => b.score - a.score || a.weaponName.localeCompare(b.weaponName, "zh-CN"));

  const written: SeasonRank[] = [];
  for (let index = 0; index < ranked.length; index += 1) {
    const item = ranked[index];
    const record: SeasonRank = {
      weaponId: item.weaponId,
      weaponName: item.weaponName,
      season: token,
      rankPosition: index + 1,
      tier,
    };
    if (getDialect() === "postgres") {
      await getPgPool().query(
        `INSERT INTO weapon_season_ranks (weapon_id, weapon_name, season, rank_position, tier)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (weapon_id, season) DO UPDATE
         SET weapon_name = EXCLUDED.weapon_name, rank_position = EXCLUDED.rank_position, tier = EXCLUDED.tier`,
        [record.weaponId, record.weaponName, record.season, record.rankPosition, record.tier]
      );
    } else {
      await getMySqlPool().query(
        `INSERT INTO weapon_season_ranks (weapon_id, weapon_name, season, rank_position, tier)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE weapon_name = VALUES(weapon_name), rank_position = VALUES(rank_position), tier = VALUES(tier)`,
        [record.weaponId, record.weaponName, record.season, record.rankPosition, record.tier]
      );
    }
    written.push(record);
  }
  return written;
}
