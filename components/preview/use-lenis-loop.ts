"use client";

import { useEffect, useRef } from "react";
import type Lenis from "lenis";

/**
 * 只给预览页用。Lenis 自己的 raf 关掉，和页面动画挤在同一条循环里。
 * 离开页面就停，别的路由不会装上它。
 */
export function useLenisLoop(onFrame: (time: number) => void) {
  const onFrameRef = useRef(onFrame);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    onFrameRef.current = onFrame;
  });

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let lenis: Lenis | null = null;
    let dead = false;

    const boot = async () => {
      if (reduced.matches) {
        onFrameRef.current(0);
        return;
      }
      const [{ default: LenisCtor }] = await Promise.all([
        import("lenis"),
        import("lenis/dist/lenis.css"),
      ]);
      if (dead) return;
      lenis = new LenisCtor({
        autoRaf: false,
        lerp: 0.075,
        smoothWheel: true,
        syncTouch: true,
        touchMultiplier: 1.05,
      });
      lenisRef.current = lenis;
      const loop = (time: number) => {
        lenis?.raf(time);
        onFrameRef.current(time);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    };

    void boot();
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      lenis?.destroy();
      lenisRef.current = null;
    };
  }, []);

  return lenisRef;
}
