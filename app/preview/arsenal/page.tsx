import { ArsenalShow, type ArsenalGun } from "@/components/preview/arsenal-show";
import { getGuns } from "@/lib/data/guns";
import { TYPE_SHORT_LABELS } from "@/lib/delta-gun/weapon-utils";
import type { Gun, GunType } from "@/lib/types/gun";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "枪械环",
  robots: { index: false, follow: false },
};

const ORDER: GunType[] = ["assault", "smg", "sniper", "marksman", "lmg", "shotgun", "pistol", "special"];

const STATS: { key: "meatHarm" | "shootDistance" | "control" | "fireSpeed"; label: string; max: number }[] = [
  { key: "meatHarm", label: "伤害", max: 120 },
  { key: "shootDistance", label: "射程", max: 120 },
  { key: "control", label: "操控", max: 100 },
  { key: "fireSpeed", label: "射速", max: 900 },
];

function toCard(gun: Gun): ArsenalGun {
  return {
    id: gun.id,
    name: gun.name,
    typeLabel: TYPE_SHORT_LABELS[gun.type],
    imageUrl: gun.imageUrl ?? gun.thumbUrl ?? "",
    meta: gun.description ?? "",
    pageHref: `/delta-gun/guns/${gun.id}`,
    loadoutHref: `/delta-gun/guns/${gun.id}/loadout`,
    stats: STATS.flatMap((stat) => {
      const value = gun.stats?.[stat.key];
      return typeof value === "number" ? [{ label: stat.label, value, max: stat.max }] : [];
    }),
  };
}

function pickGuns(guns: Gun[]): ArsenalGun[] {
  const picked: ArsenalGun[] = [];
  for (const type of ORDER) {
    const gun = guns.find((item) => item.type === type && item.imageUrl && item.stats);
    if (gun) picked.push(toCard(gun));
  }
  return picked;
}

export default async function ArsenalPreviewPage() {
  const guns = await getGuns();
  return <ArsenalShow guns={pickGuns(guns)} />;
}
