"use client";

import { homeIntro, homeModules, type HomeModule } from "@/lib/content/home-modules";
import { profileConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";

/**
 * 三张实拍关键帧接滚动：海面、吃水线、水下。
 * 原图由页面压成 public/preview/ocean 的 AVIF / WebP（2560 与 1080）。
 * 只改 transform 和 opacity。模糊只在穿过水面的一小段里脉冲一次。
 */

const FRAMES = ["surface", "waterline", "under"] as const;

function frameSources(name: (typeof FRAMES)[number]) {
  return {
    mobileAvif: `/preview/ocean/${name}-1080.avif`,
    mobileWebp: `/preview/ocean/${name}-1080.webp`,
    avif: `/preview/ocean/${name}-2560.avif`,
    webp: `/preview/ocean/${name}-2560.webp`,
  };
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function OceanDive() {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const width = window.innerWidth;
    const next = FRAMES.flatMap((name) => {
      const src = frameSources(name);
      return width < 768 ? [src.mobileAvif, src.mobileWebp] : [src.avif, src.webp];
    });
    for (const href of next) {
      const image = new Image();
      image.src = href;
    }
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const paint = () => {
      if (motion.matches) {
        stage.style.setProperty("--ken", "0");
        stage.style.setProperty("--surface", "1");
        stage.style.setProperty("--water", "0");
        stage.style.setProperty("--under", "0");
        stage.style.setProperty("--wipe", "1");
        stage.style.setProperty("--blur", "0px");
        stage.style.setProperty("--text", "1");
        stage.style.setProperty("--tone", "0");
        track.style.height = "100svh";
        return;
      }
      track.style.height = "";
      const total = Math.max(track.offsetHeight - window.innerHeight, 1);
      const p = clamp(-track.getBoundingClientRect().top / total);
      const ken = clamp(p / 0.4);
      const surface = 1 - clamp((p - 0.28) / 0.2);
      const water = clamp((p - 0.26) / 0.18) * (1 - clamp((p - 0.56) / 0.16));
      const under = clamp((p - 0.52) / 0.18);
      const wipe = clamp((p - 0.24) / 0.26);
      const blur = Math.max(0, 1 - Math.abs(p - 0.4) / 0.07) * 7;
      let text = 1;
      if (p >= 0.34 && p < 0.5) text = 1 - (p - 0.34) / 0.16;
      else if (p >= 0.5 && p < 0.66) text = (p - 0.5) / 0.16;
      stage.style.setProperty("--ken", ken.toFixed(4));
      stage.style.setProperty("--surface", surface.toFixed(4));
      stage.style.setProperty("--water", water.toFixed(4));
      stage.style.setProperty("--under", under.toFixed(4));
      stage.style.setProperty("--wipe", wipe.toFixed(4));
      stage.style.setProperty("--blur", `${blur.toFixed(2)}px`);
      stage.style.setProperty("--text", text.toFixed(4));
      stage.style.setProperty("--tone", clamp((p - 0.58) / 0.12).toFixed(4));
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(paint);
    };

    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    motion.addEventListener("change", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      motion.removeEventListener("change", onScroll);
    };
  }, []);

  const { displayName, latinName } = profileConfig;

  return (
    <>
      <div ref={trackRef} className="relative h-[420vh]">
        <div ref={stageRef} className="sticky top-0 h-svh overflow-hidden bg-[#071018]">
          <PhotoFrame
            name="surface"
            alt="日落时的流冰海面"
            className="z-0"
            style={{
              opacity: "var(--surface, 1)",
              transform:
                "translate3d(0, calc(var(--ken, 0) * -6%), 0) scale(calc(1.06 + var(--ken, 0) * 0.16))",
            }}
          />
          <PhotoFrame
            name="waterline"
            alt="穿过海面的吃水线"
            className="z-10"
            style={{
              opacity: "var(--water, 0)",
              transform: "translate3d(0, calc((1 - var(--wipe, 0)) * 10%), 0) scale(1.05)",
              filter: "blur(var(--blur, 0px))",
              maskImage:
                "linear-gradient(to top, #000 0%, #000 calc(var(--wipe, 1) * 100%), transparent calc(var(--wipe, 1) * 100% + 16%))",
              WebkitMaskImage:
                "linear-gradient(to top, #000 0%, #000 calc(var(--wipe, 1) * 100%), transparent calc(var(--wipe, 1) * 100% + 16%))",
            }}
          />
          <PhotoFrame
            name="under"
            alt="水下的冰与光柱"
            className="z-20"
            style={{
              opacity: "var(--under, 0)",
              transform: "translate3d(0, calc(var(--under, 0) * -3%), 0) scale(calc(1.08 + var(--under, 0) * 0.1))",
            }}
          />

          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-30 mix-blend-screen motion-safe:animate-[caustic_9s_ease-in-out_infinite_alternate]"
            style={{
              opacity: "calc(var(--under, 0) * 0.35)",
              background:
                "radial-gradient(ellipse at 20% 30%, rgba(190,230,255,0.45), transparent 42%), radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.28), transparent 36%)",
            }}
          />
          <Particles />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-40 opacity-25 mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='.55'/></svg>\")",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-40"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.38) 100%)",
            }}
          />

          <div className="absolute inset-0 z-50" style={{ opacity: "var(--text, 1)" }}>
            <div className="flex h-full items-center px-6 sm:px-12">
              <HeroCopy displayName={displayName} latinName={latinName} />
            </div>
            <p className="pointer-events-none absolute bottom-6 left-6 font-mono text-[11px] uppercase tracking-[0.18em] text-white/80 mix-blend-difference">
              Scroll to explore ↓
            </p>
            <p className="pointer-events-none absolute bottom-6 right-6 font-mono text-[11px] uppercase tracking-[0.18em] text-white/80 mix-blend-difference">
              Surface to depth
            </p>
          </div>
        </div>
      </div>

      <section id="ocean-modules" className="bg-lab-canvas px-5 py-20 text-lab-ink sm:px-8 md:py-28">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-lab-ink-subtle">Below</p>
          <h2 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">水面之下</h2>
          <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {homeModules.map((module) => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

function PhotoFrame({
  name,
  alt,
  className,
  style,
}: {
  name: (typeof FRAMES)[number];
  alt: string;
  className?: string;
  style?: CSSProperties;
}) {
  const src = frameSources(name);
  return (
    <div className={cn("pointer-events-none absolute -inset-[8%] will-change-transform", className)} style={style}>
      <picture>
        <source media="(max-width: 767px)" srcSet={src.mobileAvif} type="image/avif" />
        <source media="(max-width: 767px)" srcSet={src.mobileWebp} type="image/webp" />
        <source srcSet={src.avif} type="image/avif" />
        <img src={src.webp} alt={alt} className="h-full w-full object-cover" draggable={false} />
      </picture>
    </div>
  );
}

function Particles() {
  const dots = [
    { left: "12%", delay: "0s", size: 4 },
    { left: "22%", delay: "1.2s", size: 3 },
    { left: "38%", delay: "0.4s", size: 5 },
    { left: "54%", delay: "2s", size: 3 },
    { left: "67%", delay: "0.8s", size: 4 },
    { left: "78%", delay: "1.6s", size: 3 },
    { left: "88%", delay: "0.2s", size: 5 },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-30" style={{ opacity: "var(--under, 0)" }}>
      {dots.map((dot) => (
        <span
          key={dot.left}
          className="absolute bottom-[-8%] rounded-full bg-white/70 motion-safe:animate-[ocean-rise_11s_linear_infinite]"
          style={{
            left: dot.left,
            width: dot.size,
            height: dot.size,
            animationDelay: dot.delay,
          }}
        />
      ))}
    </div>
  );
}

function HeroCopy({ displayName, latinName }: { displayName: string; latinName: string }) {
  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <p
        className="font-mono text-[11px] uppercase tracking-[0.28em]"
        style={{ color: "color-mix(in srgb, #163044 calc((1 - var(--tone, 0)) * 100%), white)" }}
      >
        Drift ice
      </p>
      <h1
        className="mt-4 font-serif text-[clamp(3.5rem,10vw,7rem)] leading-[0.92] tracking-tight"
        style={{ color: "color-mix(in srgb, #102033 calc((1 - var(--tone, 0)) * 100%), white)" }}
      >
        {displayName}
      </h1>
      <p
        className="mt-3 font-mono text-sm tracking-[0.16em]"
        style={{ color: "color-mix(in srgb, #2a4660 calc((1 - var(--tone, 0)) * 100%), rgba(255,255,255,0.78))" }}
      >
        {latinName}
      </p>
      <p
        className="mt-6 max-w-md text-base leading-relaxed"
        style={{ color: "color-mix(in srgb, #1b3348 calc((1 - var(--tone, 0)) * 100%), rgba(255,255,255,0.88))" }}
      >
        {homeIntro}
      </p>
      <Link
        href="#ocean-modules"
        className="pointer-events-auto mt-8 inline-flex min-h-11 items-center rounded-full bg-white px-5 text-sm font-medium text-[#102033]"
      >
        进入栏目
      </Link>
    </div>
  );
}

function ModuleCard({ module }: { module: HomeModule }) {
  const entries = module.entries ?? [];
  const href = module.href && entries.length === 0 ? module.href : undefined;
  const body = (
    <div className="flex h-full flex-col justify-between rounded-3xl border border-lab-hairline bg-lab-surface-1 p-6 dark:bg-lab-surface-2">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-3xl tracking-tight">{module.title}</h3>
        {module.badge ? (
          <span className="rounded-full bg-lab-ink px-2 py-0.5 text-[11px] text-lab-canvas">{module.badge}</span>
        ) : href ? (
          <ArrowUpRight className="size-4 text-lab-ink-tertiary" />
        ) : null}
      </div>
      {module.description ? (
        <p className="mt-4 text-sm leading-relaxed text-lab-ink-subtle">{module.description}</p>
      ) : null}
      {entries.map((entry) =>
        entry.href ? (
          <Link key={entry.title} href={entry.href} className="mt-4 block min-h-11 border-t border-lab-hairline pt-3 text-sm">
            <span className="font-medium">{entry.title}</span>
            <span className="mt-1 block text-lab-ink-subtle">{entry.description}</span>
          </Link>
        ) : null
      )}
    </div>
  );

  if (!href) return <li>{body}</li>;
  return (
    <li>
      <Link href={href} className="block h-full rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-lab-ink/30">
        {body}
      </Link>
    </li>
  );
}
