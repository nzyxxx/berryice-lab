"use client";

import { HalftoneMark } from "@/components/lab/halftone-mark";
import { homeIntro, homeModules, type HomeModule } from "@/lib/content/home-modules";
import { articles } from "@/lib/content/writing";
import { profileConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { ArrowUpRight, FlaskConical, PenLine, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";

const spanClass: Record<string, string> = {
  writing: "sm:col-span-7",
  about: "sm:col-span-5",
  lab: "sm:col-span-12",
};

const glowClass: Record<string, string> = {
  writing: "home-glow-blue",
  about: "home-glow-sand",
  lab: "home-glow-violet",
};

/** 还没写完的占位卡不进首页。数据留在 home-modules，有了去处再出现。 */
const visibleModules = homeModules
  .filter((module) => module.badge !== "即将上线")
  .sort((a, b) => {
    const order = ["writing", "about", "lab"];
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

function Mark({ children }: { children: ReactNode }) {
  return (
    <span className="mb-8 inline-flex text-white/70">
      {children}
    </span>
  );
}

function TileCopy({ title, line }: { title: string; line: string }) {
  return (
    <span className="relative z-[1] block">
      <span className="flex items-start justify-between gap-6">
        <span className="block text-[1.75rem] font-semibold leading-none tracking-[-0.035em] text-white sm:text-4xl">
          {title}
        </span>
        <ArrowUpRight className="home-arrow mt-1 size-4 shrink-0 text-white/35" strokeWidth={1.5} aria-hidden />
      </span>
      <span className="mt-3 block max-w-md text-[15px] leading-relaxed text-white/45">{line}</span>
    </span>
  );
}

function ModuleCard({ module, index }: { module: HomeModule; index: number }) {
  const reveal = { ["--i" as string]: index + 2 };
  const glow = glowClass[module.id] ?? "home-glow-blue";

  if (module.id === "lab") {
    const rows = module.entries?.filter((entry) => entry.href) ?? [];
    return (
      <li data-reveal style={reveal} className={cn("h-full", spanClass.lab)}>
        <article className={cn("home-tile flex h-full flex-col rounded-3xl px-8 py-8 sm:px-10 sm:py-9", glow)}>
          <span className="home-tile-ring" aria-hidden />
          <Mark>
            <FlaskConical className="size-5" strokeWidth={1.25} />
          </Mark>
          <span className="relative z-[1] text-[1.75rem] font-semibold leading-none tracking-[-0.035em] text-white sm:text-4xl">
            {module.title}
          </span>
          <span className="relative z-[1] mt-3 block text-[15px] leading-relaxed text-white/45">
            在做的实验。
          </span>
          <ul className="relative z-[1] mt-8 border-t border-white/10">
            {rows.map((entry) => (
              <li key={entry.title}>
                <Link
                  href={entry.href ?? "/"}
                  className="group/row flex min-h-12 items-center justify-between gap-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                >
                  <span className="min-w-0">
                    <span className="text-sm font-medium text-white">{entry.title}</span>
                    {entry.description ? (
                      <span className="ml-3 text-sm text-white/40">{entry.description}</span>
                    ) : null}
                  </span>
                  <ArrowUpRight className="home-arrow size-4 shrink-0 text-white/35" strokeWidth={1.5} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </article>
      </li>
    );
  }

  const href = module.href ?? "/";
  const line =
    module.id === "writing"
      ? articles[0]?.title ?? "写完的长文和随记。"
      : "现在在做什么，以及怎么找到我。";
  const icon =
    module.id === "writing" ? (
      <PenLine className="size-5" strokeWidth={1.25} />
    ) : (
      <UserRound className="size-5" strokeWidth={1.25} />
    );

  return (
    <li data-reveal style={reveal} className={cn("h-full", spanClass[module.id])}>
      <Link
        href={href}
        className={cn(
          "home-tile group flex h-full min-h-64 flex-col justify-between rounded-3xl px-8 py-8 outline-none focus-visible:ring-2 focus-visible:ring-white/30 sm:min-h-72 sm:px-10 sm:py-10",
          glow
        )}
      >
        <span className="home-tile-ring" aria-hidden />
        <Mark>{icon}</Mark>
        <TileCopy title={module.title} line={line} />
      </Link>
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
        <ul className="home-bento mt-8 grid grid-cols-1 items-stretch gap-4 sm:grid-cols-12 sm:gap-5">
          {visibleModules.map((module, index) => (
            <ModuleCard key={module.id} module={module} index={index} />
          ))}
        </ul>
      </section>
    </main>
  );
}
