"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

/**
 * 网点圆。桌面细指针下，点会被光标推开，松手后弹簧回到原位。
 * 手机和减少动效时就是静止的圆。
 */
const DOTS = (() => {
  const steps = 22;
  const dots: { x: number; y: number; r: number }[] = [];

  for (let y = 0; y < steps; y += 1) {
    for (let x = 0; x < steps; x += 1) {
      const u = (x + 0.5) / steps - 0.5;
      const v = (y + 0.5) / steps - 0.5;
      const dist = Math.hypot(u, v);
      if (dist > 0.48) continue;

      const shade = Math.max(0, (1 - dist / 0.48) * 0.9 + (-u * 0.55 - v * 0.28));
      const radius = 0.42 + shade * 1.05;
      dots.push({
        x: (x + 0.5) * (64 / steps),
        y: (y + 0.5) * (64 / steps),
        r: Math.min(radius, 1.55),
      });
    }
  }

  return dots;
})();

type Dot = { homeX: number; homeY: number; x: number; y: number; vx: number; vy: number };

export function HalftoneMark({ className }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const circles = useRef<(SVGCircleElement | null)[]>([]);
  const dots = useRef<Dot[]>(
    DOTS.map((dot) => ({ homeX: dot.x, homeY: dot.y, x: dot.x, y: dot.y, vx: 0, vy: 0 }))
  );
  const pointer = useRef({ x: 32, y: 32, active: false });

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const svg = svgRef.current;
    if (!desktop || reduce || !svg) return;

    let raf = 0;
    const step = () => {
      const aim = pointer.current;
      let moving = false;
      for (const dot of dots.current) {
        let fx = (dot.homeX - dot.x) * 0.16;
        let fy = (dot.homeY - dot.y) * 0.16;
        if (aim.active) {
          const dx = dot.x - aim.x;
          const dy = dot.y - aim.y;
          const dist = Math.hypot(dx, dy) || 0.001;
          const reach = 28;
          if (dist < reach) {
            const falloff = 1 - dist / reach;
            const push = falloff ** 2 * 4.4;
            const wave = Math.sin(dist * 0.9) * 0.7 * falloff;
            fx += (dx / dist) * (push + wave);
            fy += (dy / dist) * (push + wave);
          }
        }
        dot.vx = (dot.vx + fx) * 0.68;
        dot.vy = (dot.vy + fy) * 0.68;
        dot.x += dot.vx;
        dot.y += dot.vy;
        if (Math.hypot(dot.vx, dot.vy) > 0.04) moving = true;
      }
      circles.current.forEach((circle, index) => {
        const dot = dots.current[index];
        if (!circle || !dot) return;
        circle.setAttribute("cx", dot.x.toFixed(2));
        circle.setAttribute("cy", dot.y.toFixed(2));
      });
      raf = moving ? requestAnimationFrame(step) : 0;
    };

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(step);
    };

    const move = (event: PointerEvent) => {
      const rect = svg.getBoundingClientRect();
      if (rect.width < 1) return;
      const x = ((event.clientX - rect.left) / rect.width) * 64;
      const y = ((event.clientY - rect.top) / rect.height) * 64;
      const near = Math.hypot(x - 32, y - 32) < 56;
      const wasHot = svg.dataset.hot === "1";
      pointer.current = { x, y, active: near };
      if (near) svg.dataset.hot = "1";
      else delete svg.dataset.hot;
      if (near || wasHot) kick();
    };

    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 64 64"
      aria-hidden
      className={cn(
        "home-orb size-24 shrink-0 text-lab-primary sm:size-44",
        className
      )}
    >
      {DOTS.map((dot, index) => (
        <circle
          key={`${dot.x}-${dot.y}`}
          ref={(node) => {
            circles.current[index] = node;
          }}
          cx={dot.x}
          cy={dot.y}
          r={dot.r}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}
