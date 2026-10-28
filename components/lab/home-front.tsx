"use client";

import { HalftoneMark } from "@/components/lab/halftone-mark";
import { glassSurfaceClass } from "@/components/uiverse/glass-surface";
import { homeIntro, homeModules, type HomeModule } from "@/lib/content/home-modules";
import { articles } from "@/lib/content/writing";
import { profileConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";

const spanClass: Record<string, string> = {
  writing: "sm:col-span-6",
  about: "sm:col-span-6",
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

function EntryArrow() {
  return (
    <ArrowUpRight
      className="home-arrow size-4 shrink-0 text-lab-ink-tertiary"
      strokeWidth={1.5}
      aria-hidden
    />
  );
}

/** 标题在上，一行说明紧跟。箭头只出现在真正能点的那一侧。 */
function CardHeading({
  title,
  blurb,
  trailing,
}: {
  title: string;
  blurb: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="relative z-[1] flex items-start justify-between gap-5">
      <div className="min-w-0">
        <h2 className="text-[1.65rem] font-semibold leading-none tracking-[-0.035em] text-lab-ink sm:text-[1.85rem]">
          {title}
        </h2>
        {blurb ? (
          <p className="mt-3 max-w-[38ch] text-[15px] leading-relaxed text-lab-ink-muted">{blurb}</p>
        ) : null}
      </div>
      {trailing ? (
        <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center">{trailing}</span>
      ) : null}
    </div>
  );
}

function tileMotion(lift: ReturnType<typeof usePressLift>) {
  return {
    ref: lift.setRef as (node: HTMLElement | null) => void,
    onPointerEnter: lift.onPointerEnter,
    onPointerLeave: lift.onPointerLeave,
    onPointerDown: lift.onPointerDown,
    onPointerUp: lift.onPointerUp,
    onPointerCancel: lift.onPointerUp,
  };
}

function moduleBlurb(module: HomeModule) {
  if (module.id === "writing" && articles[0]?.title) return articles[0].title;
  return module.description ?? "";
}

function ModuleCard({ module, index }: { module: HomeModule; index: number }) {
  const reveal = { ["--i" as string]: index + 2 };
  const lift = usePressLift();
  const blurb = moduleBlurb(module);
  const shell = glassSurfaceClass(
    "home-tile flex h-full flex-col rounded-3xl px-7 py-7 sm:px-8 sm:py-8"
  );
  const linkShell = cn(
    shell,
    "group outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-lab-primary"
  );

  if (module.id === "lab") {
    const rows = module.entries?.filter((entry) => entry.href) ?? [];
    return (
      <li data-reveal style={reveal} className={cn("h-full", spanClass.lab)}>
        <article {...tileMotion(lift)} className={shell}>
          <span className="home-tile-ring" aria-hidden />
          <CardHeading title={module.title} blurb={blurb} />
          {rows.length > 0 ? (
            <ul className="relative z-[1] mt-6 divide-y divide-lab-hairline border-t border-lab-hairline">
              {rows.map((entry) => (
                <li key={entry.title}>
                  <Link
                    href={entry.href ?? "/"}
                    className="group/row flex min-h-11 items-center gap-4 py-3.5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-lab-primary"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="text-[15px] font-medium tracking-tight text-lab-ink">{entry.title}</span>
                      {entry.description ? (
                        <span className="mt-0.5 block text-sm leading-relaxed text-lab-ink-subtle sm:ml-3 sm:mt-0 sm:inline">
                          {entry.description}
                        </span>
                      ) : null}
                    </span>
                    <EntryArrow />
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      </li>
    );
  }

  return (
    <li data-reveal style={reveal} className={cn("h-full", spanClass[module.id])}>
      <Link {...tileMotion(lift)} href={module.href ?? "/"} className={linkShell}>
        <span className="home-tile-ring" aria-hidden />
        <CardHeading title={module.title} blurb={blurb} trailing={<EntryArrow />} />
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
