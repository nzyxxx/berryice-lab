export interface GunCodeRecord {
  game: string;
  weapon: string;
  fullCode: string;
  description: string;
  valueText: string;
  copyCount: number;
  source: string;
}

export interface StoredGunCode extends GunCodeRecord {
  id: number;
  collectedAt: string;
}

export interface UpsertSummary {
  inserted: number;
  updated: number;
}
