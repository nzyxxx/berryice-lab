"use client";

import {
  CommunityCodeCard,
  CommunityCodeCardSkeleton,
  type CommunityCodeItem,
} from "@/components/delta-gun/community-code-card";
import { MotionReveal } from "@/components/lab/motion-reveal";
import { Panel } from "@/components/lab/module-card";
import { Button } from "@/components/ui/button";
import { GameModeTabs } from "@/components/delta-gun/game-mode-tabs";
import { GAME_MODES, type GameMode } from "@/lib/delta-gun/game-modes";
import {
  inferWeaponType,
  parseValueScore,
  weaponTypeLabel,
} from "@/lib/delta-gun/weapon-utils";
import type { GunType } from "@/lib/types/gun";
import { cn } from "@/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AnimatePresence, motion } from "motion/react";
import { Flame, RefreshCw, Search, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type GameTab = GameMode;
type SortKey = "hot" | "value";
type CategoryTab = "all" | GunType;

const CATEGORY_TABS: { key: CategoryTab; label: string }[] = [
  { key: "all", label: "全部类型" },
  { key: "assault", label: "步枪" },
  { key: "smg", label: "冲锋枪" },
  { key: "marksman", label: "射手步枪" },
  { key: "sniper", label: "狙击" },
  { key: "shotgun", label: "霰弹" },
  { key: "pistol", label: "手枪" },
  { key: "lmg", label: "机枪" },
  { key: "special", label: "特殊" },
];

const ROW_HEIGHT = 196;
const COLS = 2;

function initialGameMode(searchParams: URLSearchParams | null): GameTab {
  const mode = searchParams?.get("mode");
  if (mode && GAME_MODES.includes(mode as GameMode)) return mode as GameMode;
  return "烽火";
}

export function CommunityCodesView({ showHero = true }: { showHero?: boolean }) {
  const searchParams = useSearchParams();
  const [communityCodes, setCommunityCodes] = useState<CommunityCodeItem[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [activeGame, setActiveGame] = useState<GameTab>(() =>
    initialGameMode(searchParams)
  );
  const [activeCategory, setActiveCategory] = useState<CategoryTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("hot");
  const parentRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 3200);
  };

  const loadCodes = useCallback(async (game: GameMode) => {
    setLoadingCodes(true);
    setError("");
    try {
      const url = `/api/gun-codes?limit=500&game=${encodeURIComponent(game)}`;
      const response = await fetch(url, { cache: "no-store" });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json.message ?? "读取失败");
      }
      setCommunityCodes(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "读取社区改枪码失败");
    } finally {
      setLoadingCodes(false);
    }
  }, []);

  const triggerRefresh = async () => {
    setRefreshing(true);
    setError("");
    try {
      const response = await fetch("/api/gun-codes/refresh", { method: "POST" });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json.message ?? "刷新失败");
      }
      showToast(`已同步 ${json.parsed} 条社区方案`);
      await loadCodes(activeGame);
    } catch (err) {
      setError(err instanceof Error ? err.message : "刷新失败");
    } finally {
      setRefreshing(false);
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      showToast("枪码已复制");
    } catch {
      setError("复制失败");
    }
  };

  useEffect(() => {
    void loadCodes(activeGame);
  }, [activeGame, loadCodes]);

  const handleGameChange = (game: GameTab) => {
    setActiveGame(game);
  };

  const filteredCodes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = [...communityCodes];

    if (activeCategory !== "all") {
      list = list.filter((item) => inferWeaponType(item.weapon) === activeCategory);
    }

    if (q) {
      list = list.filter(
        (item) =>
          item.weapon.toLowerCase().includes(q) ||
          item.fullCode.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === "value") return parseValueScore(b.valueText) - parseValueScore(a.valueText);
      return b.copyCount - a.copyCount;
    });

    return list;
  }, [communityCodes, searchQuery, sortBy, activeCategory]);

  const hotRankMap = useMemo(() => {
    const sorted = [...communityCodes].sort((a, b) => b.copyCount - a.copyCount);
    const map = new Map<string, number>();
    sorted.slice(0, 3).forEach((item, index) => {
      map.set(`${item.weapon}-${item.fullCode}`, index + 1);
    });
    return map;
  }, [communityCodes]);

  const topThree = useMemo(() => filteredCodes.slice(0, 3), [filteredCodes]);
  const listCodes = useMemo(() => filteredCodes.slice(3), [filteredCodes]);

  const rowCount = Math.ceil(listCodes.length / COLS);
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 4,
  });

  const categoryStats = useMemo(() => {
    const counts = new Map<CategoryTab, number>();
    counts.set("all", communityCodes.length);
    for (const item of communityCodes) {
      const t = inferWeaponType(item.weapon);
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return counts;
  }, [communityCodes]);

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

      {showHero && (
        <MotionReveal className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-display-section text-lab-ink">社区改枪码</h1>
              <p className="mt-2 max-w-xl text-base text-lab-ink-subtle">
                同步社区热门改枪码，按武器类型筛选，支持搜索与一键导入改枪页。
              </p>
            </div>
            <Button
              onClick={() => void triggerRefresh()}
              disabled={refreshing}
              className="rounded-md bg-lab-primary text-lab-canvas hover:bg-lab-primary-hover"
            >
              <RefreshCw className={cn("mr-2 size-4", refreshing && "animate-spin")} />
              {refreshing ? "同步中…" : "同步最新"}
            </Button>
          </div>
        </MotionReveal>
      )}

      {!loadingCodes && topThree.length > 0 && (
        <MotionReveal delay={0.05} className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-lab-ink">
            <Flame className="size-4 text-lab-primary" />
            今日热门
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {topThree.map((item, i) => (
              <motion.div
                key={`top-${item.weapon}-${item.fullCode}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
              >
                <CommunityCodeCard
                  item={item}
                  rank={i + 1}
                  featured
                  onCopy={(code) => void copyCode(code)}
                />
              </motion.div>
            ))}
          </div>
        </MotionReveal>
      )}

      <Panel className="mb-6 space-y-4 !p-4 sm:!p-5">
        <GameModeTabs value={activeGame} onChange={handleGameChange} />

        <div className="flex flex-wrap gap-2">
          {CATEGORY_TABS.map(({ key, label }) => {
            const count = categoryStats.get(key) ?? 0;
            if (key !== "all" && count === 0) return null;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveCategory(key)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                  activeCategory === key
                    ? "border-lab-primary/40 bg-lab-primary/15 text-lab-ink"
                    : "border-lab-hairline bg-lab-canvas text-lab-ink-subtle hover:border-lab-hairline-strong"
                )}
              >
                {label}
                <span className="ml-1.5 text-lab-ink-tertiary">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-lab-ink-tertiary" />
            <input
              type="search"
              placeholder="搜索武器、描述、枪码…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-md border border-lab-hairline bg-lab-canvas pr-3 pl-10 font-mono text-sm outline-none focus:border-lab-primary/50 focus:ring-2 focus:ring-lab-primary/20"
            />
          </div>
          <div className="flex rounded-md border border-lab-hairline bg-lab-canvas p-1">
            {(
              [
                { key: "hot" as const, label: "热度", icon: TrendingUp },
                { key: "value" as const, label: "价值", icon: Sparkles },
              ] as const
            ).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setSortBy(key)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium",
                  sortBy === key
                    ? "bg-lab-surface-2 text-lab-ink"
                    : "text-lab-ink-tertiary hover:text-lab-ink-subtle"
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {!loadingCodes && (
          <p className="text-xs text-lab-ink-tertiary">
            显示 {filteredCodes.length} / {communityCodes.length} 条
            {activeCategory !== "all" && ` · ${weaponTypeLabel(activeCategory)}`}
          </p>
        )}
      </Panel>

      {error && (
        <div className="mb-4 rounded-lg border border-lab-error/25 bg-lab-error/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loadingCodes ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <CommunityCodeCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredCodes.length === 0 ? (
        <Panel className="py-16 text-center">
          <p className="text-lg font-medium text-lab-ink">暂无匹配方案</p>
          <p className="mt-2 text-sm text-lab-ink-subtle">调整筛选或点击同步拉取最新数据</p>
          <Button
            className="mt-6 bg-lab-primary hover:bg-lab-primary-hover"
            onClick={() => void triggerRefresh()}
          >
            立即同步
          </Button>
        </Panel>
      ) : (
        <div
          ref={parentRef}
          className="h-[min(72vh,900px)] overflow-auto rounded-lg border border-lab-hairline bg-lab-canvas/50 pr-1"
        >
          <div
            className="relative w-full"
            style={{ height: `${virtualizer.getTotalSize()}px` }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const rowIndex = virtualRow.index;
              const left = listCodes[rowIndex * COLS];
              const right = listCodes[rowIndex * COLS + 1];

              return (
                <div
                  key={virtualRow.key}
                  className="absolute top-0 left-0 grid w-full grid-cols-1 gap-3 p-3 md:grid-cols-2"
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {left && (
                    <CommunityCodeCard
                      item={left}
                      rank={hotRankMap.get(`${left.weapon}-${left.fullCode}`)}
                      onCopy={(code) => void copyCode(code)}
                    />
                  )}
                  {right && (
                    <CommunityCodeCard
                      item={right}
                      rank={hotRankMap.get(`${right.weapon}-${right.fullCode}`)}
                      onCopy={(code) => void copyCode(code)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!showHero && (
        <p className="mt-4 text-center text-xs text-lab-ink-tertiary">
          数据来自 g.aitags.cn ·{" "}
          <Link href="/delta-gun/my-loadouts" className="text-lab-primary hover:underline">
            查看我的枪码
          </Link>
        </p>
      )}
    </>
  );
}
