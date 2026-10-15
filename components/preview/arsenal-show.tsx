"use client";

import { useLenisLoop } from "@/components/preview/use-lenis-loop";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export interface ArsenalGun {
  id: string;
  name: string;
  typeLabel: string;
  imageUrl: string;
  stats: { label: string; value: number; max: number }[];
  meta: string;
  pageHref: string;
  loadoutHref: string;
}

const POOL = "甲乙丙丁戊己庚辛壬癸";

function Scramble({ text, className }: { text: string; className?: string }) {
  const [value, setValue] = useState(text);
  const timer = useRef(0);

  const stop = () => {
    window.clearTimeout(timer.current);
    setValue(text);
  };

  const play = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    let frame = 0;
    const tick = () => {
      frame += 1;
      setValue(
        text
          .split("")
          .map((char, index) => {
            if (char === " " || frame > index + 5) return char;
            return POOL[Math.floor(Math.random() * POOL.length)] ?? char;
          })
          .join("")
      );
      if (frame < text.length + 6) timer.current = window.setTimeout(tick, 32);
      else setValue(text);
    };
    window.clearTimeout(timer.current);
    tick();
  };

  useEffect(() => {
    play();
    return () => window.clearTimeout(timer.current);
    // 换一把枪时重新打乱一次标题
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <span className={className} onMouseEnter={play} onMouseLeave={stop} onFocus={play} onBlur={stop}>
      {value}
    </span>
  );
}

export function ArsenalShow({ guns }: { guns: ArsenalGun[] }) {
  const ringRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rotorRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const detailImgRef = useRef<HTMLImageElement>(null);
  const statRefs = useRef<(HTMLElement | null)[]>([]);
  const statsListRef = useRef<HTMLUListElement>(null);
  const spin = useRef(0);
  const detailShown = useRef(0);
  const countFrom = useRef<number | null>(null);
  const flyFrom = useRef<DOMRect | null>(null);
  const [selected, setSelected] = useState<ArsenalGun | null>(guns[0] ?? null);
  const lenisRef = useLenisLoop((time) => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ring = ringRef.current;
    const rotor = rotorRef.current;
    if (ring && rotor && !reduced && window.innerWidth >= 768) {
      const total = Math.max(ring.offsetHeight - window.innerHeight, 1);
      const progress = Math.min(Math.max(-ring.getBoundingClientRect().top, 0), total) / total;
      const target = progress * 260;
      spin.current += (target - spin.current) * 0.07;
      rotor.style.setProperty("--spin", `${spin.current}deg`);
      cardsRef.current.forEach((card, index) => {
        if (!card) return;
        const facing = Math.cos(((index / guns.length) * 360 + spin.current) * (Math.PI / 180));
        const front = Math.max(0, facing);
        const blur = facing > 0.72 ? 0 : facing > 0.28 ? 1 : 2;
        card.style.opacity = facing < -0.12 ? "0" : String(0.58 + front * 0.42);
        card.style.setProperty("--front", String(0.9 + front * 0.16));
        if (card.dataset.blur !== String(blur)) {
          card.dataset.blur = String(blur);
          card.style.filter = blur ? `blur(${blur}px)` : "";
        }
      });
    }
    const track = detailRef.current;
    const stage = stageRef.current;
    if (track && stage) {
      if (reduced) {
        stage.style.setProperty("--d", "0.55");
      } else {
        const total = Math.max(track.offsetHeight - window.innerHeight, 1);
        const target = Math.min(Math.max(-track.getBoundingClientRect().top, 0), total) / total;
        detailShown.current += (target - detailShown.current) * 0.08;
        const d = detailShown.current;
        stage.style.setProperty("--d", d.toFixed(4));
        if (d > 0.2) statsListRef.current?.classList.add("is-in");
        if (d > 0.2 && countFrom.current === null) countFrom.current = time;
        if (countFrom.current !== null && selected) {
          selected.stats.forEach((stat, index) => {
            const local = Math.min(1, Math.max(0, (time - countFrom.current! - index * 90) / 720));
            const eased = 1 - (1 - local) ** 3;
            const node = statRefs.current[index];
            if (node) node.textContent = String(Math.round(stat.value * eased));
          });
        }
      }
    }
  });

  useLayoutEffect(() => {
    const first = flyFrom.current;
    const dest = detailImgRef.current;
    const track = detailRef.current;
    flyFrom.current = null;
    if (!first || !dest || !track) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stageBox = stageRef.current?.getBoundingClientRect();
    const imgBox = dest.getBoundingClientRect();
    const targetLeft = imgBox.left - (stageBox?.left ?? 0);
    const targetTop = imgBox.top - (stageBox?.top ?? 0);
    if (reduced) {
      lenisRef.current?.scrollTo(track, { duration: 0 });
      return;
    }
    const flyer = dest.cloneNode(true) as HTMLImageElement;
    const sx = imgBox.width / Math.max(first.width, 1);
    const sy = imgBox.height / Math.max(first.height, 1);
    flyer.style.cssText = [
      "position:fixed",
      "left:0",
      "top:0",
      "margin:0",
      "z-index:80",
      "pointer-events:none",
      "object-fit:contain",
      "transform-origin:0 0",
      `width:${first.width}px`,
      `height:${first.height}px`,
      `transform:translate3d(${first.left}px,${first.top}px,0)`,
      "transition:transform .95s cubic-bezier(.16,1,.3,1)",
    ].join(";");
    document.body.appendChild(flyer);
    dest.style.opacity = "0";
    lenisRef.current?.scrollTo(track, { duration: 1.05 });
    requestAnimationFrame(() => {
      flyer.style.transform = `translate3d(${targetLeft}px,${targetTop}px,0) scale(${sx},${sy})`;
    });
    const finish = () => {
      dest.style.opacity = "";
      flyer.remove();
    };
    flyer.addEventListener("transitionend", finish, { once: true });
    window.setTimeout(finish, 1100);
  }, [selected, lenisRef]);

  const gun = selected;

  return (
    <div className="bg-[#f4f1ea] text-[#1c1a16]">
      <div ref={ringRef} className="relative h-auto md:h-[220vh]">
        <div className="relative flex flex-col px-4 py-10 md:sticky md:top-0 md:h-svh md:justify-center md:px-6">
          <p className="mx-auto max-w-5xl font-mono text-[11px] uppercase tracking-[0.22em] text-[#6d675d]">
            Arsenal
          </p>
          <h1 className="mx-auto mt-3 max-w-5xl font-serif text-5xl tracking-tight sm:text-7xl">枪械</h1>
          <p className="mx-auto mt-4 w-full max-w-5xl text-sm leading-relaxed text-[#6d675d]">
            滚动转动这一圈。点一把，镜头靠近。
          </p>
          <ul className="mt-8 flex snap-x gap-3 overflow-x-auto pb-4 md:hidden">
              {guns.map((item) => (
                <li key={item.id} className="snap-center">
                  <GunCard gun={item} selected={item.id === gun?.id} onSelect={() => setSelected(item)} />
                </li>
              ))}
            </ul>
            <div className="relative mx-auto mt-4 hidden h-[440px] w-full max-w-5xl [perspective:1400px] md:block">
              <div
                ref={rotorRef}
                className="absolute left-1/2 top-1/2 h-0 w-0 [transform-style:preserve-3d]"
                style={{ transform: "rotateX(8deg) rotateY(var(--spin, 0deg))" }}
              >
                {guns.map((item, index) => (
                  <button
                    key={item.id}
                    ref={(node) => {
                      cardsRef.current[index] = node;
                    }}
                    type="button"
                    className="absolute left-0 top-0 [backface-visibility:hidden]"
                    style={{
                      transform: `rotateY(${(360 / guns.length) * index}deg) translateZ(520px) translate(-50%, -50%)`,
                    }}
                    onClick={(event) => {
                      countFrom.current = null;
                      statRefs.current = [];
                      statsListRef.current?.classList.remove("is-in");
                      flyFrom.current = event.currentTarget.querySelector("img")?.getBoundingClientRect() ?? null;
                      setSelected(item);
                    }}
                  >
                    <span className="block w-64" style={{ transform: "scale(var(--front, 1))" }}>
                      <GunCard gun={item} selected={item.id === gun?.id} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
        </div>
      </div>

      <div ref={detailRef} className="relative h-[260vh] bg-[#101423] text-[#e7e1d6]">
        <div ref={stageRef} className="sticky top-0 flex h-svh items-center overflow-hidden" style={{ ["--d" as string]: 0 }}>
          {gun ? (
            <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 md:grid-cols-[1.2fr_0.8fr]">
              <div className="relative [perspective:1100px]">
                <div aria-hidden className="absolute inset-10 rounded-full bg-black/50 blur-lg" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={gun.imageUrl}
                  alt=""
                  className="absolute left-8 top-6 w-[88%] opacity-35"
                  style={{
                    transform:
                      "translate3d(calc((var(--d) - 0.5) * -64px), calc((var(--d) - 0.4) * 28px), 0)",
                  }}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={detailImgRef}
                  src={gun.imageUrl}
                  alt={gun.name}
                  className="relative w-full object-contain"
                  style={{
                    transform:
                      "translate3d(calc((var(--d) - 0.5) * 36px), calc((0.35 - var(--d)) * 22px), 0) scale(calc(1.02 + var(--d) * 0.08))",
                  }}
                />
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#9aa08a]">{gun.typeLabel}</p>
                <h2 className="mt-3 font-serif text-5xl text-[#f2efe6]">
                  <Scramble text={gun.name} />
                </h2>
                <p className="mt-3 text-sm text-[#b7b1a4]">{gun.meta}</p>
                <ul ref={statsListRef} className="arsenal-stats mt-8 space-y-3">
                  {gun.stats.map((stat, index) => (
                    <li key={stat.label} className="arsenal-stat" style={{ ["--i" as string]: index }}>
                      <div className="flex justify-between font-mono text-[11px] tracking-wide text-[#9aa08a]">
                        <span>{stat.label}</span>
                        <span
                          ref={(node) => {
                            statRefs.current[index] = node;
                          }}
                        >
                          {stat.value}
                        </span>
                      </div>
                      <div className="mt-1 h-px bg-white/10">
                        <div
                          className="h-px bg-[#e07a3d]"
                          style={{ width: `${Math.min(100, (stat.value / stat.max) * 100)}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={gun.pageHref}
                    className="inline-flex min-h-11 items-center rounded-full bg-[#e07a3d] px-5 text-sm font-medium text-[#1a120c]"
                  >
                    <Scramble text="查看枪械" />
                  </Link>
                  <Link
                    href={gun.loadoutHref}
                    className="inline-flex min-h-11 items-center rounded-full border border-white/20 px-5 text-sm"
                  >
                    <Scramble text="去改枪台" />
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function GunCard({
  gun,
  selected,
  onSelect,
}: {
  gun: ArsenalGun;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const body = (
    <span
      className={cn(
        "block w-56 rounded-2xl bg-white p-3 text-left shadow-[0_18px_40px_-24px_rgba(40,30,10,0.45)]",
        selected && "ring-2 ring-[#e07a3d]"
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={gun.imageUrl} alt="" className="h-28 w-full object-contain" />
      <span className="mt-2 block text-sm font-medium text-[#1c1a16]">{gun.name}</span>
      <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-[#6d675d]">
        {gun.typeLabel}
      </span>
    </span>
  );

  if (!onSelect) return body;
  return (
    <button type="button" onClick={onSelect} className="text-left">
      {body}
    </button>
  );
}
