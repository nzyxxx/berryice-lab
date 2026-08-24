"use client";

import { useEffect, useRef } from "react";

type Drop = {
  x: number;
  y: number;
  len: number;
  speed: number;
  alpha: number;
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** 全站夜雨气候层。pointer-events: none，不抢点击。 */
export function RainField({ density = "normal" }: { density?: "normal" | "low" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (prefersReducedMotion()) return;

    let frame = 0;
    let running = true;
    const drops: Drop[] = [];

    const countFor = () => {
      const base = window.innerWidth < 640 ? 36 : 70;
      return density === "low" ? Math.round(base * 0.55) : base;
    };

    const seed = () => {
      drops.length = 0;
      const n = countFor();
      for (let i = 0; i < n; i += 1) {
        drops.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          len: 8 + Math.random() * 14,
          speed: 4.2 + Math.random() * 6.5,
          alpha: 0.18 + Math.random() * 0.35,
        });
      }
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const draw = () => {
      if (!running) return;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.lineWidth = 1;
      ctx.lineCap = "round";

      for (const drop of drops) {
        ctx.strokeStyle = `rgba(184, 212, 232, ${drop.alpha})`;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - 0.6, drop.y + drop.len);
        ctx.stroke();

        drop.y += drop.speed;
        drop.x -= 0.35;
        if (drop.y > window.innerHeight + 12) {
          drop.y = -drop.len;
          drop.x = Math.random() * window.innerWidth;
        }
        if (drop.x < -8) drop.x = window.innerWidth + 8;
      }

      frame = requestAnimationFrame(draw);
    };

    resize();
    frame = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [density]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-lab-canvas" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(56,189,248,0.12),transparent_55%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(8,9,13,0.35))] dark:bg-[linear-gradient(to_bottom,transparent,rgba(8,9,13,0.55))]" />
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
