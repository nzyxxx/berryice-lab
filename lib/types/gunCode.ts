export interface GunCodeRecord {
  game: string;
  weapon: string;
  fullCode: string;
  description: string;
  valueText: string;
  copyCount: number;
  source: string;
  /** 方案作者。抓不到就空着。 */
  author: string;
  /** 来源页。卡片上只把这一处做成外链。 */
  sourceUrl: string;
  /** 稳定 / 腰射 / 远程 / 机动 / 低后座 / 满改 */
  focusTags: string[];
  /** 1–5。抓取的码没有人工分时留空，页面再用热度换算。 */
  recommendation: number | null;
  /** 本季版本排行，没有就是 null。 */
  rankPosition: number | null;
  season: string;
  postedAt: string;
}

export interface StoredGunCode extends GunCodeRecord {
  id: number;
  collectedAt: string;
}

export interface UpsertSummary {
  inserted: number;
  updated: number;
  skipped: number;
}
