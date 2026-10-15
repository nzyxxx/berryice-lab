import { getGuns } from "@/lib/data/guns";
import { CURRENT_SEASON, seasonToken } from "@/lib/delta-gun/season";
import { weaponTypeLabel } from "@/lib/delta-gun/weapon-utils";
import { countGunCodes } from "@/lib/repositories/gunCodesRepo";
import { listStreamers } from "@/lib/repositories/streamersRepo";
import type { Gun, GunType } from "@/lib/types/gun";

const LOCAL_ART = new Set(["ak-12", "akm", "m4a1", "awm", "sr-25", "vector", "mp5", "bizon", "m249", "ci-19"]);

export type DashStat = { label: string; value: string };

export type DashGun = {
  id: string;
  name: string;
  type: GunType;
  typeLabel: string;
  imageUrl?: string;
  photo: boolean;
  tags: string[];
  stats: DashStat[];
  tip: string;
  figure: string;
};

export type DashboardData = {
  guns: DashGun[];
  weapons: number;
  codes: number;
  streamers: number;
  season: string;
  ratedPercent: number;
};

function tipFor(gun: Gun): string {
  const stats = gun.stats;
  if (!stats) return "这把枪还没有录入属性。";
  const parts = [
    stats.meatHarm != null ? `伤害 ${stats.meatHarm}` : "",
    stats.shootDistance != null ? `射程 ${stats.shootDistance}` : "",
    stats.control != null ? `操控 ${stats.control}` : "",
  ].filter(Boolean);
  if (parts.length === 0) return "属性字段是空的。";
  return `按录入的属性：${parts.join("，")}。`;
}

function toDashGun(gun: Gun): DashGun {
  const photo = LOCAL_ART.has(gun.id);
  const tags = [weaponTypeLabel(gun.type)];
  if (gun.stats?.caliber) tags.push(gun.stats.caliber);
  if (gun.stats?.fireMode) tags.push(gun.stats.fireMode);
  if (photo) tags.push("实拍");
  const stats: DashStat[] = [
    { label: "伤害", value: gun.stats?.meatHarm },
    { label: "射程", value: gun.stats?.shootDistance },
    { label: "操控", value: gun.stats?.control },
    { label: "稳定", value: gun.stats?.stable },
    { label: "后坐", value: gun.stats?.recoil },
    { label: "射速", value: gun.stats?.fireSpeed },
  ].flatMap((row) => (row.value == null ? [] : [{ label: row.label, value: String(row.value) }]));
  return {
    id: gun.id,
    name: gun.name,
    type: gun.type,
    typeLabel: weaponTypeLabel(gun.type),
    imageUrl: photo ? `/arsenal/${gun.id}.webp` : gun.imageUrl,
    photo,
    tags,
    stats,
    tip: tipFor(gun),
    figure: gun.stats?.meatHarm != null ? String(gun.stats.meatHarm) : "—",
  };
}

export async function loadDashboard(): Promise<DashboardData> {
  const guns = await getGuns();
  let codes = 0;
  let streamers = 0;
  try {
    codes = await countGunCodes();
    const people = await listStreamers();
    streamers = people.filter((person) => person.loadoutCount > 0).length;
  } catch (error) {
    console.error("三角洲统计读取失败:", error);
  }
  const dashGuns = guns.map(toDashGun);
  const rated = dashGuns.filter((gun) => gun.stats.length >= 3).length;
  return {
    guns: dashGuns,
    weapons: dashGuns.length,
    codes,
    streamers,
    season: seasonToken(CURRENT_SEASON) || "S11",
    ratedPercent: dashGuns.length ? Math.round((rated / dashGuns.length) * 100) : 0,
  };
}
