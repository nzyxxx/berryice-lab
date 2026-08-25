"use client";

import { StreamerCard } from "@/components/delta-gun/streamer-card";
import { Panel } from "@/components/lab/module-card";
import type { StoredStreamer, StreamerPlatform } from "@/lib/types/streamer";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

type PlatformTab = "all" | StreamerPlatform;

const PLATFORM_TABS: { key: PlatformTab; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "pc", label: "端游" },
  { key: "mobile", label: "手游" },
];

export function StreamersView({ streamers }: { streamers: StoredStreamer[] }) {
  const [platform, setPlatform] = useState<PlatformTab>("all");
  const [query, setQuery] = useState("");

  /** 远端有方案数为 0 的主播，点进去是死路，列表里不展示 */
  const published = useMemo(
    () => streamers.filter((item) => item.loadoutCount > 0),
    [streamers]
  );
  const emptyCount = streamers.length - published.length;

  const platformCounts = useMemo(() => {
    const counts = new Map<PlatformTab, number>([["all", published.length]]);
    for (const item of published) {
      counts.set(item.platform, (counts.get(item.platform) ?? 0) + 1);
    }
    return counts;
  }, [published]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return published.filter((item) => {
      if (platform !== "all" && item.platform !== platform) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.signatureWeapon.toLowerCase().includes(q) ||
        item.bio.toLowerCase().includes(q) ||
        item.roles.some((role) => role.toLowerCase().includes(q))
      );
    });
  }, [published, platform, query]);

  const totalLoadouts = useMemo(
    () => published.reduce((sum, item) => sum + item.loadoutCount, 0),
    [published]
  );

  if (streamers.length === 0) {
    return (
      <Panel className="py-16 text-center">
        <p className="text-lg font-medium text-lab-ink">还没有主播数据</p>
        <p className="mt-2 text-sm text-lab-ink-subtle">
          等待每日定时任务同步，或在服务端手动触发 <code className="font-mono">/api/streamers/refresh</code>
        </p>
      </Panel>
    );
  }

  return (
    <>
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: "主播", value: published.length },
          { label: "改枪方案", value: totalLoadouts },
          { label: "手游选手", value: platformCounts.get("mobile") ?? 0 },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-lab-hairline bg-lab-surface-1 px-4 py-3"
          >
            <p className="text-2xl font-semibold tracking-tight text-lab-ink">{stat.value}</p>
            <p className="mt-0.5 text-xs text-lab-ink-tertiary">{stat.label}</p>
          </div>
        ))}
      </div>

      <Panel className="mb-6 space-y-4 !p-4 sm:!p-5">
        <div className="flex flex-wrap gap-2">
          {PLATFORM_TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setPlatform(key)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                platform === key
                  ? "border-lab-primary/40 bg-lab-primary/15 text-lab-ink"
                  : "border-lab-hairline bg-lab-canvas text-lab-ink-subtle hover:border-lab-hairline-strong"
              )}
            >
              {label}
              <span className="ml-1.5 text-lab-ink-tertiary">{platformCounts.get(key) ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-lab-ink-tertiary" />
          <input
            type="search"
            placeholder="搜索主播、代表武器…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-10 w-full rounded-md border border-lab-hairline bg-lab-canvas pr-3 pl-10 text-sm outline-none focus:border-lab-primary/50 focus:ring-2 focus:ring-lab-primary/20"
          />
        </div>

        <p className="text-xs text-lab-ink-tertiary">
          显示 {visible.length} / {published.length} 位
          {emptyCount > 0 && ` · 另有 ${emptyCount} 位暂无公开方案`}
        </p>
      </Panel>

      {visible.length === 0 ? (
        <Panel className="py-16 text-center">
          <p className="text-lg font-medium text-lab-ink">没有匹配的主播</p>
          <p className="mt-2 text-sm text-lab-ink-subtle">换个关键词或切换平台试试</p>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((streamer) => (
            <StreamerCard key={streamer.slug} streamer={streamer} />
          ))}
        </div>
      )}
    </>
  );
}
