"use client";

import type { PointerEvent, ReactNode, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { marqueeDelaySeconds } from "@/lib/content/motion-hold";

function fineMotion(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** 指针在卡片上时，局部光跟着走。触屏不设坐标。 */
export function spotMove(event: PointerEvent<HTMLElement>) {
  if (event.pointerType === "touch") return;
  const rect = event.currentTarget.getBoundingClientRect();
  const node = event.currentTarget;
  node.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
  node.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
  node.dataset.lit = "true";
}

/** 离开后关掉这一层光，并清掉上次的坐标，避免停在边缘。 */
export function spotLeave(event: PointerEvent<HTMLElement>) {
  const node = event.currentTarget;
  node.dataset.lit = "false";
  node.style.removeProperty("--spot-x");
  node.style.removeProperty("--spot-y");
}

/** 靠近时轻轻跟上，离开回到原位。不用在会旋转的那一层。 */
export function Magnetic({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !fineMotion()) return;
    const onMove = (event: globalThis.PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const distance = Math.hypot(dx, dy);
      if (distance > 88) {
        node.style.transform = "";
        return;
      }
      node.style.transform = `translate(${dx * 0.22}px, ${dy * 0.22}px)`;
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      node.style.transform = "";
    };
  }, []);

  return (
    <span ref={ref} className={className} style={{ display: "inline-block", transition: "transform 180ms ease-out" }}>
      {children}
    </span>
  );
}

/** 按指针在这块里的位置做很小的 rotateX / rotateY。 */
export function Tilt({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  function onMove(event: PointerEvent<HTMLSpanElement>) {
    if (event.pointerType === "touch" || !fineMotion()) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    event.currentTarget.style.transform = `perspective(900px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 7).toFixed(2)}deg)`;
  }

  function onLeave(event: PointerEvent<HTMLSpanElement>) {
    event.currentTarget.style.transform = "";
  }

  return (
    <span
      ref={ref}
      className={className}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ display: "block", transformStyle: "preserve-3d", transition: "transform 180ms ease-out" }}
    >
      {children}
    </span>
  );
}

/** 进入视口后按 0.05 秒错开。元素本身先是可见的。 */
export function useStagger(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const node = root.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const items = [...node.querySelectorAll<HTMLElement>("[data-stagger]")];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.25 }
    );
    for (const item of items) observer.observe(item);
    return () => observer.disconnect();
  }, [root]);
}

/** 数字从 0 补到真实值。读屏始终听到终值，不播报中间数。 */
export function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / 700);
          const eased = 1 - (1 - t) ** 3;
          setShown(Math.round(value * eased));
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        setShown(0);
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 }
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <>
      <span className="sr-only">{value}</span>
      <span ref={ref} aria-hidden>
        {shown}
      </span>
    </>
  );
}

const MARQUEE_SECONDS = 22;

function readTranslateX(transform: string): number {
  const match = /matrix(?:3d)?\(([^)]+)\)/.exec(transform);
  if (!match) return 0;
  const parts = match[1].split(",").map((part) => Number(part.trim()));
  const tx = parts.length === 16 ? parts[12] : parts[4];
  return Number.isFinite(tx) ? tx : 0;
}

/**
 * 跑马灯只在屏内、页面可见、没有悬停或焦点、也没有手动暂停时走。
 * 停的时候把当前位移写进 inline transform 并关掉动画，后面的交互不再改这个值。
 * 减少动效时停在起点，不用 0.01ms 把轨道送到 -50%。
 */
export function Marquee({ paused, children }: { paused: boolean; children: ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);

  useEffect(() => {
    const box = boxRef.current;
    const track = trackRef.current;
    if (!box || !track) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let held = 0;
    let mode: "run" | "hold" | "rest" = "rest";
    let onScreen = false;
    let hovered = false;
    let focused = false;

    const want = () => !pausedRef.current && !reduce.matches && !document.hidden && onScreen && !hovered && !focused;

    const rest = () => {
      held = 0;
      track.style.animation = "none";
      track.style.animationDelay = "0s";
      track.style.transform = "none";
      mode = "rest";
    };
    const holdAt = (tx: number) => {
      held = tx;
      track.style.animation = "none";
      track.style.animationDelay = "0s";
      track.style.transform = `translateX(${tx}px)`;
      mode = "hold";
    };
    const run = () => {
      const delay = marqueeDelaySeconds(held, track.offsetWidth, MARQUEE_SECONDS);
      track.style.transform = "";
      track.style.animation = "";
      track.style.animationDelay = `${delay}s`;
      mode = "run";
    };
    const sync = () => {
      if (reduce.matches) {
        rest();
        return;
      }
      if (want()) {
        if (mode !== "run") run();
        return;
      }
      if (mode === "run") holdAt(readTranslateX(getComputedStyle(track).transform));
      else if (mode !== "hold") holdAt(0);
    };

    const observer = new IntersectionObserver(([entry]) => {
      onScreen = Boolean(entry?.isIntersecting);
      sync();
    });
    observer.observe(box);
    const onVis = () => sync();
    const onReduce = () => sync();
    const onEnter = () => {
      hovered = true;
      sync();
    };
    const onLeave = () => {
      hovered = false;
      sync();
    };
    const onFocus = () => {
      focused = true;
      sync();
    };
    const onBlur = () => {
      focused = false;
      sync();
    };
    const onPaused = () => sync();
    document.addEventListener("visibilitychange", onVis);
    reduce.addEventListener("change", onReduce);
    box.addEventListener("pointerenter", onEnter);
    box.addEventListener("pointerleave", onLeave);
    box.addEventListener("focusin", onFocus);
    box.addEventListener("focusout", onBlur);
    box.addEventListener("marquee-pause", onPaused);
    sync();

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      reduce.removeEventListener("change", onReduce);
      box.removeEventListener("pointerenter", onEnter);
      box.removeEventListener("pointerleave", onLeave);
      box.removeEventListener("focusin", onFocus);
      box.removeEventListener("focusout", onBlur);
      box.removeEventListener("marquee-pause", onPaused);
      track.style.animation = "none";
      track.style.transform = "none";
    };
  }, []);

  useEffect(() => {
    pausedRef.current = paused;
    boxRef.current?.dispatchEvent(new Event("marquee-pause"));
  }, [paused]);

  return (
    <div
      ref={boxRef}
      data-demo="marquee"
      data-paused={paused ? "true" : "false"}
      tabIndex={-1}
      className="marquee overflow-hidden rounded-xl border border-lab-hairline py-3 outline-none"
    >
      <div ref={trackRef} className="marquee-track gap-8 px-4 text-sm text-lab-ink-subtle">
        {children}
      </div>
    </div>
  );
}

/** 离屏、隐藏标签或减少动效时关掉循环。卸载时也关掉。 */
function usePauseOffstage(ref: RefObject<HTMLElement | null>, kind: "caret" | "beam") {
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let onScreen = false;
    let stopped = false;

    const halt = () => {
      if (stopped) return;
      if (kind === "beam") node.style.setProperty("--beam", getComputedStyle(node).getPropertyValue("--beam"));
      node.style.animation = "none";
      if (kind === "caret") node.style.opacity = "1";
      stopped = true;
    };
    const release = () => {
      if (!stopped) return;
      node.style.animation = "";
      node.style.opacity = "";
      node.style.removeProperty("--beam");
      stopped = false;
    };
    const sync = () => {
      if (reduce.matches || document.hidden || !onScreen) halt();
      else release();
    };

    const observer = new IntersectionObserver(([entry]) => {
      onScreen = Boolean(entry?.isIntersecting);
      sync();
    });
    observer.observe(node);
    const onVis = () => sync();
    const onReduce = () => sync();
    document.addEventListener("visibilitychange", onVis);
    reduce.addEventListener("change", onReduce);
    sync();

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      reduce.removeEventListener("change", onReduce);
      node.style.animation = "none";
    };
  }, [kind, ref]);
}

export function TypeCaret() {
  const ref = useRef<HTMLSpanElement>(null);
  usePauseOffstage(ref, "caret");
  return <span ref={ref} className="type-caret" />;
}

export function DemoBeam() {
  const ref = useRef<HTMLSpanElement>(null);
  usePauseOffstage(ref, "beam");
  return <span ref={ref} aria-hidden className="channel-beam beam-demo" />;
}

export function ChannelBeam() {
  const ref = useRef<HTMLSpanElement>(null);
  usePauseOffstage(ref, "beam");
  return <span ref={ref} aria-hidden className="channel-beam" />;
}
