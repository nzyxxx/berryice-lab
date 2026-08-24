import { guns } from "@/lib/data/guns-catalog";
import type { GunType } from "@/lib/types/gun";

const TYPE_LABELS: Record<GunType, string> = {
  assault: "突击步枪",
  smg: "冲锋枪",
  marksman: "精确射手步枪",
  sniper: "狙击步枪",
  shotgun: "霰弹枪",
  pistol: "手枪",
  lmg: "轻机枪",
  special: "特殊武器",
};

/** 卡片头像上显示的简短类型名 */
export const TYPE_SHORT_LABELS: Record<GunType, string> = {
  assault: "步枪",
  smg: "冲锋枪",
  marksman: "射手步枪",
  sniper: "狙击枪",
  shotgun: "霰弹枪",
  pistol: "手枪",
  lmg: "轻机枪",
  special: "特殊",
};

const TYPE_FROM_WEAPON_NAME: { pattern: RegExp; type: GunType }[] = [
  { pattern: /冲锋枪|SMG|MP\d|UZI|Vector|P90|野牛|勇士|SR-3|MK4/i, type: "smg" },
  { pattern: /精确射手|Mini-14|SKS|VSS|M14|SR-25|PSG/i, type: "marksman" },
  { pattern: /狙击|M82|AWM|SV-|M700|R93/i, type: "sniper" },
  { pattern: /复合弓|特殊|杠杆|发射器/i, type: "special" },
  { pattern: /霰弹|S12K|M870|M1014|双管|FS-12|725/i, type: "shotgun" },
  { pattern: /手枪|G17|G18|沙漠|左轮|93R|M1911|QSZ/i, type: "pistol" },
  { pattern: /轻机枪|机枪|PKM|M249|M250|QJB/i, type: "lmg" },
  { pattern: /突击步枪|战斗步枪|步枪|AK|AR|M4|SCAR|AUG|G3|腾龙|K416|AS\s*Val|Val/i, type: "assault" },
];

export function inferWeaponType(weaponName: string): GunType {
  for (const { pattern, type } of TYPE_FROM_WEAPON_NAME) {
    if (pattern.test(weaponName)) return type;
  }
  return "assault";
}

export function weaponTypeLabel(type: GunType): string {
  return TYPE_LABELS[type];
}

export function weaponTypeShortLabel(type: GunType): string {
  return TYPE_SHORT_LABELS[type];
}

export function parseValueScore(raw: string): number {
  const match = raw.match(/([\d.]+)\s*([kKwW万])?/);
  if (!match?.[1]) return 0;
  const num = Number.parseFloat(match[1]);
  const unit = match[2]?.toLowerCase();
  if (unit === "万" || unit === "k" || unit === "w") return num * 10_000;
  return num;
}

/** 将社区武器名映射到本地枪械库 id（用于导入改枪） */
export function resolveGunIdFromWeaponName(weaponName: string): string {
  const normalized = weaponName.toLowerCase().replace(/\s+/g, "");

  const exact = guns.find(
    (g) =>
      normalized.includes(g.id) ||
      weaponName.includes(g.name) ||
      g.name.replace(/\s/g, "").toLowerCase() === normalized
  );
  if (exact) return exact.id;

  const slugGuess = normalized
    .replace(/突击步枪|射手步枪|狙击步枪|冲锋枪|霰弹枪|战斗步枪|杠杆步枪/g, "")
    .replace(/[^a-z0-9-]/g, "");
  const bySlug = guns.find((g) => slugGuess.includes(g.id) || g.id.includes(slugGuess));
  if (bySlug) return bySlug.id;

  return guns[0]?.id ?? "m4a1";
}

export function buildGunImportUrl(weaponName: string, fullCode: string): string {
  const gunId = resolveGunIdFromWeaponName(weaponName);
  const params = new URLSearchParams({ code: fullCode, weapon: weaponName });
  return `/delta-gun/guns/${gunId}/loadout?${params.toString()}`;
}
