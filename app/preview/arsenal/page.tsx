import { SiteShell } from "@/components/lab/site-shell";
import { ArsenalShow, type ArsenalGun } from "@/components/preview/arsenal-show";
import { getGuns } from "@/lib/data/guns";
import { TYPE_SHORT_LABELS } from "@/lib/delta-gun/weapon-utils";
import type { Gun } from "@/lib/types/gun";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "枪械环",
  robots: { index: false, follow: false },
};

const SHOWCASE: { id: string; chapter?: string }[] = [
  { id: "ci-19", chapter: "步枪" },
  { id: "ak-12" },
  { id: "akm", chapter: "改枪码" },
  { id: "bizon" },
  { id: "mp5", chapter: "冲锋枪" },
  { id: "m700", chapter: "狙击" },
  { id: "m14" },
  { id: "m249" },
  { id: "desert-eagle" },
  { id: "725-double-barrel-shotgun" },
];

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
    imageUrl: `/preview/arsenal/${gun.id}.png`,
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
  return SHOWCASE.flatMap((slot) => {
    const gun = guns.find((item) => item.id === slot.id);
    return gun ? [{ ...toCard(gun), chapter: slot.chapter }] : [];
  });
}

export default async function ArsenalPreviewPage() {
  const guns = await getGuns();
  return (
    <SiteShell hideFooter>
      <ArsenalShow guns={pickGuns(guns)} />
    </SiteShell>
  );
}
