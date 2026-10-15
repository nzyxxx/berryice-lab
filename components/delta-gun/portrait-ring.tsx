"use client";

import type { DashGun } from "@/lib/delta-gun/load-dashboard";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

type Metrics = {
  window: number;
  slots: number[];
  scales: number[];
  width: number;
  height: number;
};

const WIDE: Metrics = {
  window: 2,
  slots: [0, 136, 248],
  scales: [1, 0.9, 0.76],
  width: 128,
  height: 208,
};

const NARROW: Metrics = {
  window: 1,
  slots: [0, 128],
  scales: [1, 0.88],
  width: 148,
  height: 220,
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

export function PortraitRing({
  guns,
  index,
  onIndex,
  tilt,
  zoom,
}: {
  guns: DashGun[];
  index: number;
  onIndex: (index: number) => void;
  tilt: boolean;
  zoom: number;
}) {
  const [metrics, setMetrics] = useState<Metrics>(WIDE);
  const [position, setPosition] = useState(index);
  const positionRef = useRef(index);
  const coastRef = useRef(0);
  const dragged = useRef(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const count = guns.length;

  useEffect(() => {
    const fine = window.matchMedia("(min-width: 720px)");
    const apply = () => setMetrics(fine.matches ? WIDE : NARROW);
    apply();
    fine.addEventListener("change", apply);
    return () => fine.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    return () => {
      if (coastRef.current) cancelAnimationFrame(coastRef.current);
    };
  }, []);

  const commit = (value: number) => {
    positionRef.current = value;
    setPosition(value);
  };

  const animateTo = (target: number) => {
    if (coastRef.current) cancelAnimationFrame(coastRef.current);
    const tick = () => {
      const delta = target - positionRef.current;
      if (Math.abs(delta) < 0.012) {
        commit(target);
        coastRef.current = 0;
        const next = ((Math.round(target) % count) + count) % count;
        onIndex(next);
        return;
      }
      commit(positionRef.current + delta * 0.2);
      coastRef.current = requestAnimationFrame(tick);
    };
    coastRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    const turns = Math.round((positionRef.current - index) / Math.max(count, 1));
    const target = index + turns * count;
    if (Math.abs(positionRef.current - target) > 0.02) animateTo(target);
    // parent-driven focus (list click, cruise)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("a, button")) return;
    if (coastRef.current) cancelAnimationFrame(coastRef.current);
    const startX = event.clientX;
    let lastX = startX;
    let velocity = 0;
    dragged.current = false;
    const step = metrics.slots[1] || 150;
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    const move = (ev: PointerEvent) => {
      const delta = ev.clientX - lastX;
      lastX = ev.clientX;
      if (Math.abs(ev.clientX - startX) > 6) dragged.current = true;
      velocity = -delta / step;
      commit(positionRef.current + velocity);
    };
    const up = () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", up);
      if (!dragged.current) return;
      window.setTimeout(() => {
        dragged.current = false;
      }, 0);
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
  };

  if (count === 0) {
    return <p className="py-16 text-center text-sm text-white/45">没有匹配的枪。</p>;
  }

  return (
    <div
      ref={stageRef}
      onPointerDown={onPointerDown}
      className="relative h-full min-h-[260px] w-full cursor-grab overflow-hidden active:cursor-grabbing"
      style={{ touchAction: "pan-y" }}
    >
      <div className="absolute inset-0" style={{ transform: `scale(${zoom})` }}>
        {guns.map((gun, gunIndex) => {
          const offset = wrapOffset(gunIndex, position, count);
          const abs = Math.abs(offset);
          if (abs > metrics.window + 0.65) return null;
          const { x, scale } = place(abs, metrics);
          const front = abs < 0.45;
          return (
            <div
              key={gun.id}
              className="absolute top-1/2 left-1/2 [backface-visibility:hidden]"
              style={{
                width: metrics.width,
                height: metrics.height,
                zIndex: 20 - Math.round(abs * 4),
                transform: `translate(-50%, -50%) translate3d(${offset < 0 ? -x : x}px, ${abs * abs * 10}px, 0) rotateY(${tilt ? Math.max(-10, Math.min(10, offset * -6)) : 0}deg) scale(${scale})`,
                opacity: Math.max(0.38, 1 - abs * 0.2),
              }}
            >
              <button
                type="button"
                onClick={() => {
                  if (dragged.current) return;
                  const turns = Math.round((positionRef.current - gunIndex) / count);
                  animateTo(gunIndex + turns * count);
                }}
                className={cn(
                  "flex h-full w-full flex-col overflow-hidden rounded-[22px] border px-3 py-3 text-left",
                  front
                    ? "border-[#22c55e] bg-[#22c55e] text-[#05210f]"
                    : "border-white/50 bg-white/80 text-[#16181d]"
                )}
              >
                {front ? (
                  <span className="mt-auto">
                    <span className="block text-[11px] tracking-[0.14em] uppercase opacity-70">{gun.typeLabel}</span>
                    <span className="mt-1 block text-lg leading-tight font-semibold">{gun.name}</span>
                    <span className="mt-3 block text-4xl font-semibold tracking-tight">{gun.figure}</span>
                    <span className="text-[11px] opacity-70">伤害</span>
                  </span>
                ) : (
                  <>
                    {gun.imageUrl ? (
                      <img src={gun.imageUrl} alt="" className="h-28 w-full object-contain" draggable={false} />
                    ) : (
                      <span className="h-28" />
                    )}
                    <span className="mt-auto truncate text-sm font-medium">{gun.name}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
