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
  /** 1 = 顶部萼片，比果肉更亮 */
  crown: number;
};

const FLATTEN = 0.74;

function mix(a: readonly number[], b: readonly number[], t: number) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function rgb(c: readonly number[]) {
  return `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
}

const INK = [24, 12, 62] as const;
const VIOLET = [68, 44, 148] as const;
const BLOOM = [198, 186, 218] as const;
const CROWN = [244, 238, 255] as const;

const BODY_COLORS = Array.from({ length: 16 }, (_, i) => {
  const t = i / 15;
  return rgb(t < 0.45 ? mix(INK, VIOLET, t / 0.45) : mix(VIOLET, BLOOM, (t - 0.45) / 0.55));
});

const CROWN_COLORS = Array.from({ length: 16 }, (_, i) => {
  const t = i / 15;
  return rgb(mix(VIOLET, CROWN, 0.5 + t * 0.5));
});

function dot(x: number, y: number, z: number, crown: number): Dot {
  return { x, y, z, ox: 0, oy: 0, vx: 0, vy: 0, crown };
}

/** 略扁的蓝莓：果肉是压过的斐波那契球，顶部一圈五角萼片。 */
const DOTS: Dot[] = (() => {
  const dots: Dot[] = [];
  const count = 200;
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i += 1) {
    const ySphere = 1 - (i / (count - 1)) * 2;
    if (ySphere < -0.62) continue;
    const ring = Math.sqrt(Math.max(0, 1 - ySphere * ySphere));
    const theta = golden * i;
    let y = ySphere * FLATTEN;
    if (ySphere < -0.4) {
      const dent = Math.min(1, (-0.4 - ySphere) / 0.22);
      y += (-0.16 - y) * dent;
    }
    dots.push(dot(Math.cos(theta) * ring, y, Math.sin(theta) * ring, 0));
  }

  const tips = 5;
  const verts = Array.from({ length: tips * 2 }, (_, i) => {
    const ang = -Math.PI / 2 + (i * Math.PI) / tips;
    const radius = i % 2 === 0 ? 0.46 : 0.16;
    return { x: Math.cos(ang) * radius, z: Math.sin(ang) * radius, tip: i % 2 === 0 };
  });
  for (let i = 0; i < verts.length; i += 1) {
    const a = verts[i]!;
    const b = verts[(i + 1) % verts.length]!;
    const steps = 6;
    for (let s = 0; s < steps; s += 1) {
      const t = s / steps;
      const x = a.x + (b.x - a.x) * t;
      const z = a.z + (b.z - a.z) * t;
      const proud = a.tip ? 1 - t : t;
      dots.push(dot(x, -0.36 - proud * 0.14, z, 1));
    }
  }
  return dots;
})();

/**
 * 慢转的蓝莓网点。只在进入视口时用 rAF，点的位置算在 canvas 里，不改 DOM。
 */
export function HalftoneMark({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

      const glow = ctx.createRadialGradient(cx, cy - radius * 0.08, radius * 0.12, cx, cy, radius * 1.28);
      glow.addColorStop(0, "rgb(92, 70, 160)");
      glow.addColorStop(0.45, "rgb(42, 24, 96)");
      glow.addColorStop(1, "transparent");
      ctx.save();
      ctx.globalAlpha = 0.1 + breath * 0.08;
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const reach = radius * 0.72;

      for (const item of DOTS) {
        const x = item.x * cos + item.z * sin;
        const z = -item.x * sin + item.z * cos;
        const y = item.y;
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
        item.vx = (item.vx + (targetX - item.ox) * 0.12) * 0.72;
        item.vy = (item.vy + (targetY - item.oy) * 0.12) * 0.72;
        item.ox += item.vx;
        item.oy += item.vy;
        px += item.ox;
        py += item.oy;

        const light = Math.max(0, x * 0.32 + y * -0.22 + z * 0.9);
        const lit = light * light;
        const shade = Math.min(15, (lit * 15) | 0);
        const alpha = (item.crown ? 0.78 + lit * 0.22 : 0.32 + lit * 0.68) * (0.62 + depth * 0.22);
        const size = (item.crown ? 1.15 + lit * 1.2 : 0.85 + lit * 1.35) * depth * (0.92 + breath * 0.08);
        ctx.globalAlpha = Math.min(1, alpha);
        ctx.fillStyle = item.crown ? CROWN_COLORS[shade]! : BODY_COLORS[shade]!;
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

  return <canvas ref={canvasRef} aria-hidden className={cn("size-24 shrink-0 sm:size-40", className)} />;
}
