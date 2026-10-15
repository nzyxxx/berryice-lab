"use client";

import { PortraitRing } from "@/components/delta-gun/portrait-ring";
import { DELTA_NAV, isDeltaNavActive } from "@/lib/delta-gun/navigation";
import type { DashGun, DashboardData } from "@/lib/delta-gun/load-dashboard";
import { cn } from "@/lib/utils";
import { Bell, Bookmark, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const AURORAS = [
  "radial-gradient(circle at 30% 30%, #ffffff 0%, #d5d8de 42%, #8d93a0 100%)",
  "radial-gradient(circle at 70% 30%, #ffd36a 0%, #ff7a3c 38%, #ff4d8d 100%)",
  "radial-gradient(circle at 40% 70%, #67e8f9 0%, #3b82f6 46%, #1d4ed8 100%)",
  "radial-gradient(circle at 60% 40%, #f0abfc 0%, #a855f7 40%, #4f46e5 100%)",
];

export function DashBoard({ data, title, subtitle }: { data: DashboardData; title: string; subtitle: string }) {
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const [openTypes, setOpenTypes] = useState<Record<string, boolean>>({ assault: true });
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [tilt, setTilt] = useState(true);
  const [cruise, setCruise] = useState(false);
  const [fast, setFast] = useState(false);
  const [zoom, setZoom] = useState(1);

  const guns = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data.guns;
    return data.guns.filter((gun) => gun.name.toLowerCase().includes(q) || gun.id.includes(q) || gun.typeLabel.includes(query.trim()));
  }, [data.guns, query]);

  useEffect(() => {
    setIndex(0);
  }, [query]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      const typing = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement;
      if (typing) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setIndex((value) => (guns.length ? (value + 1) % guns.length : 0));
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setIndex((value) => (guns.length ? (value - 1 + guns.length) % guns.length : 0));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [guns.length]);

  useEffect(() => {
    if (!cruise || guns.length === 0) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setIndex((value) => (value + 1) % guns.length);
    }, fast ? 1400 : 2800);
    return () => window.clearInterval(timer);
  }, [cruise, fast, guns.length]);

  const selected = guns[Math.min(index, Math.max(guns.length - 1, 0))];
  const groups = useMemo(() => {
    const map = new Map<string, DashGun[]>();
    for (const gun of guns) {
      const list = map.get(gun.typeLabel) ?? [];
      list.push(gun);
      map.set(gun.typeLabel, list);
    }
    return [...map.entries()];
  }, [guns]);

  const cards = [
    { en: "WEAPONS", label: "枪械数", value: String(data.weapons), ink: "text-[#121316]" },
    { en: "CODES", label: "改枪码数", value: String(data.codes), ink: "text-white" },
    { en: "CAST", label: "主播数", value: String(data.streamers), ink: "text-white" },
    { en: "SEASON", label: "本季", value: data.season, ink: "text-white" },
  ];

  const copyGun = async () => {
    if (!selected) return;
    const line = selected.stats.map((stat) => `${stat.label} ${stat.value}`).join(" · ");
    const text = line ? `${selected.name} · ${line}` : selected.name;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0c] px-3 pt-3 pb-24 text-white lg:h-screen lg:overflow-hidden lg:px-4 lg:pt-4 lg:pb-4">
      <div className="mx-auto grid h-full max-w-[1440px] gap-3 lg:grid-cols-[216px_minmax(0,1fr)_300px] lg:gap-4">
        <aside className="flex gap-1 overflow-x-auto rounded-[22px] border border-white/10 bg-white/[0.03] p-2 lg:flex-col lg:overflow-visible lg:p-3">
          <Link href="/" className="hidden items-center gap-2 px-2 py-2 lg:flex">
            <span className="flex size-8 items-center justify-center rounded-full bg-[#22c55e] text-xs font-bold text-[#05210f]">B</span>
            <span className="text-sm font-medium">BerryIce</span>
          </Link>
          {DELTA_NAV.map((item) => {
            const active = isDeltaNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-3 text-sm",
                  active ? "bg-[#22c55e] text-[#05210f]" : "text-white/70 hover:bg-white/5"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </aside>

        <div className="flex min-h-0 min-w-0 flex-col gap-3 lg:overflow-hidden">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 sm:w-52">
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              <p className="mt-1 text-xs text-white/45">{subtitle}</p>
            </div>
            <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3">
              <Search className="size-4 shrink-0 text-white/40" />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索枪械"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/30"
              />
              <kbd className="hidden rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] text-white/40 sm:inline">⌘K</kbd>
            </label>
            <div className="flex gap-2">
              <IconButton label="筛选" onClick={() => searchRef.current?.focus()}>
                <SlidersHorizontal className="size-4" />
              </IconButton>
              <IconButton
                label="复位"
                onClick={() => {
                  setIndex(0);
                  setZoom(1);
                  setCruise(false);
                }}
              >
                <RotateCcw className="size-4" />
              </IconButton>
              <IconButton label="提醒" onClick={() => searchRef.current?.focus()}>
                <Bell className="size-4" />
              </IconButton>
            </div>
          </header>

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {cards.map((card, cardIndex) => (
              <article key={card.en} className="relative h-[132px] overflow-hidden rounded-[22px] border border-white/10">
                <div className="dash-aurora" style={{ background: AURORAS[cardIndex] }} />
                <div className={cn("relative flex h-full flex-col justify-between p-4", card.ink)}>
                  <p className="text-[10px] tracking-[0.18em]">{card.en}</p>
                  <p className="text-4xl font-semibold tracking-tight">{card.value}</p>
                  <div className="flex items-end justify-between text-[11px]">
                    <span>{card.label}</span>
                    <span className="opacity-70">较昨日 —</span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="grid min-h-0 flex-1 gap-3 pb-16 lg:grid-cols-[240px_minmax(0,1fr)]">
            <section className="max-h-80 overflow-y-auto rounded-[22px] border border-white/10 bg-white/[0.03] p-2 lg:max-h-none">
              {groups.map(([label, rows]) => {
                const open = openTypes[label] ?? label === selected?.typeLabel;
                return (
                  <div key={label} className="mb-1">
                    <button
                      type="button"
                      onClick={() => setOpenTypes((current) => ({ ...current, [label]: !open }))}
                      className="flex h-11 w-full items-center justify-between rounded-2xl px-3 text-left text-xs text-white/70"
                    >
                      <span>{label}</span>
                      <span className="text-white/35">{rows.length}</span>
                    </button>
                    {open
                      ? rows.map((gun) => {
                          const active = gun.id === selected?.id;
                          return (
                            <button
                              key={gun.id}
                              type="button"
                              onClick={() => setIndex(guns.findIndex((item) => item.id === gun.id))}
                              className={cn(
                                "flex min-h-11 w-full items-center justify-between gap-2 rounded-2xl px-3 text-left",
                                active ? "bg-[#22c55e]/15 text-white" : "text-white/75 hover:bg-white/5"
                              )}
                            >
                              <span className="truncate text-sm">{gun.name}</span>
                              <span
                                className={cn(
                                  "shrink-0 rounded-full px-2 py-0.5 text-[10px]",
                                  gun.photo ? "bg-[#22c55e]/20 text-[#86efac]" : "bg-white/10 text-white/55"
                                )}
                              >
                                {gun.photo ? "实拍" : "图标"}
                              </span>
                            </button>
                          );
                        })
                      : null}
                  </div>
                );
              })}
            </section>

            <section className="relative flex min-h-[360px] flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#101113] lg:min-h-0">
              <div className="flex flex-wrap items-center gap-2 px-3 pt-3">
                <StagePill on={tilt} onClick={() => setTilt((value) => !value)}>
                  3D 环绕
                </StagePill>
                <StagePill on={cruise} onClick={() => setCruise((value) => !value)}>
                  自动巡航
                </StagePill>
                <StagePill
                  on={false}
                  onClick={() => {
                    setIndex(0);
                    setZoom(1);
                  }}
                >
                  复位视角
                </StagePill>
                <StagePill on={fast} onClick={() => setFast((value) => !value)}>
                  速度 2×
                </StagePill>
                <StagePill on={false} onClick={() => searchRef.current?.focus()}>
                  筛选
                </StagePill>
                <span className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-full border border-[#22c55e]/40 px-2.5 text-[11px] text-[#86efac]">
                  <span className="size-1.5 rounded-full bg-[#22c55e]" />
                  实时交互
                </span>
              </div>
              <div
                className="relative min-h-[280px] flex-1"
                onWheel={(event) => {
                  event.preventDefault();
                  setZoom((value) => Math.min(1.2, Math.max(0.85, value - event.deltaY * 0.0006)));
                }}
              >
                <PortraitRing guns={guns} index={index} onIndex={setIndex} tilt={tilt} zoom={zoom} />
                <div className="pointer-events-none absolute top-3 left-3 z-30 w-36 rounded-[20px] border border-white/15 bg-[#1a1c20]/80 p-3 backdrop-blur-lg">
                  <p className="text-[10px] tracking-[0.16em] text-white/50">{data.season} 属性</p>
                  <p className="mt-1 text-lg font-semibold">{data.ratedPercent}%</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-[#22c55e]" style={{ width: `${data.ratedPercent}%` }} />
                  </div>
                </div>
              </div>
              <p className="px-4 pb-4 text-center text-[11px] text-white/40">按住拖动卡片环 · 滚轮缩放 · 点击卡片聚焦</p>
            </section>
          </div>
        </div>

        <aside className="flex min-h-[420px] flex-col rounded-[22px] border border-white/10 bg-white/[0.03] p-4 lg:min-h-0 lg:overflow-y-auto">
          {selected ? (
            <>
              <p className="text-[11px] tracking-[0.16em] text-white/40">{selected.typeLabel}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">{selected.name}</h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {selected.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-white/70">
                    {tag}
                  </span>
                ))}
              </div>
              <dl className="mt-5 space-y-2">
                {selected.stats.map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between border-b border-white/8 py-2 text-sm">
                    <dt className="text-white/45">{stat.label}</dt>
                    <dd>{stat.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 rounded-[20px] border border-[#22c55e]/30 bg-[#22c55e]/10 p-3">
                <p className="text-[11px] tracking-[0.14em] text-[#86efac]">AI建议</p>
                <p className="mt-2 text-sm leading-relaxed text-white/80">{selected.tip}</p>
              </div>
              <div className="mt-auto flex gap-2 pt-6">
                <button type="button" onClick={() => void copyGun()} className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-[#22c55e] text-sm font-medium text-[#05210f]">
                  {copied ? "已复制属性" : "复制改枪码"}
                </button>
                <button
                  type="button"
                  onClick={() => setSaved((current) => ({ ...current, [selected.id]: !current[selected.id] }))}
                  className={cn(
                    "inline-flex h-11 items-center gap-1.5 rounded-full border px-4 text-sm",
                    saved[selected.id] ? "border-[#22c55e] text-[#86efac]" : "border-white/15 text-white/70"
                  )}
                >
                  <Bookmark className="size-4" />
                  收藏
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-white/45">没有选中的枪。</p>
          )}
        </aside>
      </div>

      <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 gap-1 rounded-full border border-white/10 bg-[#141416]/90 px-2 py-2 backdrop-blur-lg lg:left-[calc(50%-48px)]">
        {DELTA_NAV.map((item) => {
          const active = isDeltaNavActive(pathname, item.href);
          return (
              <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn(
                "inline-flex h-11 items-center rounded-full px-3 text-xs",
                active ? "bg-[#22c55e] text-[#05210f]" : "text-white/65"
              )}
            >
              <item.icon className="size-4 md:mr-1.5" />
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70"
    >
      {children}
    </button>
  );
}

function StagePill({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center rounded-full border px-3 text-[11px]",
        on ? "border-[#22c55e]/50 bg-[#22c55e]/15 text-[#86efac]" : "border-white/10 text-white/60"
      )}
    >
      {children}
    </button>
  );
}
