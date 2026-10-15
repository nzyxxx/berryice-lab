"use client";

import { HalftoneMark } from "@/components/lab/halftone-mark";
import { homeIntro, homeModules, type HomeModule } from "@/lib/content/home-modules";
import { profileConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Crosshair } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, type PointerEvent } from "react";

const cardClass =
  "home-card group relative flex h-full flex-col rounded-3xl border border-lab-hairline bg-lab-surface-1/80 px-7 py-8 backdrop-blur-md dark:bg-lab-surface-2/70";

const spanClass: Record<string, string> = {
  lab: "sm:col-span-4 sm:row-span-2",
  writing: "sm:col-span-2",
  about: "sm:col-span-2",
};

/** 还没写完的占位卡不进首页。数据留在 home-modules，有了去处再出现。 */
const visibleModules = homeModules
  .filter((module) => module.badge !== "即将上线")
  .sort((a, b) => {
    const order = ["lab", "writing", "about"];
    const rank = (id: string) => {
      const index = order.indexOf(id);
      return index === -1 ? order.length : index;
    };
    return rank(a.id) - rank(b.id);
  });

function SplitLine({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn("home-split", className)}>
      {[...text].map((char, index) => (
        <span key={`${char}-${index}`} style={{ ["--i" as string]: index }}>
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}

function tilt(event: PointerEvent<HTMLElement>) {
  if (!document.documentElement.classList.contains("home-motion")) return;
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const px = x / rect.width - 0.5;
  const py = y / rect.height - 0.5;
  const style = event.currentTarget.style;
  style.setProperty("--mx", `${x}px`);
  style.setProperty("--my", `${y}px`);
  style.setProperty("--rx", `${(-py * 4).toFixed(2)}deg`);
  style.setProperty("--ry", `${(px * 6).toFixed(2)}deg`);
  style.setProperty("--tx", `${(px * 10).toFixed(1)}px`);
  style.setProperty("--ty", `${(py * 8).toFixed(1)}px`);
}

function untilt(event: PointerEvent<HTMLElement>) {
  const style = event.currentTarget.style;
  style.setProperty("--rx", "0deg");
  style.setProperty("--ry", "0deg");
  style.setProperty("--tx", "0px");
  style.setProperty("--ty", "0px");
}

function ModuleCard({ module, index }: { module: HomeModule; index: number }) {
  const entries = module.entries ?? [];
  const linked = Boolean(module.href) && entries.length === 0;
  const featured = module.id === "lab";

  const body = (
    <>
      <span className="flex items-start justify-between gap-4">
        <h2
          className={cn(
            "font-semibold tracking-tight text-lab-ink transition-colors duration-300 group-hover:text-lab-primary",
            featured ? "text-4xl sm:text-5xl" : "text-3xl"
          )}
        >
          {module.title}
        </h2>
        {linked ? (
          <ArrowUpRight className="home-arrow mt-2 size-5 shrink-0 text-lab-ink-muted" aria-hidden />
        ) : null}
      </span>
      {module.description ? (
        <p
          className={cn(
            "mt-4 leading-relaxed text-lab-ink-muted transition-colors duration-300 group-hover:text-lab-ink",
            featured ? "max-w-md text-lg" : "text-base"
          )}
        >
          {module.description}
        </p>
      ) : null}
      {entries.length > 0 ? (
        <ul className="mt-6 border-t border-lab-hairline">
          {entries.map((entry) => {
            const row = (
              <>
                <Crosshair className="mt-1 size-4 shrink-0 text-lab-ink-muted transition-colors duration-300 group-hover/entry:text-lab-primary" aria-hidden />
                <span className="shrink-0 text-lg font-medium group-hover/entry:underline">{entry.title}</span>
                {entry.description ? (
                  <span className="min-w-0 flex-1 text-base font-normal leading-snug text-lab-ink">
                    {entry.description}
                  </span>
                ) : null}
              </>
            );

            return (
              <li key={entry.title}>
                {entry.href ? (
                  <Link
                    href={entry.href}
                    className="group/entry home-magnet flex min-h-11 items-start gap-3 py-4 text-lab-ink outline-none transition-colors hover:text-lab-primary focus-visible:ring-2 focus-visible:ring-lab-ink/30 sm:items-center"
                  >
                    {row}
                  </Link>
                ) : (
                  <div className="flex min-h-11 items-start gap-3 py-4 text-lab-ink sm:items-center">{row}</div>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </>
  );

  const reveal = { ["--i" as string]: index + 2 };

  if (linked && module.href) {
    return (
      <li data-reveal style={reveal} className={cn("h-full", spanClass[module.id] ?? "sm:col-span-3")}>
        <Link
          href={module.href}
          onPointerMove={tilt}
          onPointerLeave={untilt}
          className={cn(cardClass, "outline-none focus-visible:ring-2 focus-visible:ring-lab-ink/30")}
        >
          {body}
        </Link>
      </li>
    );
  }

  return (
    <li data-reveal style={reveal} className={cn("h-full", spanClass[module.id] ?? "sm:col-span-3")}>
      <article className={cardClass} onPointerMove={tilt} onPointerLeave={untilt}>
        {body}
      </article>
    </li>
  );
}

export function HomeFront() {
  const { displayName, latinName } = profileConfig;
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!desktop || reduce) return;

    const root = document.documentElement;
    root.classList.add("home-motion");
    let dead = false;
    let lenisRaf = 0;
    let cursorRaf = 0;
    let lenis: { raf: (time: number) => void; destroy: () => void; velocity: number; on: (event: "scroll", cb: () => void) => void } | null = null;
    let calm = 0;
    const cursor = { x: 0, y: 0, rx: 0, ry: 0, tx: 0, ty: 0 };

    const nodes = [...document.querySelectorAll<HTMLElement>("[data-reveal]")];
    const seen = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-shown");
          entry.target.classList.remove("is-waiting");
          seen.unobserve(entry.target);
        }
      },
      { threshold: 0.18 }
    );
    for (const node of nodes) {
      const rect = node.getBoundingClientRect();
      if (rect.top > window.innerHeight * 0.92) node.classList.add("is-waiting");
      seen.observe(node);
    }

    const pumpLenis = (time: number) => {
      lenis?.raf(time);
      const moving = Math.abs(lenis?.velocity ?? 0) > 0.08;
      calm = moving ? 0 : calm + 1;
      lenisRaf = calm < 10 ? requestAnimationFrame(pumpLenis) : 0;
    };
    const kickLenis = () => {
      calm = 0;
      if (!lenisRaf) lenisRaf = requestAnimationFrame(pumpLenis);
    };

    const pumpCursor = () => {
      cursor.x += (cursor.tx - cursor.x) * 0.55;
      cursor.y += (cursor.ty - cursor.y) * 0.55;
      cursor.rx += (cursor.tx - cursor.rx) * 0.16;
      cursor.ry += (cursor.ty - cursor.ry) * 0.16;
      const dot = dotRef.current;
      const ring = ringRef.current;
      if (dot) dot.style.transform = `translate3d(${cursor.x}px, ${cursor.y}px, 0)`;
      if (ring) ring.style.transform = `translate3d(${cursor.rx}px, ${cursor.ry}px, 0)`;
      const left = Math.hypot(cursor.tx - cursor.x, cursor.ty - cursor.y) + Math.hypot(cursor.tx - cursor.rx, cursor.ty - cursor.ry);
      cursorRaf = left > 0.5 ? requestAnimationFrame(pumpCursor) : 0;
    };
    const onPointer = (event: globalThis.PointerEvent) => {
      cursor.tx = event.clientX;
      cursor.ty = event.clientY;
      const target = event.target instanceof Element ? event.target : null;
      const hot = Boolean(target?.closest("a, button"));
      dotRef.current?.classList.add("is-on");
      ringRef.current?.classList.add("is-on");
      dotRef.current?.classList.toggle("is-hot", hot);
      ringRef.current?.classList.toggle("is-hot", hot);
      if (!cursorRaf) cursorRaf = requestAnimationFrame(pumpCursor);
    };

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("wheel", kickLenis, { passive: true });

    void import("lenis").then(({ default: Lenis }) => {
      if (dead) return;
      lenis = new Lenis({ lerp: 0.08, smoothWheel: true, autoRaf: false });
      lenis.on("scroll", kickLenis);
    });

    return () => {
      dead = true;
      root.classList.remove("home-motion");
      seen.disconnect();
      cancelAnimationFrame(lenisRaf);
      cancelAnimationFrame(cursorRaf);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("wheel", kickLenis);
      lenis?.destroy();
    };
  }, []);

  return (
    <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-5 sm:px-6">
      <div ref={dotRef} className="home-cursor home-cursor-dot" aria-hidden />
      <div ref={ringRef} className="home-cursor home-cursor-ring" aria-hidden />
      <header className="flex min-h-[72vh] flex-col justify-end pb-10 pt-16">
        <div className="flex items-center gap-6 sm:gap-10">
          <HalftoneMark />
          <div className="min-w-0">
            <h1 className="text-[2.75rem] font-semibold leading-none tracking-tight text-lab-ink transition-colors duration-300 hover:text-lab-primary sm:text-7xl lg:text-8xl">
              <SplitLine text={displayName} />
            </h1>
            <p className="mt-4 font-mono text-lg tracking-[0.16em] text-lab-ink-muted transition-colors duration-300 hover:text-lab-ink sm:text-xl">
              <SplitLine text={latinName} />
            </p>
          </div>
        </div>
        <p
          data-reveal
          style={{ ["--i" as string]: 1 }}
          className="mt-10 max-w-xl text-xl leading-relaxed text-lab-ink transition-colors duration-300 hover:text-lab-primary sm:text-2xl"
        >
          {homeIntro}
        </p>
      </header>

      <section aria-label="栏目" className="pb-24">
        <p className="font-mono text-sm uppercase tracking-[0.22em] text-lab-ink-muted transition-colors duration-300 hover:text-lab-ink">
          栏目
        </p>
        <ul className="home-bento mt-6 grid grid-cols-1 items-stretch gap-4 sm:grid-cols-6 sm:gap-5">
          {visibleModules.map((module, index) => (
            <ModuleCard key={module.id} module={module} index={index} />
          ))}
        </ul>
      </section>
    </main>
  );
}
