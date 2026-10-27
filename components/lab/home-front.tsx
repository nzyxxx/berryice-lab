"use client";

import { HalftoneMark } from "@/components/lab/halftone-mark";
import { homeIntro, homeModules, type HomeModule } from "@/lib/content/home-modules";
import { articles } from "@/lib/content/writing";
import { profileConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

const spanClass: Record<string, string> = {
  writing: "sm:col-span-7",
  about: "sm:col-span-5",
  lab: "sm:col-span-12",
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

function usePressLift() {
  const ref = useRef<HTMLElement | null>(null);
  const y = useRef(0);
  const vel = useRef(0);
  const target = useRef(0);
  const scale = useRef(1);
  const raf = useRef(0);

  const apply = () => {
    const node = ref.current;
    if (!node) return;
    node.style.transform = `translate3d(0, ${y.current}px, 0) scale(${scale.current})`;
  };
  const tick = () => {
    const delta = target.current - y.current;
    vel.current = vel.current * 0.78 + delta * 0.34;
    y.current += vel.current;
    if (Math.abs(delta) < 0.04 && Math.abs(vel.current) < 0.04) {
      y.current = target.current;
      vel.current = 0;
      apply();
      raf.current = 0;
      return;
    }
    apply();
    raf.current = requestAnimationFrame(tick);
  };
  const kick = () => {
    if (raf.current) return;
    raf.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => {
    if (raf.current) cancelAnimationFrame(raf.current);
  }, []);

  return {
    setRef: (node: HTMLElement | null) => {
      ref.current = node;
    },
    onPointerEnter: () => {
      if (!document.documentElement.classList.contains("home-motion")) return;
      target.current = -3;
      kick();
    },
    onPointerLeave: () => {
      target.current = 0;
      scale.current = 1;
      kick();
    },
    onPointerDown: () => {
      if (!document.documentElement.classList.contains("home-motion")) return;
      scale.current = 0.98;
      apply();
    },
    onPointerUp: () => {
      scale.current = 1;
      apply();
    },
  };
}

function ModuleCard({ module, index }: { module: HomeModule; index: number }) {
  const reveal = { ["--i" as string]: index + 2 };
  const lift = usePressLift();

  if (module.id === "lab") {
    const rows = module.entries?.filter((entry) => entry.href) ?? [];
    return (
      <li data-reveal style={reveal} className={cn("h-full", spanClass.lab)}>
        <article
          ref={lift.setRef}
          onPointerEnter={lift.onPointerEnter}
          onPointerLeave={lift.onPointerLeave}
          onPointerDown={lift.onPointerDown}
          onPointerUp={lift.onPointerUp}
          onPointerCancel={lift.onPointerUp}
          className="home-tile flex h-full flex-col rounded-3xl px-8 py-8 sm:px-10 sm:py-9"
        >
          <span className="home-tile-ring" aria-hidden />
          <span className="relative z-[1] text-[1.75rem] font-semibold leading-none tracking-[-0.035em] text-white sm:text-4xl">
            {module.title}
          </span>
          <span className="relative z-[1] mt-3 block text-base leading-relaxed text-lab-ink">
            在做的实验。
          </span>
          <ul className="relative z-[1] mt-10 space-y-1">
            {rows.map((entry) => (
              <li key={entry.title}>
                <Link
                  href={entry.href ?? "/"}
                  className="group/row flex min-h-12 items-center justify-between gap-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                >
                  <span className="min-w-0">
                    <span className="text-sm font-medium text-white">{entry.title}</span>
                    {entry.description ? (
                      <span className="ml-3 text-base text-lab-ink">{entry.description}</span>
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
  const writing = module.id === "writing";

  return (
    <li data-reveal style={reveal} className={cn("h-full", spanClass[module.id])}>
      <Link
        ref={lift.setRef}
        href={href}
        onPointerEnter={lift.onPointerEnter}
        onPointerLeave={lift.onPointerLeave}
        onPointerDown={lift.onPointerDown}
        onPointerUp={lift.onPointerUp}
        onPointerCancel={lift.onPointerUp}
        className={cn(
          "home-tile group flex h-full min-h-64 rounded-3xl px-8 py-8 outline-none focus-visible:ring-2 focus-visible:ring-white/30 sm:min-h-72 sm:px-10 sm:py-10",
          writing ? "flex-col justify-between sm:flex-row sm:items-end sm:gap-8" : "flex-col justify-end pt-16 sm:pt-24"
        )}
      >
        <span className="home-tile-ring" aria-hidden />
        {writing ? (
          <>
            <span className="relative z-[1] block text-[1.75rem] font-semibold leading-none tracking-[-0.035em] text-white sm:text-4xl">
              {module.title}
            </span>
            <span className="relative z-[1] mt-4 block max-w-xs text-base leading-relaxed text-lab-ink sm:mt-0 sm:text-right">
              {line}
              <ArrowUpRight className="home-arrow ml-2 inline size-4 text-white/70" strokeWidth={1.5} aria-hidden />
            </span>
          </>
        ) : (
          <span className="relative z-[1] block">
            <span className="block text-base leading-relaxed text-lab-ink">{line}</span>
            <span className="mt-6 flex items-end justify-between gap-4">
              <span className="block text-[1.75rem] font-semibold leading-none tracking-[-0.035em] text-white sm:text-4xl">
                {module.title}
              </span>
              <ArrowUpRight className="home-arrow size-4 shrink-0 text-white/70" strokeWidth={1.5} aria-hidden />
            </span>
          </span>
        )}
      </Link>
    </li>
  );
}

export function HomeFront() {
  const { displayName, latinName } = profileConfig;

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!desktop || reduce) return;

    const root = document.documentElement;
    root.classList.add("home-motion");

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

    return () => {
      root.classList.remove("home-motion");
      seen.disconnect();
    };
  }, []);

  return (
    <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-5 sm:px-6">
      <header className="flex min-h-[72vh] flex-col justify-end pb-10 pt-16">
        <div className="flex items-center gap-6 sm:gap-10">
          <HalftoneMark />
          <div className="min-w-0">
            <h1 className="text-[2.75rem] font-semibold leading-none tracking-tight text-lab-ink sm:text-7xl lg:text-8xl">
              <SplitLine text={displayName} />
            </h1>
            <p className="mt-4 text-lg text-lab-ink-muted sm:text-xl">
              <SplitLine text={latinName} />
            </p>
          </div>
        </div>
        <p
          data-reveal
          style={{ ["--i" as string]: 1 }}
          className="mt-10 max-w-xl text-xl leading-relaxed text-lab-ink sm:text-2xl"
        >
          {homeIntro}
        </p>
        <Link
          href="/delta-gun"
          className="mt-8 inline-flex h-11 w-fit items-center self-start rounded-full bg-lab-primary px-5 text-sm font-medium text-[#04131c]"
        >
          进入实验室
        </Link>
      </header>

      <section aria-label="栏目" className="pb-24">
        <ul className="home-bento grid grid-cols-1 items-stretch gap-4 sm:grid-cols-12 sm:gap-5">
          {visibleModules.map((module, index) => (
            <ModuleCard key={module.id} module={module} index={index} />
          ))}
        </ul>
      </section>
    </main>
  );
}
