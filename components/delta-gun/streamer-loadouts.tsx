"use client";

import {
  CommunityCodeCard,
  type CommunityCodeItem,
} from "@/components/delta-gun/community-code-card";
import { Panel } from "@/components/lab/module-card";
import { inferWeaponType, weaponTypeLabel } from "@/lib/delta-gun/weapon-utils";
import type { StoredStreamerLoadout } from "@/lib/types/streamer";
import type { GunType } from "@/lib/types/gun";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

type CategoryTab = "all" | GunType;

/** 主播方案与社区枪码结构一致，方案名当作描述展示，复用同一张卡 */
function toCardItem(loadout: StoredStreamerLoadout): CommunityCodeItem {
  return {
    id: loadout.id,
    game: loadout.game,
    weapon: loadout.weapon,
    fullCode: loadout.fullCode,
    description: loadout.title,
    valueText: loadout.valueText,
    copyCount: loadout.copyCount,
    collectedAt: loadout.collectedAt,
  };
}

export function StreamerLoadouts({ loadouts }: { loadouts: StoredStreamerLoadout[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryTab>("all");
  const [toast, setToast] = useState("");

  const categories = useMemo(() => {
    const counts = new Map<CategoryTab, number>([["all", loadouts.length]]);
    for (const item of loadouts) {
      const type = inferWeaponType(item.weapon);
      counts.set(type, (counts.get(type) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => {
      if (a[0] === "all") return -1;
      if (b[0] === "all") return 1;
      return b[1] - a[1];
    });
  }, [loadouts]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return loadouts.filter((item) => {
      if (category !== "all" && inferWeaponType(item.weapon) !== category) return false;
      if (!q) return true;
      return (
        item.weapon.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.fullCode.toLowerCase().includes(q)
      );
    });
  }, [loadouts, category, query]);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setToast("枪码已复制");
    } catch {
      setToast("复制失败，请手动选中");
    }
    window.setTimeout(() => setToast(""), 3000);
  };

  if (loadouts.length === 0) {
    return (
      <Panel className="py-16 text-center">
        <p className="text-lg font-medium text-lab-ink">该主播暂无公开方案</p>
        <p className="mt-2 text-sm text-lab-ink-subtle">来源站点尚未收录，下次同步后会自动出现</p>
      </Panel>
    );
  }

  return (
    <>
      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed top-24 left-1/2 z-[100] -translate-x-1/2"
          >
            <div className="flex items-center gap-2 rounded-lg border border-lab-success/30 bg-lab-surface-2 px-4 py-2.5 text-sm shadow-xl backdrop-blur-xl">
              <Sparkles className="size-4 text-lab-success" />
              {toast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loadouts.length > 6 && (
        <Panel className="mb-5 space-y-4 !p-4">
          <div className="flex flex-wrap gap-2">
            {categories.map(([key, count]) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                  category === key
                    ? "border-lab-primary/40 bg-lab-primary/15 text-lab-ink"
                    : "border-lab-hairline bg-lab-canvas text-lab-ink-subtle hover:border-lab-hairline-strong"
                )}
              >
                {key === "all" ? "全部类型" : weaponTypeLabel(key)}
                <span className="ml-1.5 text-lab-ink-tertiary">{count}</span>
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-lab-ink-tertiary" />
            <input
              type="search"
              placeholder="搜索武器、方案名、枪码…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-10 w-full rounded-md border border-lab-hairline bg-lab-canvas pr-3 pl-10 text-sm outline-none focus:border-lab-primary/50 focus:ring-2 focus:ring-lab-primary/20"
            />
          </div>
        </Panel>
      )}

      {visible.length === 0 ? (
        <Panel className="py-12 text-center">
          <p className="text-sm text-lab-ink-subtle">没有匹配的方案</p>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {visible.map((loadout, index) => (
            <CommunityCodeCard
              key={loadout.id}
              item={toCardItem(loadout)}
              rank={category === "all" && !query ? index + 1 : undefined}
              onCopy={(code) => void copyCode(code)}
            />
          ))}
        </div>
      )}
    </>
  );
}
