"use client";

import { GlassRing, type RingCard } from "@/components/delta-gun/glass-ring";
import { GunsLibrary } from "@/components/delta-gun/guns-library";
import { weaponTypeShortLabel } from "@/lib/delta-gun/weapon-utils";
import type { Gun } from "@/lib/types/gun";
import { useState } from "react";

const LOCAL_ART = new Set(["ak-12", "akm", "m4a1", "awm", "sr-25", "vector", "mp5", "bizon", "m249", "ci-19"]);

const STAT_LABELS: { key: keyof NonNullable<Gun["stats"]>; label: string }[] = [
  { key: "meatHarm", label: "伤害" },
  { key: "shootDistance", label: "射程" },
  { key: "control", label: "操控" },
];

function toCards(guns: Gun[]): RingCard[] {
  return guns.map((gun) => ({
    id: gun.id,
    kicker: weaponTypeShortLabel(gun.type),
    title: gun.name,
    imageUrl: LOCAL_ART.has(gun.id) ? `/arsenal/${gun.id}.webp` : gun.imageUrl,
    href: `/delta-gun/guns/${gun.id}`,
    stats: STAT_LABELS.flatMap(({ key, label }) => {
      const value = gun.stats?.[key];
      return value == null ? [] : [{ label, value: String(value) }];
    }),
  }));
}

export function GunRing({ guns }: { guns: Gun[] }) {
  const [list, setList] = useState(false);
  return (
    <div className="mt-8">
      <GlassRing cards={toCards(guns)} label="拖动、滚轮或方向键换枪。前面那张才是正文。" />
      <button
        type="button"
        onClick={() => setList((value) => !value)}
        className="mb-4 h-11 rounded-full border border-white/15 px-4 text-sm text-lab-ink-subtle"
      >
        {list ? "收起列表" : "完整列表"}
      </button>
      {list ? <GunsLibrary guns={guns} /> : null}
    </div>
  );
}
