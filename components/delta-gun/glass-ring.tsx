"use client";

import { ParticleVeil } from "@/components/delta-gun/particle-card";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * 松手后的摩擦和吸附，改自 Yousuf Soomro 的 liquid-glass-carousel（MIT）。
 * 环本身仍是 CSS 3D，没有搬 three.js 镜头。
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

export type RingCard = {
  id: string;
  kicker: string;
  title: string;
  line: string;
  back: ReactNode;
};

type Layout = "ring" | "swipe" | "list";

export function GlassRing({ cards, label }: { cards: RingCard[]; label: string }) {
  const [layout, setLayout] = useState<Layout>("list");
  const [spin, setSpin] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const spinRef = useRef(0);
  const coastRef = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (coastRef.current) cancelAnimationFrame(coastRef.current);
    };
  }, []);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine) and (min-width: 768px)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setLayout(reduce ? "list" : fine ? "ring" : "swipe");
  }, []);

  useEffect(() => {
    const node = stageRef.current;
    if (!node || layout !== "ring") return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setZoom((value) => Math.min(1.25, Math.max(0.8, value - event.deltaY * 0.0008)));
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [layout]);

  const count = Math.max(cards.length, 1);
  const step = 360 / count;
  const radius = Math.max(240, count * 26);

  const stopCoast = () => {
    if (coastRef.current) cancelAnimationFrame(coastRef.current);
    coastRef.current = 0;
  };

  const face = (index: number) => {
    stopCoast();
    const current = spinRef.current;
    const target = -index * step;
    const delta = ((target - current + 540) % 360) - 180;
    spinRef.current = current + delta;
    setSpin(spinRef.current);
    setOpenId(cards[index]?.id ?? null);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (layout !== "ring" || event.pointerType === "touch") return;
    stopCoast();
    const startX = event.clientX;
    let lastX = startX;
    let velocity = 0;
    let moved = false;
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);

    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - lastX;
      lastX = ev.clientX;
      if (Math.abs(ev.clientX - startX) > 6) moved = true;
      velocity = dx * 0.28;
      spinRef.current += velocity;
      setSpin(spinRef.current);
    };
    const up = () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", up);
      if (!moved) return;
      let v = velocity;
      const settle = () => {
        const nearest = Math.round(spinRef.current / step) * step;
        const delta = nearest - spinRef.current;
        if (Math.abs(delta) < 0.2) {
          spinRef.current = nearest;
          setSpin(nearest);
          coastRef.current = 0;
          return;
        }
        spinRef.current += delta * 0.12;
        setSpin(spinRef.current);
        coastRef.current = requestAnimationFrame(settle);
      };
      const coast = () => {
        v *= 0.865;
        if (Math.abs(v) < 0.05) {
          coastRef.current = requestAnimationFrame(settle);
          return;
        }
        spinRef.current += v;
        setSpin(spinRef.current);
        coastRef.current = requestAnimationFrame(coast);
      };
      coastRef.current = requestAnimationFrame(coast);
      target.addEventListener("pointercancel", stopCoast, { once: true });
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", up);
  };

  const onKey = (event: React.KeyboardEvent) => {
    if (layout === "list") return;
    const index = Math.max(0, cards.findIndex((card) => card.id === openId));
    if (event.key === "ArrowRight") {
      event.preventDefault();
      face((index + 1) % cards.length);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      face((index - 1 + cards.length) % cards.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      setOpenId((id) => (id === cards[index]?.id ? null : cards[index]?.id ?? null));
    } else if (event.key === "Escape") {
      setOpenId(null);
    }
  };

  if (cards.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-white/50">{label}</p>
        <div className="flex rounded-full border border-white/10 p-1">
          {(["ring", "list"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setLayout(key)}
              className={cn(
                "h-9 rounded-full px-3 text-xs",
                layout === key ? "bg-white/10 text-white" : "text-white/45"
              )}
            >
              {key === "ring" ? "环" : "列表"}
            </button>
          ))}
        </div>
      </div>

      {layout === "list" ? (
        <ul className="space-y-2">
          {cards.map((card) => (
            <li key={card.id}>
              <button
                type="button"
                onClick={() => setOpenId((id) => (id === card.id ? null : card.id))}
                className="flex min-h-11 w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-left"
              >
                <span>
                  <span className="block text-sm text-white/45">{card.kicker}</span>
                  <span className="text-base text-white">{card.title}</span>
                </span>
                <span className="text-sm text-white/40">{card.line}</span>
              </button>
              {openId === card.id ? <div className="mt-2 rounded-2xl border border-white/10 p-4">{card.back}</div> : null}
            </li>
          ))}
        </ul>
      ) : layout === "swipe" ? (
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
          {cards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => setOpenId((id) => (id === card.id ? null : card.id))}
              className="w-64 shrink-0 snap-center rounded-3xl border border-white/10 bg-white/[0.05] p-5 text-left backdrop-blur-lg"
            >
              <CardFace card={card} open={openId === card.id} />
            </button>
          ))}
        </div>
      ) : (
        <div
          ref={stageRef}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onKeyDown={onKey}
          aria-label={label}
          className="relative h-[28rem] cursor-grab overflow-hidden outline-none active:cursor-grabbing"
          style={{ perspective: "1100px" }}
        >
          <div
            className="absolute inset-0 [transform-style:preserve-3d]"
            style={{ transform: `translateZ(${(zoom - 1) * 160}px) rotateY(${spin}deg)` }}
          >
            {cards.map((card, index) => (
              <div
                key={card.id}
                className="absolute left-1/2 top-1/2 h-64 w-52 [transform-style:preserve-3d]"
                style={{ transform: `translate(-50%, -50%) rotateY(${index * step}deg) translateZ(${radius}px)` }}
              >
                <button
                  type="button"
                  onClick={() => face(index)}
                  className="h-full w-full [transform-style:preserve-3d] text-left transition-transform duration-500"
                  style={{ transform: openId === card.id ? "rotateY(180deg)" : "none" }}
                >
                  <CardFace card={card} open={false} face="front" />
                  <CardFace card={card} open face="back" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CardFace({
  card,
  open,
  face = "front",
}: {
  card: RingCard;
  open: boolean;
  face?: "front" | "back";
}) {
  const flipped = face === "back";
  return (
    <span
      className={cn(
        "absolute inset-0 flex flex-col justify-between overflow-hidden rounded-3xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-lg [backface-visibility:hidden]",
        flipped && "[transform:rotateY(180deg)]"
      )}
    >
      {face === "front" ? <ParticleVeil title={card.title} kicker={card.kicker} /> : null}
      {flipped || open ? (
        card.back
      ) : (
        <>
          <span className="relative text-[11px] tracking-[0.16em] text-white/45">{card.kicker}</span>
          <span className="relative">
            <span className="block text-xl font-semibold tracking-tight text-white">{card.title}</span>
            <span className="mt-1 block text-sm text-white/45">{card.line}</span>
          </span>
        </>
      )}
    </span>
  );
}
