/** 主播 / 职业选手改枪方案。数据来源 yunmaku.com，与 g.aitags.cn 那条社区线互不干扰。 */

export const STREAMER_PLATFORMS = ["pc", "mobile"] as const;
export type StreamerPlatform = (typeof STREAMER_PLATFORMS)[number];

export interface StreamerRecord {
  /** 远端 slug，同时作为本站路由段 */
  slug: string;
  name: string;
  /** 主播 / 职业选手 / 改枪UP主 / 玩家 等原站标签 */
  roles: string[];
  signatureWeapon: string;
  bio: string;
  platform: StreamerPlatform;
  /** 原站给的头像底色，用于卡片光晕 */
  accentColor: string;
  avatarInitial: string;
  loadoutCount: number;
  source: string;
}

export interface StoredStreamer extends StreamerRecord {
  id: number;
  collectedAt: string;
}

export interface StreamerLoadoutRecord {
  /** 远端主键，唯一且稳定，用作 upsert 冲突键 */
  remoteId: number;
  streamerSlug: string;
  /** 方案名，如「3/7倍镜，高据枪」 */
  title: string;
  weapon: string;
  game: string;
  fullCode: string;
  valueText: string;
  copyCount: number;
  source: string;
}

export interface StoredStreamerLoadout extends StreamerLoadoutRecord {
  id: number;
  collectedAt: string;
}

export interface StreamerWithLoadouts extends StoredStreamer {
  loadouts: StoredStreamerLoadout[];
}

export interface StreamerSyncSummary {
  streamers: number;
  loadouts: number;
  skipped: number;
}
