"use client";

import { useEffect, useRef } from "react";

type Point = { x: number; y: number };

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** 中点位移：比等分折线自然得多，闪电的抖动是分形的 */
function displaceMidpoints(points: Point[], amount: number): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    out.push(a);
    out.push({
      x: (a.x + b.x) / 2 + (Math.random() - 0.5) * amount,
      y: (a.y + b.y) / 2 + (Math.random() - 0.5) * amount * 0.25,
    });
  }
  out.push(points[points.length - 1]);
  return out;
}

function buildChannel(start: Point, end: Point, roughness: number, passes: number): Point[] {
  let points: Point[] = [start, end];
  let amount = roughness;
  for (let i = 0; i < passes; i += 1) {
    points = displaceMidpoints(points, amount);
    amount *= 0.54;
  }
  return points;
}

/**
 * 亮度包络：击中瞬间最亮，接着熄一下再复燃，最后拖尾散去。
 * 真实闪电是多次回击，不是单调淡出。
 */
function envelope(t: number): number {
  if (t < 0.04) return 1;
  if (t < 0.1) return 0.18;
  if (t < 0.17) return 0.92;
  if (t < 0.3) return 0.42;
  if (t < 1) return 0.42 * (1 - (t - 0.3) / 0.7);
  return 0;
}

/** 宙斯之怒：分形主干 + 分叉 + 天光泛白，随机间隔。 */
export function LightningFlash() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (prefersReducedMotion()) return;

    let running = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let frame = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const tracePath = (points: Point[]) => {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
    };

    /** 同一条路径由粗到细叠三层，不用 shadowBlur 就能堆出辉光 */
    const strokeGlow = (points: Point[], alpha: number, scale: number) => {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      tracePath(points);
      ctx.lineWidth = 10 * scale;
      ctx.strokeStyle = `rgba(150, 190, 255, ${alpha * 0.1})`;
      ctx.stroke();

      ctx.lineWidth = 4.2 * scale;
      ctx.strokeStyle = `rgba(198, 224, 255, ${alpha * 0.32})`;
      ctx.stroke();

      ctx.lineWidth = 1.5 * scale;
      ctx.strokeStyle = `rgba(248, 252, 255, ${alpha * 0.95})`;
      ctx.stroke();
    };

    const strike = () => {
      if (!running) return;

      // 大部分是远处的天光，只有少数真正劈下来 —— 全是主干会腻
      const distant = Math.random() < 0.45;
      const originX = width * (0.15 + Math.random() * 0.7);

      const channel = distant
        ? null
        : buildChannel(
            { x: originX, y: -20 },
            { x: originX + (Math.random() - 0.5) * width * 0.35, y: height * (0.55 + Math.random() * 0.45) },
            width * 0.16,
            5
          );

      const branches: Point[][] = [];
      if (channel) {
        const branchCount = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < branchCount; i += 1) {
          const anchorIndex = Math.floor(channel.length * (0.2 + Math.random() * 0.5));
          const anchor = channel[anchorIndex];
          branches.push(
            buildChannel(
              anchor,
              {
                x: anchor.x + (Math.random() - 0.5) * width * 0.3,
                y: anchor.y + height * (0.1 + Math.random() * 0.25),
              },
              width * 0.05,
              3
            )
          );
        }
      }

      const start = performance.now();
      const duration = 520 + Math.random() * 260;

      const animate = (now: number) => {
        if (!running) return;
        const t = (now - start) / duration;
        ctx.clearRect(0, 0, width, height);

        if (t >= 1) {
          frame = 0;
          return;
        }

        const alpha = envelope(t);
        if (alpha > 0.001) {
          // 天光：从落点上方铺开的一片泛白
          const sky = ctx.createRadialGradient(originX, -height * 0.1, 0, originX, -height * 0.1, height * 1.15);
          sky.addColorStop(0, `rgba(214, 232, 255, ${alpha * (distant ? 0.16 : 0.11)})`);
          sky.addColorStop(1, "rgba(214, 232, 255, 0)");
          ctx.fillStyle = sky;
          ctx.fillRect(0, 0, width, height);

          if (channel) {
            strokeGlow(channel, alpha, 1);
            for (const branch of branches) strokeGlow(branch, alpha * 0.55, 0.6);
          }
        }

        frame = requestAnimationFrame(animate);
      };

      frame = requestAnimationFrame(animate);
      timer = setTimeout(strike, 4500 + Math.random() * 11000);
    };

    resize();
    window.addEventListener("resize", resize);
    timer = setTimeout(strike, 1500 + Math.random() * 2500);

    return () => {
      running = false;
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" aria-hidden />;
}
