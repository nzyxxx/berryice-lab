"use client";

import { GlassRing, type RingCard } from "@/components/delta-gun/glass-ring";
import { GunsLibrary } from "@/components/delta-gun/guns-library";
import { weaponTypeShortLabel } from "@/lib/delta-gun/weapon-utils";
import type { Gun } from "@/lib/types/gun";
import { useState } from "react";

const STAT_LABELS: { key: keyof NonNullable<Gun["stats"]>; label: string }[] = [
  { key: "meatHarm", label: "肉体伤害" },
  { key: "armorHarm", label: "护甲伤害" },
  { key: "shootDistance", label: "射程" },
  { key: "control", label: "操控" },
  { key: "stable", label: "稳定" },
  { key: "recoil", label: "后坐" },
];

function toCards(guns: Gun[]): RingCard[] {
  return guns.slice(0, 14).map((gun) => ({
    id: gun.id,
    kicker: weaponTypeShortLabel(gun.type),
    title: gun.name,
    line: gun.description?.slice(0, 28) || "点开看属性",
    back: (
      <span className="flex h-full flex-col justify-between text-left">
        <span>
          <span className="block text-lg font-semibold text-lab-ink">{gun.name}</span>
          <span className="mt-3 block space-y-1.5">
            {STAT_LABELS.map(({ key, label }) => {
              const value = gun.stats?.[key];
              return (
                <span key={key} className="flex justify-between text-xs text-lab-ink-subtle">
                  <span>{label}</span>
                  <span className="text-lab-ink">{value ?? "—"}</span>
                </span>
              );
            })}
          </span>
        </span>
        <a href={`/delta-gun/guns/${gun.id}`} className="text-sm text-lab-primary">
          打开枪械页
        </a>
      </span>
    ),
  }));
}

export function GunRing({ guns }: { guns: Gun[] }) {
  const [list, setList] = useState(false);
  return (
    <div className="mt-8">
      <GlassRing cards={toCards(guns)} label={`环上 ${Math.min(14, guns.length)} 把，列表里是全部`} />
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
