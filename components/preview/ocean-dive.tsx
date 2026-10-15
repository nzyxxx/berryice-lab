"use client";

import { homeIntro, homeModules, type HomeModule } from "@/lib/content/home-modules";
import { profileConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

/**
 * 流冰入海。
 *
 * 参考画面是一条镜头从海面沉到水下。Pexels / Coverr 上能找到的免版权短片
 * 要么是潜水员横游，要么全关键帧压完超过 6MB，对不上「冰面 → 水花 → 吃水线 → 光柱」。
 * 这里用分层画面跟滚动走，不引视频、不引 GSAP。滚动时最多挂一个 rAF，离开页面就取消。
 * prefers-reduced-motion 停在海面，不再跟手。
 */
export function OceanDive() {
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const paint = () => {
      if (motion.matches) {
        stage.style.setProperty("--p", "0");
        track.classList.add("h-auto");
        return;
      }
      track.classList.remove("h-auto");
      const total = Math.max(track.offsetHeight - window.innerHeight, 1);
      const scrolled = Math.min(Math.max(-track.getBoundingClientRect().top, 0), total);
      const p = scrolled / total;
      stage.style.setProperty("--p", p.toFixed(4));
      let text = 1;
      if (p >= 0.32 && p < 0.48) text = 1 - (p - 0.32) / 0.16;
      else if (p >= 0.48 && p < 0.62) text = (p - 0.48) / 0.14;
      stage.style.setProperty("--text", text.toFixed(3));
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
      <div ref={trackRef} className="relative h-[400vh]">
        <div
          ref={stageRef}
          className="sticky top-0 h-svh overflow-hidden text-white"
          style={{ ["--p" as string]: 0, ["--text" as string]: 1 }}
        >
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, #d5e7f2 0%, #8eb9d4 42%, #1d5878 100%)",
              opacity: "clamp(0, calc(1 - (var(--p) - 0.22) * 2.4), 1)",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, #0b3a52 0%, #062433 46%, #021018 100%)",
              opacity: "clamp(0, calc((var(--p) - 0.34) * 2.6), 1)",
            }}
          />

          <div
            aria-hidden
            className="pointer-events-none absolute -left-[10%] top-[-20%] h-[140%] w-[70%] origin-top"
            style={{
              background:
                "repeating-linear-gradient(108deg, transparent 0 46px, rgba(186,224,255,0.16) 46px 78px)",
              opacity: "clamp(0, calc((var(--p) - 0.5) * 2.2), 0.85)",
              transform: "rotate(calc(var(--p) * 10deg)) scale(1.3)",
            }}
          />

          <div
            aria-hidden
            className="absolute inset-x-0 h-40"
            style={{
              top: "calc(72% - var(--p) * 78%)",
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0.55), rgba(120,190,220,0.15) 40%, transparent)",
              opacity: "clamp(0, calc(1 - (var(--p) - 0.15) * 1.6), 1)",
            }}
          />

          {[
            { left: "8%", width: "22%", delay: "0%" },
            { left: "28%", width: "18%", delay: "6%" },
            { left: "52%", width: "26%", delay: "2%" },
            { left: "78%", width: "16%", delay: "10%" },
          ].map((floe) => (
            <div
              key={floe.left}
              aria-hidden
              className="absolute h-10 rounded-[40%] border border-white/70 bg-white/80 shadow-[0_12px_30px_rgba(8,40,60,0.18)]"
              style={{
                left: floe.left,
                width: floe.width,
                top: `calc(68% - var(--p) * ${70 + Number.parseInt(floe.delay, 10)}%)`,
                opacity: "clamp(0, calc(1 - var(--p) * 1.7), 1)",
              }}
            />
          ))}

          <div
            aria-hidden
            className="absolute left-1/2 top-1/2 size-[140vmax] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.55), rgba(255,255,255,0.05) 42%, transparent 68%)",
              opacity: "clamp(0, calc(1 - abs(var(--p) - 0.4) * 5), 0.9)",
              transform: "translate(-50%, -50%) scale(calc(0.2 + var(--p)))",
            }}
          />

          <div
            aria-hidden
            className="absolute inset-x-0 h-px bg-white/80"
            style={{
              top: "calc(64% - var(--p) * 64%)",
              boxShadow: "0 0 24px rgba(255,255,255,0.45)",
              opacity: "clamp(0, calc(1 - abs(var(--p) - 0.48) * 3.2), 1)",
            }}
          />

          <div
            className="absolute inset-0 flex items-center px-6 sm:px-12"
            style={{ opacity: "var(--text)" }}
          >
            <HeroCopy displayName={displayName} latinName={latinName} />
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

function HeroCopy({ displayName, latinName }: { displayName: string; latinName: string }) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/80">Drift ice</p>
      <h1 className="mt-4 font-serif text-[clamp(3.5rem,10vw,7rem)] leading-[0.92] tracking-tight">
        {displayName}
      </h1>
      <p className="mt-3 font-mono text-sm tracking-[0.16em] text-white/75">{latinName}</p>
      <p className="mt-6 max-w-md text-base leading-relaxed text-white/85">{homeIntro}</p>
      <Link
        href="#ocean-modules"
        className="pointer-events-auto mt-8 inline-flex min-h-11 items-center rounded-full bg-white px-5 text-sm font-medium text-[#102833]"
      >
        进入栏目
      </Link>
      <p className="pointer-events-none absolute bottom-6 left-6 font-mono text-[11px] uppercase tracking-[0.18em] text-white/70">
        Scroll to explore ↓
      </p>
      <p className="pointer-events-none absolute bottom-6 right-6 font-mono text-[11px] uppercase tracking-[0.18em] text-white/70">
        Surface to depth
      </p>
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
      {module.description ? <p className="mt-4 text-sm leading-relaxed text-lab-ink-subtle">{module.description}</p> : null}
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
      <Link href={href} className={cn("block h-full rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-lab-ink/30")}>
        {body}
      </Link>
    </li>
  );
}
