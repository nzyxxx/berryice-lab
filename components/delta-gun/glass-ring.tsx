"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * 松手后的摩擦和吸附，改自 Yousuf Soomro 的 liquid-glass-carousel（MIT）。
 * 排法是平面封面流：侧卡只缩小、变淡，不再转成一条棱。
 *
 * Copyright (c) 2026 Yousuf Soomro
 * https://github.com/Yousuf-developer/liquid-glass-carousel
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 */

export type RingStat = { label: string; value: string };

export type RingCard = {
  id: string;
  kicker: string;
  title: string;
  imageUrl?: string;
  stats?: RingStat[];
  href?: string;
  actionLabel?: string;
  onAction?: () => void;
};

type Layout = "cover" | "list";

type Metrics = {
  window: number;
  width: number;
  height: number;
  slots: number[];
  scales: number[];
};

const DESKTOP: Metrics = {
  window: 3,
  width: 200,
  height: 372,
  slots: [0, 196, 360, 496],
  scales: [1, 0.82, 0.68, 0.56],
};

const MOBILE: Metrics = {
  window: 1,
  width: 200,
  height: 352,
  slots: [0, 200],
  scales: [1, 0.88],
};

function wrapOffset(index: number, position: number, count: number) {
  const delta = index - position;
  return delta - count * Math.round(delta / count);
}

function place(abs: number, metrics: Metrics) {
  const last = metrics.slots.length - 1;
  const index = Math.min(last, Math.floor(abs));
  const next = Math.min(last, index + 1);
  const t = abs - index;
  return {
    x: metrics.slots[index]! + (metrics.slots[next]! - metrics.slots[index]!) * t,
    scale: metrics.scales[index]! + (metrics.scales[next]! - metrics.scales[index]!) * t,
  };
}

function nearestSlot(index: number, position: number, count: number) {
  const turns = Math.round((position - index) / count);
  return index + turns * count;
}

export function GlassRing({ cards, label }: { cards: RingCard[]; label: string }) {
  const [layout, setLayout] = useState<Layout>("cover");
  const [metrics, setMetrics] = useState<Metrics>(DESKTOP);
  const [position, setPosition] = useState(0);
  const positionRef = useRef(0);
  const coastRef = useRef(0);
  const dragged = useRef(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const count = cards.length;

  useEffect(() => {
    return () => {
      if (coastRef.current) cancelAnimationFrame(coastRef.current);
    };
  }, []);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine) and (min-width: 768px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      setLayout(reduce.matches ? "list" : "cover");
      setMetrics(fine.matches ? DESKTOP : MOBILE);
    };
    apply();
    fine.addEventListener("change", apply);
    reduce.addEventListener("change", apply);
    return () => {
      fine.removeEventListener("change", apply);
      reduce.removeEventListener("change", apply);
    };
  }, []);

  const stopCoast = () => {
    if (coastRef.current) cancelAnimationFrame(coastRef.current);
    coastRef.current = 0;
  };

  const commit = (value: number) => {
    positionRef.current = value;
    setPosition(value);
  };

  const animateTo = (target: number) => {
    stopCoast();
    const tick = () => {
      const delta = target - positionRef.current;
      if (Math.abs(delta) < 0.012) {
        commit(target);
        coastRef.current = 0;
        return;
      }
      commit(positionRef.current + delta * 0.18);
      coastRef.current = requestAnimationFrame(tick);
    };
    coastRef.current = requestAnimationFrame(tick);
  };

  const focusIndex = (index: number) => {
    if (count === 0) return;
    animateTo(nearestSlot(index, positionRef.current, count));
  };

  useEffect(() => {
    const node = stageRef.current;
    if (!node || layout !== "cover") return;
    let idle = 0;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      stopCoast();
      commit(positionRef.current + event.deltaY * 0.0016);
      window.clearTimeout(idle);
      idle = window.setTimeout(() => {
        animateTo(Math.round(positionRef.current));
      }, 140);
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      node.removeEventListener("wheel", onWheel);
      window.clearTimeout(idle);
    };
  }, [layout, count]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (layout !== "cover" || count === 0) return;
    if ((event.target as HTMLElement).closest("a, button")) return;
    stopCoast();
    const startX = event.clientX;
    const startY = event.clientY;
    let lastX = startX;
    let velocity = 0;
    let axis: "x" | "y" | null = null;
    dragged.current = false;
    const step = metrics.slots[1] || 196;
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);

    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!axis) {
        if (Math.hypot(dx, dy) < 6) return;
        axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }
      if (axis !== "x") return;
      dragged.current = true;
      const delta = ev.clientX - lastX;
      lastX = ev.clientX;
      velocity = -delta / step;
      commit(positionRef.current + velocity);
    };
    const up = () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", up);
      if (dragged.current) {
        window.setTimeout(() => {
          dragged.current = false;
        }, 0);
      }
      if (!dragged.current) return;
      let v = velocity;
      const coast = () => {
        v *= 0.865;
        if (Math.abs(v) < 0.012) {
          animateTo(Math.round(positionRef.current));
          return;
        }
        commit(positionRef.current + v);
        coastRef.current = requestAnimationFrame(coast);
      };
      coastRef.current = requestAnimationFrame(coast);
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", up);
    target.addEventListener("pointercancel", stopCoast, { once: true });
  };

  const onKey = (event: React.KeyboardEvent) => {
    if (layout !== "cover" || count === 0) return;
    const current = Math.round(positionRef.current);
    if (event.key === "ArrowRight") {
      event.preventDefault();
      animateTo(current + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      animateTo(current - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      animateTo(nearestSlot(0, positionRef.current, count));
    } else if (event.key === "End") {
      event.preventDefault();
      animateTo(nearestSlot(count - 1, positionRef.current, count));
    }
  };

  if (count === 0) return null;

  const active = ((Math.round(position) % count) + count) % count;
  const activeCard = cards[active];

  return (
    <div className="mb-8">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-lab-ink-subtle">{label}</p>
        <div className="flex rounded-full border border-white/10 p-1">
          {(["cover", "list"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setLayout(key)}
              className={cn(
                "h-11 rounded-full px-3 text-xs",
                layout === key ? "bg-white/10 text-lab-ink" : "text-lab-ink-subtle"
              )}
            >
              {key === "cover" ? "封面" : "列表"}
            </button>
          ))}
        </div>
      </div>

      {layout === "list" ? (
        <ul className="space-y-2">
          {cards.map((card) => (
            <li key={card.id}>
              <div className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <span className="min-w-0">
                  <span className="block truncate text-xs text-lab-ink-subtle">{card.kicker}</span>
                  <span className="block truncate text-base text-lab-ink">{card.title}</span>
                </span>
                <CardActions card={card} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div
          ref={stageRef}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onKeyDown={onKey}
          aria-label={label}
          aria-roledescription="carousel"
          className="relative mx-auto w-full cursor-grab overflow-hidden outline-none active:cursor-grabbing"
          style={{ height: metrics.height + 28, perspective: "1400px", touchAction: "pan-y" }}
        >
          {cards.map((card, index) => {
            const offset = wrapOffset(index, position, count);
            const abs = Math.abs(offset);
            if (abs > metrics.window + 0.65) return null;
            const { x, scale } = place(abs, metrics);
            const quiet = abs > 0.55;
            return (
              <div
                key={card.id}
                className="absolute left-1/2 top-1/2 [backface-visibility:hidden]"
                style={{
                  width: metrics.width,
                  height: metrics.height,
                  zIndex: 40 - Math.round(abs * 8),
                  transform: `translate(-50%, -50%) translate3d(${Math.sign(offset) * x}px, 0, 0) rotateY(${Math.max(-12, Math.min(12, offset * -7))}deg) scale(${scale})`,
                  opacity: Math.max(0.28, 1 - abs * 0.24),
                  filter: `brightness(${Math.max(0.62, 1 - abs * 0.12)})`,
                }}
              >
                <div
                  role="group"
                  aria-label={card.title}
                  aria-current={index === active ? "true" : undefined}
                  onClick={() => {
                    if (dragged.current) {
                      dragged.current = false;
                      return;
                    }
                    focusIndex(index);
                  }}
                  className="flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0c1018]/75 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-lg"
                >
                  <CardArt src={card.imageUrl} />
                  <div className="flex min-h-0 flex-1 flex-col px-3.5 pt-2 pb-3">
                    <p className="truncate text-[11px] tracking-[0.14em] text-lab-ink-subtle">{card.kicker}</p>
                    <p className="mt-1 line-clamp-2 shrink-0 text-base font-semibold leading-snug tracking-tight text-lab-ink">
                      {card.title}
                    </p>
                    {quiet ? null : (
                      <ul className="mt-3 space-y-1">
                        {(card.stats ?? []).slice(0, 3).map((stat) => (
                          <li key={stat.label} className="flex items-baseline justify-between gap-3 text-xs">
                            <span className="shrink-0 text-lab-ink-subtle">{stat.label}</span>
                            <span className="truncate text-lab-ink">{stat.value}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {quiet ? null : (
                      <div className="mt-auto pt-2">
                        <CardActions card={card} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <p className="sr-only" aria-live="polite">
            {activeCard ? `${active + 1} / ${count} ${activeCard.title}` : ""}
          </p>
        </div>
      )}
    </div>
  );
}

function CardArt({ src }: { src?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;
  return (
    <div className="flex h-44 shrink-0 items-center justify-center px-3 pt-4">
      <img
        src={src}
        alt=""
        draggable={false}
        className="max-h-full max-w-full object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function CardActions({ card }: { card: RingCard }) {
  const nodes: ReactNode[] = [];
  if (card.href) {
    nodes.push(
      <Link key="open" href={card.href} className="inline-flex h-11 items-center text-sm text-lab-primary" onClick={(event) => event.stopPropagation()}>
        打开
      </Link>
    );
  }
  if (card.onAction && card.actionLabel) {
    nodes.push(
      <button
        key="action"
        type="button"
        className="inline-flex h-11 items-center text-sm text-lab-primary"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          card.onAction?.();
        }}
      >
        {card.actionLabel}
      </button>
    );
  }
  if (nodes.length === 0) return null;
  return <div className="flex items-center gap-3">{nodes}</div>;
}
