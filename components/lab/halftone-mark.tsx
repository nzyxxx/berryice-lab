"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

type Dot = {
  x: number;
  y: number;
  z: number;
  ox: number;
  oy: number;
  vx: number;
  vy: number;
};

/** 斐波那契球面，约 200 点，画在一张 canvas 上。 */
const DOTS: Dot[] = (() => {
  const count = 210;
  const dots: Dot[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i += 1) {
    const y = 1 - (i / (count - 1)) * 2;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    dots.push({
      x: Math.cos(theta) * ring,
      y,
      z: Math.sin(theta) * ring,
      ox: 0,
      oy: 0,
      vx: 0,
      vy: 0,
    });
  }
  return dots;
})();

/**
 * 慢转的网点球。只在进入视口时用 rAF，点的位置算在 canvas 里，不改 DOM。
 */
export function HalftoneMark({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const color = getComputedStyle(canvas).color || "#38bdf8";
    let cssW = 0;
    let cssH = 0;
    let visible = false;
    let hidden = document.hidden;
    let raf = 0;
    let angle = 0.4;
    let last = 0;
    let pointerX = -999;
    let pointerY = -999;
    let pointerNear = false;

    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = canvas.clientWidth || 96;
      cssH = canvas.clientHeight || 96;
      canvas.width = Math.max(1, Math.round(cssW * dpr));
      canvas.height = Math.max(1, Math.round(cssH * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (dt: number) => {
      const w = cssW;
      const h = cssH;
      const cx = w * 0.5;
      const cy = h * 0.5;
      const radius = Math.min(w, h) * 0.42;
      const breath = 0.5 + 0.5 * Math.sin(angle * 0.55);
      ctx.clearRect(0, 0, w, h);

      const glow = ctx.createRadialGradient(cx, cy, radius * 0.15, cx, cy, radius * 1.25);
      glow.addColorStop(0, color);
      glow.addColorStop(1, "transparent");
      ctx.save();
      ctx.globalAlpha = 0.08 + breath * 0.07;
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const reach = radius * 0.72;

      for (const dot of DOTS) {
        const x = dot.x * cos + dot.z * sin;
        const z = -dot.x * sin + dot.z * cos;
        const y = dot.y;
        const depth = 2.6 / (2.6 - z);
        let px = cx + x * depth * radius;
        let py = cy + y * depth * radius;

        let targetX = 0;
        let targetY = 0;
        if (pointerNear) {
          const dx = px - pointerX;
          const dy = py - pointerY;
          const dist = Math.hypot(dx, dy) || 0.001;
          if (dist < reach) {
            const push = (1 - dist / reach) * 5.5;
            targetX = (dx / dist) * push;
            targetY = (dy / dist) * push;
          }
        }
        dot.vx = (dot.vx + (targetX - dot.ox) * 0.12) * 0.72;
        dot.vy = (dot.vy + (targetY - dot.oy) * 0.12) * 0.72;
        dot.ox += dot.vx;
        dot.oy += dot.vy;
        px += dot.ox;
        py += dot.oy;

        const light = Math.max(0, x * 0.35 + y * -0.15 + z * 0.92);
        const lit = light * light;
        const alpha = (0.12 + lit * 0.88) * (0.55 + depth * 0.28);
        const size = (0.7 + lit * 1.55) * depth * (0.92 + breath * 0.08);
        ctx.globalAlpha = Math.min(1, alpha);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      angle += dt * 0.32;
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      last = now;
      draw(dt);
      raf = visible && !hidden ? requestAnimationFrame(frame) : 0;
    };
    const start = () => {
      if (raf || !visible || hidden || reduce) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    fit();
    if (reduce) draw(0);

    const onResize = () => fit();
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const rect = canvas.getBoundingClientRect();
      pointerX = event.clientX - rect.left;
      pointerY = event.clientY - rect.top;
      pointerNear =
        pointerX > -48 && pointerY > -48 && pointerX < rect.width + 48 && pointerY < rect.height + 48;
    };
    const onLeave = () => {
      pointerNear = false;
    };
    const onVisibility = () => {
      hidden = document.hidden;
      if (hidden) stop();
      else start();
    };

    const seen = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      },
      { threshold: 0.08 }
    );
    seen.observe(canvas);
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      seen.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("size-24 shrink-0 text-lab-primary sm:size-40", className)}
    />
  );
}
