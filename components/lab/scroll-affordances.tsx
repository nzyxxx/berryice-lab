"use client";

import { cn } from "@/lib/utils";
import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * 阅读进度条 + 回到顶部。
 * 进度条直接写 DOM 而不是走 state：滚动时每帧 setState 会让整棵子树重渲染，
 * 只有「是否露出回顶按钮」这种低频布尔值才值得进 state。
 */
export function ScrollAffordances() {
  const barRef = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState(false);
  const [atDepth, setAtDepth] = useState(false);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const y = window.scrollY;

      setScrollable(max > 120);
      setAtDepth(y > window.innerHeight * 0.75);

      if (barRef.current) {
        const ratio = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
        barRef.current.style.transform = `scaleX(${ratio})`;
      }
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  const backToTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <>
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px]",
          !scrollable && "opacity-0"
        )}
        aria-hidden
      >
        <div
          ref={barRef}
          className="h-full origin-left bg-gradient-to-r from-lab-primary/70 via-lab-primary to-lab-primary/70"
          style={{ transform: "scaleX(0)" }}
        />
      </div>

      <button
        type="button"
        onClick={backToTop}
        aria-label="回到顶部"
        tabIndex={scrollable && atDepth ? 0 : -1}
        className={cn(
          "fixed bottom-6 right-5 z-[60] flex size-11 items-center justify-center rounded-full",
          "border border-white/12 bg-lab-canvas/70 text-lab-ink-subtle backdrop-blur-xl",
          "transition-[opacity,transform,color,background-color] duration-300",
          "hover:text-lab-ink hover:bg-lab-canvas/90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40",
          scrollable && atDepth
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0"
        )}
      >
        <ArrowUp className="size-5" />
      </button>
    </>
  );
}
