"use client";

import { useEffect, useRef } from "react";

type Mist = {
  x: number;
  y: number;
  r: number;
  speedX: number;
  speedY: number;
  alpha: number;
  pulse: number;
  pulseSpeed: number;
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

/** 奥德赛海洋气候：深海、慢浪、海雾、远方微光。 */
export function OceanField() {
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
    const mists: Mist[] = [];
    let lastTime = 0;
    let time = 0;

    const seed = () => {
      mists.length = 0;
      const count = Math.min(36, Math.round(docWidth / 55));
      for (let i = 0; i < count; i += 1) {
        mists.push({
          x: Math.random() * docWidth,
          y: Math.random() * docHeight,
          r: 1.5 + Math.random() * 3.5,
          speedX: 0.15 + Math.random() * 0.45,
          speedY: -0.05 - Math.random() * 0.15,
          alpha: 0.04 + Math.random() * 0.08,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.0004 + Math.random() * 0.0008,
        });
      }
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

    const drawMist = (dt: number) => {
      for (const m of mists) {
        m.pulse += m.pulseSpeed;
        const a = m.alpha * (0.8 + 0.2 * Math.sin(m.pulse));

        ctx.fillStyle = `rgba(190, 230, 240, ${a})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();

        m.x += m.speedX * (dt / 16);
        m.y += m.speedY * (dt / 16);

        if (m.x > docWidth + 20) m.x = -20;
        if (m.y < -20) m.y = docHeight + 20;
      }
    };

    const loop = (now: number) => {
      if (!running) return;
      const dt = Math.min(now - lastTime, 64);
      lastTime = now;
      time += dt;

      ctx.clearRect(0, 0, docWidth, docHeight);
      drawMist(dt);

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
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {/* 深海渐变：从水面微光到深渊 */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#05101f_0%,#0a1c30_40%,#071223_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_-5%,rgba(94,234,212,0.10),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_30%_at_80%_20%,rgba(251,191,36,0.06),transparent_55%)]" />

      {/* 希腊式回纹装饰：极淡 */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(148,163,184,0.08) 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(148,163,184,0.08) 20px)`,
          backgroundSize: "40px 40px",
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent 30%)",
        }}
      />

      {/* 海雾层 */}
      <canvas ref={canvasRef} className="absolute left-0 top-0 h-full w-full" />

      {/* 波浪层：慢速横向移动 */}
      <div className="absolute bottom-0 left-0 right-0 h-[22vh] min-h-[160px]">
        <svg
          className="absolute bottom-0 h-full w-[200%] animate-[wave-slow_22s_linear_infinite]"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            fill="rgba(13, 40, 64, 0.55)"
            d="M0,192L48,186.7C96,181,192,171,288,181.3C384,192,480,224,576,224C672,224,768,192,864,181.3C960,171,1056,181,1152,197.3C1248,213,1344,235,1392,245.3L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
        <svg
          className="absolute bottom-0 h-full w-[200%] animate-[wave-medium_16s_linear_infinite]"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            fill="rgba(16, 50, 80, 0.45)"
            d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,218.7C672,235,768,245,864,234.7C960,224,1056,192,1152,181.3C1248,171,1344,181,1392,186.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
        <svg
          className="absolute bottom-0 h-full w-[200%] animate-[wave-fast_10s_linear_infinite]"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            fill="rgba(20, 65, 100, 0.35)"
            d="M0,256L48,240C96,224,192,192,288,186.7C384,181,480,203,576,218.7C672,235,768,245,864,240C960,235,1056,213,1152,202.7C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div>

      {/* 水面泡沫线 */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[rgba(167,243,208,0.25)] to-transparent opacity-60" />
    </div>
  );
}
