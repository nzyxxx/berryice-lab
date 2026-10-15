"use client";

import { HalftoneMark } from "@/components/lab/halftone-mark";
import { homeIntro, homeModules, type HomeModule } from "@/lib/content/home-modules";
import { profileConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Crosshair } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

const cardClass =
  "home-card group relative flex h-full flex-col overflow-hidden rounded-3xl px-7 py-8";

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

function ModuleCard({ module, index }: { module: HomeModule; index: number }) {
  const entries = module.entries ?? [];
  const linked = Boolean(module.href) && entries.length === 0;
  const featured = module.id === "lab";

  const body = (
    <>
      <span className="home-sheen" aria-hidden />
      <div className="relative z-[3] flex flex-1 flex-col">
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
                    className="group/entry flex min-h-11 items-start gap-3 py-4 text-lab-ink outline-none transition-colors hover:text-lab-primary focus-visible:ring-2 focus-visible:ring-lab-ink/30 sm:items-center"
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
      </div>
    </>
  );

  const reveal = { ["--i" as string]: index + 2 };

  if (linked && module.href) {
    return (
      <li data-reveal style={reveal} className={cn("h-full", spanClass[module.id] ?? "sm:col-span-3")}>
        <Link
          href={module.href}
          className={cn(cardClass, "outline-none focus-visible:ring-2 focus-visible:ring-lab-ink/30")}
        >
          {body}
        </Link>
      </li>
    );
  }

  return (
    <li data-reveal style={reveal} className={cn("h-full", spanClass[module.id] ?? "sm:col-span-3")}>
      <article className={cardClass}>
        {body}
      </article>
    </li>
  );
}

export function HomeFront() {
  const { displayName, latinName } = profileConfig;
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!desktop || reduce) return;

    const root = document.documentElement;
    root.classList.add("home-motion");
    const glow = glowRef.current;

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

    const onPointer = (event: globalThis.PointerEvent) => {
      if (!glow || event.pointerType === "touch") return;
      glow.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      glow.classList.add("is-on");
    };
    const onLeave = () => glow?.classList.remove("is-on");

    window.addEventListener("pointermove", onPointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      root.classList.remove("home-motion");
      seen.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-5 sm:px-6">
      <div ref={glowRef} className="home-glow" aria-hidden />
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
