"use client";

import { useEffect, useRef } from "react";

type Streak = {
  x: number;
  y: number;
  len: number;
  speed: number;
  alpha: number;
  width: number;
  layer: number;
  drift: number;
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getDocHeight() {
  return Math.max(
    document.body?.scrollHeight || 0,
    document.documentElement?.scrollHeight || 0,
    window.innerHeight
  );
}

/** 宙斯之雨：三层景深的冷雨，伴随神话闪电。 */
export function RainField({ density = "normal" }: { density?: "normal" | "low" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    if (prefersReducedMotion()) return;

    let frame = 0;
    let running = true;
    let docWidth = window.innerWidth;
    let docHeight = getDocHeight();
    const streaks: Streak[] = [];
    let lastTime = 0;
    let time = 0;
    let windOffset = 0;

    const layerConfig = [
      { countMul: 0.35, speedMin: 5, speedMax: 9, lenMin: 22, lenMax: 36, alphaMin: 0.05, alphaMax: 0.12, width: 0.5, drift: 0.15 },
      { countMul: 0.33, speedMin: 8, speedMax: 13, lenMin: 34, lenMax: 52, alphaMin: 0.12, alphaMax: 0.22, width: 0.8, drift: 0.3 },
      { countMul: 0.32, speedMin: 11, speedMax: 16, lenMin: 46, lenMax: 70, alphaMin: 0.20, alphaMax: 0.30, width: 1.2, drift: 0.45 },
    ];

    const baseCount = (() => {
      const w = window.innerWidth;
      let base = w < 640 ? 55 : w < 1024 ? 90 : 120;
      if (density === "low") base = Math.round(base * 0.55);
      return base;
    })();

    const seed = () => {
      streaks.length = 0;
      for (let layer = 0; layer < 3; layer += 1) {
        const cfg = layerConfig[layer];
        const count = Math.round(baseCount * cfg.countMul);
        for (let i = 0; i < count; i += 1) {
          const speed = cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin);
          const len = cfg.lenMin + Math.random() * (cfg.lenMax - cfg.lenMin);
          streaks.push({
            x: Math.random() * docWidth,
            y: Math.random() * docHeight - docHeight * 0.15,
            len,
            speed,
            alpha: cfg.alphaMin + Math.random() * (cfg.alphaMax - cfg.alphaMin),
            width: cfg.width + Math.random() * 0.25,
            layer,
            drift: cfg.drift * (Math.random() - 0.5),
          });
        }
      }
      streaks.sort((a, b) => a.layer - b.layer);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      docWidth = window.innerWidth;
      docHeight = getDocHeight();
      canvas.width = Math.floor(docWidth * dpr);
      canvas.height = Math.floor(docHeight * dpr);
      canvas.style.width = `${docWidth}px`;
      canvas.style.height = `${docHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const draw = (dt: number) => {
      windOffset += (Math.sin(time * 0.0008) + Math.cos(time * 0.0013)) * 0.0015;

      for (const s of streaks) {
        const dx = s.drift + windOffset * (s.layer + 1) * 0.22;
        const tailX = s.x - dx * (s.len / s.speed) * 2.2;
        const tailY = s.y - s.len;

        ctx.save();
        ctx.lineWidth = s.width;
        ctx.lineCap = "round";
        ctx.strokeStyle = `rgba(185, 202, 218, ${s.alpha})`;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
        ctx.restore();

        if (s.layer === 2) {
          ctx.fillStyle = `rgba(220, 238, 255, ${s.alpha * 0.35})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.width * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }

        s.y += s.speed * (dt / 16);
        s.x += dx * (dt / 16);

        if (s.y > docHeight + 12) {
          s.y = -s.len - Math.random() * 120;
          s.x = Math.random() * docWidth;
        }
        if (s.x < -50) s.x = docWidth + 50;
        if (s.x > docWidth + 50) s.x = -50;
      }
    };

    const loop = (now: number) => {
      if (!running) return;
      const dt = Math.min(now - lastTime, 64);
      lastTime = now;
      time += dt;

      ctx.clearRect(0, 0, docWidth, docHeight);
      draw(dt);

      frame = requestAnimationFrame(loop);
    };

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => resize(), 150);
    };
    const onResizeHeight = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => resize(), 150);
    };

    resize();
    frame = requestAnimationFrame(loop);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResizeHeight, { passive: true });

    const domObserver = new MutationObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => resize(), 180);
    });
    domObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResizeHeight);
      domObserver.disconnect();
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, [density]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-lab-canvas" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(56,189,248,0.12),transparent_55%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(8,9,13,0.35))] dark:bg-[linear-gradient(to_bottom,transparent,rgba(8,9,13,0.55))]" />
      <canvas ref={canvasRef} className="absolute left-0 top-0 h-full w-full" />
    </div>
  );
}
