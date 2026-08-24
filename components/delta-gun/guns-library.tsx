"use client";

import { WeaponPortrait } from "@/components/delta-gun/weapon-portrait";
import { Button } from "@/components/ui/button";
import { weaponTypeLabel } from "@/lib/delta-gun/weapon-utils";
import type { Gun, GunType } from "@/lib/types/gun";
import { cn } from "@/lib/utils";
import { RefreshCw, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const TYPE_FILTERS: { key: "all" | GunType; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "assault", label: "步枪" },
  { key: "smg", label: "冲锋枪" },
  { key: "marksman", label: "射手步枪" },
  { key: "sniper", label: "狙击" },
  { key: "shotgun", label: "霰弹" },
  { key: "pistol", label: "手枪" },
  { key: "lmg", label: "机枪" },
  { key: "special", label: "特殊" },
];

export function GunsLibrary({ guns }: { guns: Gun[] }) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | GunType>("all");
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guns.filter((gun) => {
      if (typeFilter !== "all" && gun.type !== typeFilter) return false;
      if (!q) return true;
      return (
        gun.name.toLowerCase().includes(q) ||
        gun.id.includes(q) ||
        gun.description?.toLowerCase().includes(q)
      );
    });
  }, [guns, query, typeFilter]);

  const typeCounts = useMemo(() => {
    const map = new Map<"all" | GunType, number>();
    map.set("all", guns.length);
    for (const gun of guns) {
      map.set(gun.type, (map.get(gun.type) ?? 0) + 1);
    }
    return map;
  }, [guns]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/weapons/refresh", { method: "POST" });
      const json = await res.json();
      if (json.ok) window.location.reload();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-lab-ink-tertiary" />
          <input
            type="search"
            placeholder="搜索枪械名称…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-md border border-lab-hairline bg-lab-surface-1 pr-3 pl-10 text-sm outline-none focus:border-lab-primary/50 focus:ring-2 focus:ring-lab-primary/20"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={refreshing}
          className="shrink-0 border-lab-hairline"
          onClick={() => void handleRefresh()}
        >
          <RefreshCw className={cn("mr-2 size-4", refreshing && "animate-spin")} />
          {refreshing ? "同步中…" : "同步枪械数据"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map(({ key, label }) => {
          const count = typeCounts.get(key) ?? 0;
          if (key !== "all" && count === 0) return null;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTypeFilter(key)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                typeFilter === key
                  ? "border-lab-primary/40 bg-lab-primary/15 text-lab-ink"
                  : "border-lab-hairline bg-lab-surface-1 text-lab-ink-subtle hover:border-lab-hairline-strong"
              )}
            >
              {label}
              <span className="ml-1.5 text-lab-ink-tertiary">{count}</span>
            </button>
          );
        })}
      </div>

      <p className="text-sm text-lab-ink-subtle">
        显示 {filtered.length} / {guns.length} 把武器 · 点击查看数值，进入改枪台搭配配件
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((gun) => (
          <Link
            key={gun.id}
            href={`/delta-gun/guns/${gun.id}`}
            className={cn(
              "group flex flex-col overflow-hidden rounded-lg border border-lab-hairline bg-lab-surface-1 transition-colors",
              "hover:border-lab-primary/35 hover:bg-lab-surface-2"
            )}
          >
            <div className="flex items-center justify-center border-b border-lab-hairline bg-lab-canvas/50 p-6">
              <WeaponPortrait
                name={gun.name}
                type={gun.type}
                imageUrl={gun.imageUrl ?? gun.thumbUrl}
                size="lg"
                className="!size-28 !rounded-md"
              />
            </div>
            <div className="flex flex-1 flex-col p-4">
              <p className="text-lg font-medium tracking-tight text-lab-ink group-hover:text-lab-primary">
                {gun.name}
              </p>
              <p className="mt-1 text-xs text-lab-ink-tertiary">{weaponTypeLabel(gun.type)}</p>
              <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-lab-ink-subtle">
                {gun.description}
              </p>
              {gun.stats && (
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-lab-ink-tertiary">
                  <span>肉伤 {gun.stats.meatHarm}</span>
                  <span>操控 {gun.stats.control}</span>
                  <span>射速 {gun.stats.fireSpeed}</span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-16 text-center text-lab-ink-subtle">没有匹配的枪械</p>
      )}
    </div>
  );
}
