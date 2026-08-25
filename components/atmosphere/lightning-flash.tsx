"use client";

import { useEffect, useRef } from "react";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** 宙斯之怒：更粗、更冷白的神话闪电，随机间隔。pointer-events: none。 */
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

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = Math.max(window.innerHeight, document.documentElement.scrollHeight || window.innerHeight);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const buildBolt = (w: number, h: number) => {
      const startX = 0.2 + Math.random() * 0.6;
      const segments = 7 + Math.floor(Math.random() * 6);
      let x = startX * w;
      let y = 0;
      const points: { x: number; y: number }[] = [{ x, y }];
      for (let i = 0; i < segments; i += 1) {
        const dx = (Math.random() - 0.5) * w * 0.18;
        y += h / segments;
        x += dx;
        points.push({ x, y });
      }
      return points;
    };

    const drawBolt = (points: { x: number; y: number }[], opacity: number, width: number) => {
      const w = window.innerWidth;
      const h = Math.max(window.innerHeight, document.documentElement.scrollHeight || window.innerHeight);
      ctx.clearRect(0, 0, w, h);
      if (opacity <= 0) return;

      ctx.save();
      ctx.shadowBlur = 24;
      ctx.shadowColor = "rgba(220, 230, 255, 0.85)";
      ctx.strokeStyle = `rgba(245, 250, 255, ${opacity})`;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
      ctx.stroke();
      ctx.restore();

      // 主闪光层
      const grad = ctx.createRadialGradient(points[0].x, 0, 0, points[0].x, 0, h * 0.75);
      grad.addColorStop(0, `rgba(235, 245, 255, ${opacity * 0.14})`);
      grad.addColorStop(1, "rgba(235, 245, 255, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    };

    const strike = () => {
      if (!running) return;
      const w = window.innerWidth;
      const h = Math.max(window.innerHeight, document.documentElement.scrollHeight || window.innerHeight);
      const points = buildBolt(w, h);

      const steps = [3.2, 2.4, 1.6, 0.9, 0.5, 0.22, 0.08];
      let i = 0;
      const animate = () => {
        if (i >= steps.length) {
          ctx.clearRect(0, 0, w, h);
          return;
        }
        drawBolt(points, steps[i], steps[i] > 2 ? 4 : 2.5);
        i += 1;
        setTimeout(animate, i === 1 ? 30 : 55);
      };
      animate();

      const delay = 5000 + Math.random() * 12000;
      timer = setTimeout(strike, delay);
    };

    resize();
    window.addEventListener("resize", resize);
    timer = setTimeout(strike, 1200 + Math.random() * 1800);

    return () => {
      running = false;
      window.removeEventListener("resize", resize);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden
    />
  );
}
