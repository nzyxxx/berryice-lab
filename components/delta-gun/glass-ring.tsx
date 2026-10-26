"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * 松手后按松开速度投到目标卡，弹簧从当前速度接着走。
 * 投影公式来自 Apple《Designing Fluid Interfaces》；
 * 摩擦思路来自 Yousuf Soomro 的 liquid-glass-carousel（MIT）。
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

type Mode = "idle" | "drag" | "spring";
type Geo = { radius: number; step: number; cardW: number; cardH: number; z: number; perspective: number };

const WIDE: Geo = { radius: 380, step: 32, cardW: 168, cardH: 292, z: -180, perspective: 1100 };
const NARROW: Geo = { radius: 148, step: 36, cardW: 128, cardH: 236, z: 0, perspective: 640 };

function wrapOffset(index: number, position: number, count: number) {
  const delta = index - position;
  return delta - count * Math.round(delta / count);
}

function nearestIndex(index: number, position: number, count: number) {
  const turns = Math.round((position - index) / count);
  return index + turns * count;
}

function project(unitsPerSecond: number) {
  const deceleration = 0.998;
  return (unitsPerSecond / 1000) * deceleration / (1 - deceleration);
}

function rubber(overshoot: number, dimension = 0.22, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

export function GlassRing({ cards, label }: { cards: RingCard[]; label?: string }) {
  const count = cards.length;
  const stageRef = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<string, HTMLDivElement>());
  const motion = useRef({
    pos: 0,
    vel: 0,
    mode: "idle" as Mode,
    flick: false,
    springTo: null as number | null,
    zoom: 1,
    zoomTo: 1,
    lift: 0,
    liftTo: 0,
    last: 0,
  });
  const geo = useRef<Geo>(WIDE);
  const focusRef = useRef(0);
  const pressRef = useRef<string | null>(null);
  const hoverRef = useRef<string | null>(null);
  const rafRef = useRef(0);
  const dragged = useRef(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState(cards[0]?.id ?? "");
  const [list, setList] = useState(false);
  const openRef = useRef<string | null>(null);
  openRef.current = openId;

  const layout = () => {
    const m = motion.current;
    const g = geo.current;
    const stage = stageRef.current;
    if (stage) stage.style.perspective = `${g.perspective}px`;
    const ring = stage?.querySelector<HTMLElement>("[data-ring]");
    if (ring) ring.style.transform = `translateZ(${g.z}px) scale(${m.zoom})`;
    nodes.current.forEach((el, id) => {
      const index = Number(el.dataset.index ?? 0);
      const offset = count ? wrapOffset(index, m.pos, count) : 0;
      if (Math.abs(offset) > 1.45) {
        el.style.visibility = "hidden";
        return;
      }
      el.style.visibility = "visible";
      const angle = offset * g.step;
      const depth = Math.min(1, Math.abs(offset));
      const cardId = id;
      const isFocus = cardId === cards[focusRef.current]?.id;
      const pressed = pressRef.current === cardId;
      const hovering = hoverRef.current === cardId && m.mode === "idle";
      const scale = (isFocus ? (openRef.current === cardId ? 1.08 : 1.04) : 1 - depth * 0.06) * (pressed ? 0.97 : 1);
      const lift = hovering ? m.lift : 0;
      el.style.width = `${g.cardW}px`;
      el.style.height = `${g.cardH}px`;
      el.style.zIndex = String(30 - Math.round(Math.abs(angle)));
      el.style.opacity = String(Math.max(0.28, 1 - Math.abs(offset) * 0.4));
      el.style.transform = `translate(-50%, -50%) rotateY(${angle}deg) translateZ(${g.radius}px) translateY(${lift}px) scale(${scale})`;
      el.dataset.face = isFocus ? "front" : "side";
      const panel = el.firstElementChild as HTMLElement | null;
      if (panel) {
        panel.style.borderColor = isFocus ? "color-mix(in srgb, var(--lab-primary) 70%, transparent)" : "rgba(255,255,255,0.15)";
        panel.style.background = isFocus
          ? "color-mix(in srgb, var(--lab-primary) 12%, rgba(255,255,255,0.06))"
          : "rgba(255,255,255,0.06)";
      }
    });
  };

  const api = useRef({ tick: () => {} });

  const kick = () => {
    if (rafRef.current) return;
    motion.current.last = 0;
    rafRef.current = requestAnimationFrame(() => api.current.tick());
  };

  api.current.tick = () => {
    const m = motion.current;
    const now = performance.now();
    const dt = Math.min(0.032, m.last ? (now - m.last) / 1000 : 0.016);
    m.last = now;
    let alive = false;

    if (m.mode === "spring" && m.springTo != null) {
      const delta = m.springTo - m.pos;
      if (m.flick) {
        m.vel = m.vel * 0.86 + delta * 0.16;
      } else {
        m.vel = m.vel * 0.55 + delta * 0.42;
      }
      m.pos += m.vel;
      alive = true;
      if (Math.abs(delta) < 0.0015 && Math.abs(m.vel) < 0.0015) {
        m.pos = m.springTo;
        m.vel = 0;
        m.mode = "idle";
        m.flick = false;
        m.springTo = null;
      }
    }

    if (Math.abs(m.zoomTo - m.zoom) > 0.001) {
      m.zoom += (m.zoomTo - m.zoom) * Math.min(1, dt * 12);
      alive = true;
    } else {
      m.zoom = m.zoomTo;
    }

    const liftDelta = m.liftTo - m.lift;
    if (Math.abs(liftDelta) > 0.05) {
      m.lift += liftDelta * Math.min(1, dt * 14);
      alive = true;
    } else {
      m.lift = m.liftTo;
    }

    layout();
    rafRef.current = alive ? requestAnimationFrame(() => api.current.tick()) : 0;
  };

  const springTo = (index: number, flick: boolean) => {
    if (!count) return;
    const m = motion.current;
    m.mode = "spring";
    m.flick = flick;
    m.springTo = nearestIndex(((index % count) + count) % count, m.pos, count);
    if (!flick) m.vel *= 0.35;
    kick();
  };

  const choose = (index: number, open: boolean) => {
    const card = cards[index];
    if (!card) return;
    focusRef.current = index;
    setFocusId(card.id);
    if (open) setOpenId(card.id);
    springTo(index, false);
    layout();
  };

  useEffect(() => {
    const applyGeo = () => {
      geo.current = window.matchMedia("(max-width: 767px)").matches ? NARROW : WIDE;
      layout();
    };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onReduce = () => setList(reduce.matches);
    applyGeo();
    onReduce();
    window.addEventListener("resize", applyGeo);
    reduce.addEventListener("change", onReduce);
    return () => {
      window.removeEventListener("resize", applyGeo);
      reduce.removeEventListener("change", onReduce);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [count]);

  useEffect(() => {
    layout();
  }, [openId, focusId, list, count]);

  useEffect(() => {
    const node = stageRef.current;
    if (!node || list) return;
    let idle = 0;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const m = motion.current;
      const min = 0.84;
      const max = 1.16;
      const raw = m.zoomTo - event.deltaY * 0.0011;
      if (raw < min) m.zoomTo = min - rubber(min - raw);
      else if (raw > max) m.zoomTo = max + rubber(raw - max);
      else m.zoomTo = raw;
      kick();
      window.clearTimeout(idle);
      idle = window.setTimeout(() => {
        if (m.zoomTo < min) m.zoomTo = min;
        if (m.zoomTo > max) m.zoomTo = max;
        kick();
      }, 140);
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      node.removeEventListener("wheel", onWheel);
      window.clearTimeout(idle);
    };
  }, [list]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (list || !count) return;
    if ((event.target as HTMLElement).closest("a, button")) return;
    const card = (event.target as HTMLElement).closest<HTMLElement>("[data-card-id]");
    pressRef.current = card?.dataset.cardId ?? null;
    layout();
    const startX = event.clientX;
    const startY = event.clientY;
    const grabPos = motion.current.pos;
    let lastX = startX;
    let axis: "x" | "y" | null = null;
    let px = 180;
    dragged.current = false;
    const history: { pos: number; t: number }[] = [{ pos: grabPos, t: performance.now() }];
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);

    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!axis) {
        if (Math.hypot(dx, dy) < 8) return;
        axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        if (axis === "x") {
          const m = motion.current;
          m.mode = "drag";
          m.springTo = null;
          m.liftTo = 0;
          const boxes = [...nodes.current.values()]
            .map((el) => el.getBoundingClientRect())
            .filter((box) => box.width > 48)
            .sort((a, b) => a.left - b.left);
          px = boxes.length >= 2 ? Math.max(80, Math.abs(boxes[1]!.left - boxes[0]!.left)) : geo.current.cardW * 1.2;
        }
      }
      if (axis !== "x") return;
      dragged.current = true;
      const m = motion.current;
      m.pos = grabPos + (startX - ev.clientX) / px;
      const now = performance.now();
      history.push({ pos: m.pos, t: now });
      while (history.length > 2 && now - history[0]!.t > 90) history.shift();
      lastX = ev.clientX;
      const nearest = ((Math.round(m.pos) % count) + count) % count;
      focusRef.current = nearest;
      layout();
    };
    const up = () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", up);
      pressRef.current = null;
      const m = motion.current;
      if (!dragged.current) {
        layout();
        return;
      }
      window.setTimeout(() => {
        dragged.current = false;
      }, 0);
      const now = performance.now();
      const sample = history[0] ?? { pos: m.pos, t: now - 16 };
      const dt = Math.max(16, now - sample.t);
      const unitsPerSecond = ((m.pos - sample.pos) / dt) * 1000;
      m.vel = unitsPerSecond / 60;
      m.flick = true;
      m.mode = "spring";
      m.springTo = Math.round(m.pos + project(unitsPerSecond));
      const landed = ((m.springTo % count) + count) % count;
      focusRef.current = landed;
      setFocusId(cards[landed]?.id ?? "");
      kick();
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", up);
    target.addEventListener(
      "pointercancel",
      () => {
        pressRef.current = null;
        motion.current.mode = "spring";
        motion.current.flick = false;
        motion.current.springTo = Math.round(motion.current.pos);
        kick();
      },
      { once: true }
    );
    void lastX;
  };

  const onKey = (event: React.KeyboardEvent) => {
    if (list || !count) return;
    const current = focusRef.current;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      choose((current + 1) % count, false);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      choose((current - 1 + count) % count, false);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const card = cards[current];
      if (card) setOpenId((id) => (id === card.id ? null : card.id));
    }
  };

  if (!count) return null;

  return (
    <div className="mb-8">
      {label ? <p className="mb-3 text-base text-lab-ink">{label}</p> : null}
      {list ? (
        <ul className="space-y-2">
          {cards.map((card, index) => (
            <li key={card.id}>
              <button
                type="button"
                onClick={() => choose(index, true)}
                className="flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left"
              >
                <span className="min-w-0">
                  <span className="block truncate text-xs text-lab-ink-subtle">{card.kicker}</span>
                  <span className="block truncate text-base text-lab-ink">{card.title}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div
          ref={stageRef}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onKeyDown={onKey}
          aria-label={label || "卡片环"}
          aria-roledescription="carousel"
          className="relative h-[440px] cursor-grab overflow-hidden outline-none active:cursor-grabbing max-sm:h-[380px]"
          style={{ touchAction: "pan-y" }}
        >
          <div data-ring className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
            {cards.map((card, index) => {
              const open = openId === card.id;
              const focused = focusId === card.id;
              return (
                <div
                  key={card.id}
                  data-card-id={card.id}
                  data-index={index}
                  ref={(node) => {
                    if (node) nodes.current.set(card.id, node);
                    else nodes.current.delete(card.id);
                  }}
                  className="absolute top-1/2 left-1/2 [backface-visibility:hidden]"
                  onMouseEnter={() => {
                    hoverRef.current = card.id;
                    if (motion.current.mode === "idle") {
                      motion.current.liftTo = -10;
                      kick();
                    }
                  }}
                  onMouseLeave={() => {
                    if (hoverRef.current === card.id) hoverRef.current = null;
                    motion.current.liftTo = 0;
                    kick();
                  }}
                >
                  <div
                    role="group"
                    aria-label={card.title}
                    aria-current={focused ? "true" : undefined}
                    onClick={() => {
                      if (dragged.current) return;
                      choose(index, true);
                    }}
                    className={cn(
                      "flex h-full cursor-pointer flex-col overflow-hidden rounded-[22px] border text-left backdrop-blur-lg",
                      "shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_8px_16px_rgba(0,0,0,0.08)]",
                      focused ? "border-lab-primary/70 bg-white/[0.07]" : "border-white/15 bg-white/[0.06]"
                    )}
                  >
                    {card.imageUrl ? (
                      <img src={card.imageUrl} alt="" draggable={false} className={cn("w-full shrink-0 object-contain px-3 pt-3", open ? "h-16" : "h-32")} />
                    ) : (
                      <div className="h-8 shrink-0" />
                    )}
                    <div className="flex min-h-0 flex-1 flex-col px-3.5 pt-2 pb-3">
                      <p className="truncate text-[11px] text-lab-ink-subtle">{card.kicker}</p>
                      <p className="mt-1 line-clamp-2 text-base leading-snug font-semibold text-lab-ink">{card.title}</p>
                      {open ? (
                        <div className="mt-3">
                          <ul className="space-y-1">
                            {(card.stats ?? []).slice(0, 3).map((stat) => (
                              <li key={stat.label} className="flex items-baseline justify-between gap-2 text-xs">
                                <span className="text-lab-ink-subtle">{stat.label}</span>
                                <span className="truncate text-lab-ink">{stat.value}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-2">
                            <CardActions card={card} />
                          </div>
                        </div>
                      ) : card.stats?.[0] ? (
                        <p className="mt-auto flex justify-between text-xs text-lab-ink-subtle">
                          <span>{card.stats[0].label}</span>
                          <span className="text-lab-ink">{card.stats[0].value}</span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
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
  if (!nodes.length) return null;
  return <span className="flex items-center gap-3">{nodes}</span>;
}
