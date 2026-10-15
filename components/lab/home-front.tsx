"use client";

import { HalftoneMark } from "@/components/lab/halftone-mark";
import { homeIntro, homeModules, type HomeModule } from "@/lib/content/home-modules";
import { articles } from "@/lib/content/writing";
import { profileConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useRef } from "react";

const spanClass: Record<string, string> = {
  lab: "sm:col-span-7 sm:row-span-2",
  writing: "sm:col-span-5",
  about: "sm:col-span-5",
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

function Pill({ children }: { children: string }) {
  return (
    <span className="inline-flex h-11 items-center rounded-full bg-white px-4 text-sm font-medium text-neutral-950">
      {children}
    </span>
  );
}

function LabPreview() {
  return (
    <div className="relative flex min-h-56 flex-1 items-center justify-center">
      <img
        src="/arsenal/ak-12.webp"
        alt=""
        className="home-preview pointer-events-none h-48 w-full object-contain sm:h-64"
      />
    </div>
  );
}

function WritingPreview() {
  const latest = articles.slice(0, 3);
  return (
    <div className="home-preview relative h-36 overflow-hidden">
      {[0, 1, 2].map((sheet) => (
        <div
          key={sheet}
          className="absolute inset-x-4 top-3 h-24 rounded-2xl border border-white/10 bg-[#16181e]"
          style={{ transform: `translate3d(${sheet * 10}px, ${sheet * 12}px, 0)` }}
        >
          {latest[sheet] ? (
            <p className="truncate px-4 pt-4 text-sm font-medium text-white">{latest[sheet].title}</p>
          ) : (
            <span className="mt-4 ml-4 block h-2.5 w-2/3 rounded-full bg-white/20" />
          )}
          <span className="mt-3 ml-4 block h-2 w-1/2 rounded-full bg-white/10" />
          <span className="mt-2 ml-4 block h-2 w-1/3 rounded-full bg-white/10" />
        </div>
      ))}
    </div>
  );
}

function AboutPreview() {
  const { displayName, latinName, tags, avatarInitials } = profileConfig;
  return (
    <div className="home-preview flex h-36 items-center">
      <div className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-[#14161c] px-4 py-4">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl font-semibold text-neutral-950">
          {avatarInitials}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-lg font-semibold tracking-tight text-white">{displayName}</span>
          <span className="mt-0.5 block text-sm text-white/50">{latinName}</span>
          <span className="mt-2 flex flex-wrap gap-1.5">
            {tags.slice(0, 2).map((tag) => (
              <span key={tag} className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-white/70">
                {tag}
              </span>
            ))}
          </span>
        </span>
      </div>
    </div>
  );
}

function ModuleCard({ module, index }: { module: HomeModule; index: number }) {
  const featured = module.id === "lab";
  const href = module.href ?? module.entries?.find((entry) => entry.href)?.href ?? "/";
  const line =
    module.id === "writing"
      ? articles[0]?.title ?? "写完的长文会出现在这里"
      : module.id === "about"
        ? "现在在做什么，以及怎么找到我"
        : "枪械库、社区改枪码、主播配装";
  const pill = featured ? "进入实验室" : module.id === "writing" ? "阅读" : "关于我";

  return (
    <li data-reveal style={{ ["--i" as string]: index + 2 }} className={cn("h-full", spanClass[module.id])}>
      <Link
        href={href}
        className={cn(
          "home-tile group flex h-full min-h-64 flex-col justify-between rounded-[1.75rem] p-6 outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:p-7",
          featured && "home-tile-glass min-h-[28rem]"
        )}
      >
        <span className="home-tile-glow" aria-hidden />
        {featured ? <LabPreview /> : module.id === "writing" ? <WritingPreview /> : <AboutPreview />}
        <span className="relative z-[1] mt-6">
          <span className="block text-3xl font-semibold tracking-[-0.04em] text-white">{module.title}</span>
          <span className="mt-2 block truncate text-sm text-white/50">{line}</span>
          <span className="mt-5 block">
            <Pill>{pill}</Pill>
          </span>
        </span>
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
