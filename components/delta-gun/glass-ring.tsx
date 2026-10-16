"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * 松手后的惯性，再弹簧吸到最近一张。
 * 摩擦常量来自 Yousuf Soomro 的 liquid-glass-carousel（MIT）。
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

const RADIUS = 380;
const STEP = 32;
const PERSPECTIVE = 1100;
const CARD_W = 168;
const CARD_H = 292;

type Mode = "idle" | "coast" | "spring";

function wrapOffset(index: number, position: number, count: number) {
  const delta = index - position;
  return delta - count * Math.round(delta / count);
}

function nearestIndex(index: number, position: number, count: number) {
  const turns = Math.round((position - index) / count);
  return index + turns * count;
}

export function GlassRing({ cards, label }: { cards: RingCard[]; label: string }) {
  const count = cards.length;
  const motion = useRef({
    pos: 0,
    vel: 0,
    mode: "idle" as Mode,
    springTo: null as number | null,
    zoom: 1,
    zoomTo: 1,
  });
  const rafRef = useRef(0);
  const dragged = useRef(false);
  const pendingOpen = useRef<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [pose, setPose] = useState({ pos: 0, zoom: 1, moving: false });
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [list, setList] = useState(false);

  const publish = () => {
    const m = motion.current;
    setPose({ pos: m.pos, zoom: m.zoom, moving: m.mode !== "idle" || Math.abs(m.zoom - m.zoomTo) > 0.001 });
  };

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  };

  const tick = () => {
    const m = motion.current;
    let alive = false;
    if (m.mode === "coast") {
      m.vel *= 0.865;
      m.pos += m.vel;
      alive = true;
      if (Math.abs(m.vel) < 0.012) {
        m.mode = "spring";
        m.springTo = Math.round(m.pos);
      }
    } else if (m.mode === "spring" && m.springTo != null) {
      const delta = m.springTo - m.pos;
      m.vel = m.vel * 0.72 + delta * 0.22;
      m.pos += m.vel;
      alive = true;
      if (Math.abs(delta) < 0.0012 && Math.abs(m.vel) < 0.0012) {
        m.pos = m.springTo;
        m.vel = 0;
        m.mode = "idle";
        m.springTo = null;
        const pending = pendingOpen.current;
        pendingOpen.current = null;
        if (pending) setOpenId(pending);
      }
    }
    if (Math.abs(m.zoomTo - m.zoom) > 0.001) {
      m.zoom += (m.zoomTo - m.zoom) * 0.18;
      alive = true;
    } else {
      m.zoom = m.zoomTo;
    }
    publish();
    rafRef.current = alive ? requestAnimationFrame(tick) : 0;
  };

  const kick = () => {
    if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
  };

  const springToIndex = (index: number) => {
    if (count === 0) return;
    const m = motion.current;
    m.mode = "spring";
    m.springTo = nearestIndex(index, m.pos, count);
    m.vel *= 0.4;
    kick();
  };

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setList(reduce.matches);
    apply();
    reduce.addEventListener("change", apply);
    return () => {
      reduce.removeEventListener("change", apply);
      stop();
    };
  }, []);

  useEffect(() => {
    const node = stageRef.current;
    if (!node || list) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const m = motion.current;
      const room = event.deltaY > 0 ? m.zoomTo - 0.84 : 1.16 - m.zoomTo;
      const ease = Math.max(0.18, room / 0.32);
      m.zoomTo = Math.min(1.16, Math.max(0.84, m.zoomTo - event.deltaY * 0.00105 * ease));
      kick();
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [list, count]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (list || count === 0) return;
    if ((event.target as HTMLElement).closest("a, button")) return;
    const m = motion.current;
    m.mode = "idle";
    m.springTo = null;
    m.vel = 0;
    const startX = event.clientX;
    const startY = event.clientY;
    let lastX = startX;
    let axis: "x" | "y" | null = null;
    dragged.current = false;
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);

    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!axis) {
        if (Math.hypot(dx, dy) < 5) return;
        axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }
      if (axis !== "x") return;
      dragged.current = true;
      setOpenId(null);
      const delta = ev.clientX - lastX;
      lastX = ev.clientX;
      const stepPx = 168;
      m.vel = -delta / stepPx;
      m.pos += m.vel;
      publish();
    };
    const up = () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", up);
      if (!dragged.current) return;
      window.setTimeout(() => {
        dragged.current = false;
      }, 0);
      m.mode = "coast";
      kick();
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", up);
    target.addEventListener("pointercancel", () => {
      m.mode = "spring";
      m.springTo = Math.round(m.pos);
      kick();
    }, { once: true });
  };

  const onKey = (event: React.KeyboardEvent) => {
    if (list || count === 0) return;
    const front = ((Math.round(motion.current.pos) % count) + count) % count;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setOpenId(null);
      springToIndex(front + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      setOpenId(null);
      springToIndex(front - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const card = cards[front];
      if (card) setOpenId((id) => (id === card.id ? null : card.id));
    }
  };

  if (count === 0) return null;
  const frontIndex = ((Math.round(pose.pos) % count) + count) % count;

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-end justify-between gap-3">
        <p className="text-sm text-lab-ink-subtle">{label}</p>
        <button
          type="button"
          onClick={() => setList((value) => !value)}
          className="h-11 rounded-full border border-lab-hairline px-4 text-xs text-lab-ink-subtle"
        >
          {list ? "看环" : "列表"}
        </button>
      </div>

      {list ? (
        <ul className="space-y-2">
          {cards.map((card) => (
            <li key={card.id} className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-lab-hairline bg-lab-surface-1/80 px-4 py-3">
              <span className="min-w-0">
                <span className="block truncate text-xs text-lab-ink-subtle">{card.kicker}</span>
                <span className="block truncate text-base text-lab-ink">{card.title}</span>
              </span>
              <CardActions card={card} />
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
          className="relative h-[440px] cursor-grab overflow-hidden outline-none active:cursor-grabbing"
          style={{ perspective: `${PERSPECTIVE}px`, touchAction: "pan-y" }}
        >
          <div
            className="absolute inset-0"
            style={{ transform: `translateZ(-180px) scale(${pose.zoom})`, transformStyle: "preserve-3d" }}
          >
            {cards.map((card, index) => {
              const offset = wrapOffset(index, pose.pos, count);
              if (Math.abs(offset) > 1.4) return null;
              const angle = offset * STEP;
              const depth = Math.min(1, Math.abs(offset));
              const front = Math.abs(offset) < 0.42;
              const open = front && openId === card.id;
              const hover = hoverId === card.id && !pose.moving && !front;
              const scale = (front ? (open ? 1.12 : 1.06) : 1 - depth * 0.08) * (hover ? 1.03 : 1);
              const lift = hover ? -12 : 0;
              return (
                <div
                  key={card.id}
                  className="absolute top-1/2 left-1/2 [backface-visibility:hidden]"
                  style={{
                    width: CARD_W,
                    height: CARD_H,
                    zIndex: 30 - Math.round(Math.abs(angle)),
                    opacity: Math.max(0.22, 1 - Math.abs(offset) * 0.42),
                    transform: `translate(-50%, -50%) rotateY(${angle}deg) translateZ(${RADIUS}px) translateY(${lift}px) rotateX(${hover ? 7 : 0}deg) scale(${scale})`,
                    transition: pose.moving ? "none" : "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                  onMouseEnter={() => setHoverId(card.id)}
                  onMouseLeave={() => setHoverId((id) => (id === card.id ? null : id))}
                >
                  <div
                    role="group"
                    aria-label={card.title}
                    aria-current={index === frontIndex ? "true" : undefined}
                    onClick={() => {
                      if (dragged.current) return;
                      if (front) {
                        pendingOpen.current = null;
                        setOpenId((id) => (id === card.id ? null : card.id));
                        return;
                      }
                      pendingOpen.current = card.id;
                      setOpenId(null);
                      springToIndex(index);
                    }}
                    className={cn(
                      "flex h-full cursor-pointer flex-col overflow-hidden rounded-[22px] border text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_18px_36px_rgba(0,0,0,0.32)] backdrop-blur-lg",
                      front ? "border-lab-primary/55 bg-lab-primary/20" : "border-white/15 bg-white/[0.06]"
                    )}
                  >
                    {card.imageUrl ? (
                      <img src={card.imageUrl} alt="" draggable={false} className={cn("w-full shrink-0 object-contain px-3 pt-3", open ? "h-20" : "h-36")} />
                    ) : (
                      <div className="h-10 shrink-0" />
                    )}
                    <div className="flex min-h-0 flex-1 flex-col px-3.5 pt-2 pb-3">
                      <p className="truncate text-[11px] tracking-[0.14em] text-lab-ink-subtle">{card.kicker}</p>
                      <p className="mt-1 line-clamp-2 text-base leading-snug font-semibold text-lab-ink">{card.title}</p>
                      {!open && card.stats?.[0] ? (
                        <p className="mt-auto flex items-baseline justify-between text-xs text-lab-ink-subtle">
                          <span>{card.stats[0].label}</span>
                          <span className="truncate text-lab-ink">{card.stats[0].value}</span>
                        </p>
                      ) : null}
                      {open ? (
                        <div className="mt-3 min-h-0 flex-1">
                          <ul className="space-y-1">
                            {(card.stats ?? []).slice(0, 3).map((stat) => (
                              <li key={stat.label} className="flex items-baseline justify-between gap-2 text-xs">
                                <span className="shrink-0 text-lab-ink-subtle">{stat.label}</span>
                                <span className="truncate text-lab-ink">{stat.value}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-2">
                            <CardActions card={card} />
                          </div>
                        </div>
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
  if (nodes.length === 0) return null;
  return <span className="flex items-center gap-3">{nodes}</span>;
}
