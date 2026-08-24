/** 热门改枪 / 社区改枪码：仅分大战场、烽火两种模式 */

export const GAME_MODES = ["大战场", "烽火"] as const;
export type GameMode = (typeof GAME_MODES)[number];

const LEGACY_TO_MODE: Record<string, GameMode> = {
  大战场: "大战场",
  烽火: "烽火",
  三角洲行动: "大战场",
  烽火地带: "烽火",
};

export function normalizeGameMode(raw: string): GameMode {
  const trimmed = raw.trim();
  if (LEGACY_TO_MODE[trimmed]) return LEGACY_TO_MODE[trimmed];
  if (/烽火/.test(trimmed)) return "烽火";
  return "大战场";
}

export function isBeaconMode(raw: string): boolean {
  return normalizeGameMode(raw) === "烽火";
}

/** 查询数据库时兼容历史 game 字段 */
export function gameModeDbValues(mode: GameMode): string[] {
  return mode === "烽火" ? ["烽火", "烽火地带"] : ["大战场", "三角洲行动"];
}
