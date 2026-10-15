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
