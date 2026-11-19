"use client";

import { CountUp } from "@/components/lab/motion-play";
import { useEffect, useState } from "react";

const CHAPTERS = [
  { id: "spotlight", title: "聚光灯", where: "首页六栏。精细指针在卡片上移动时，局部光跟着走。触屏没有这层光。" },
  { id: "reveal", title: "滚动显现", where: "六栏进入视口才播放一次。没进脚本时栏本身就是可见的。" },
  { id: "beam", title: "边缘流光", where: "只有「游戏」那一格，悬停或键盘焦点时细光沿边走一圈。" },
  { id: "magnetic", title: "磁吸按钮", where: "首页「进小莓的房间」。指针靠近时轻轻跟上，离开回到原位。" },
  { id: "story", title: "滚动叙事", where: "就是这一页。右侧面板停住，左边读到哪一段，面板换成哪一项。" },
  { id: "tilt", title: "三维倾斜", where: "首页小莓静帧。按指针在画面里的位置做很小的 rotateX / rotateY。" },
  { id: "scramble", title: "文字解码", where: "仅在本页演示。不放在标题、链接和正文上。" },
  { id: "shimmer", title: "流光扫过", where: "首页房间按钮悬停时，高光掠过一次。下面也可以再放一遍。" },
  { id: "parallax", title: "视差", where: "首页人名背后那层光，滚动时比正文走得慢。人物本身不跟着挪出画外。" },
  { id: "count", title: "数字递增", where: "游戏页的枪械库支数，以及下面这三个目录数字。读的是现在的清单。" },
  { id: "lift", title: "悬停上浮", where: "六栏悬停和键盘焦点时抬起，并带一层阴影。移开回到原处。" },
  { id: "type", title: "打字机", where: "仅在本页演示。标题和链接不逐字出现。" },
  { id: "stagger", title: "错峰", where: "六栏依次进来，间隔 0.05 秒。" },
  { id: "marquee", title: "跑马灯", where: "仅在本页。悬停、焦点和暂停按钮都会停。名字在下面的章节里各出现一次。" },
  { id: "spring", title: "弹性", where: "手机菜单从 95% 的尺度弹到原大。下面这个面板用同一段时长。" },
  { id: "easing", title: "缓动", where: "按钮用 200 毫秒的 ease-out。下面两条轨道对比 linear 和 ease-out，仅在本页演示。" },
] as const;

const SCRAMBLE = "夜雨画廊";

export function MotionStage({
  guns,
  channels,
  games,
}: {
  guns: number;
  channels: number;
  games: number;
}) {
  const [active, setActive] = useState(0);
  const [scrambled, setScrambled] = useState(SCRAMBLE);
  const [typed, setTyped] = useState("");
  const [typing, setTyping] = useState(0);
  const [paused, setPaused] = useState(false);
  const [sprung, setSprung] = useState(false);
  const [easeKey, setEaseKey] = useState(0);
  const [shimmerKey, setShimmerKey] = useState(0);

  useEffect(() => {
    const nodes = [...document.querySelectorAll<HTMLElement>("[data-chapter]")];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const index = Number((visible.target as HTMLElement).dataset.chapter);
        if (Number.isFinite(index)) setActive(index);
      },
      { rootMargin: "-30% 0px -40% 0px", threshold: [0.2, 0.6] }
    );
    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typing === 0) return;
    const line = "字在光后面一个一个落下来。";
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setTyped(line.slice(0, index));
      if (index >= line.length) window.clearInterval(timer);
    }, 90);
    return () => window.clearInterval(timer);
  }, [typing]);

  function playScramble() {
    const alphabet = "夜雨莓冰紫青光影";
    let step = 0;
    const timer = window.setInterval(() => {
      step += 1;
      const next = [...SCRAMBLE]
        .map((char, index) => (index < step / 2 ? char : alphabet[Math.floor(Math.random() * alphabet.length)] ?? char))
        .join("");
      setScrambled(next);
      if (step > SCRAMBLE.length * 2) {
        window.clearInterval(timer);
        setScrambled(SCRAMBLE);
      }
    }, 40);
  }

  return (
    <div className="mt-10 lg:grid lg:grid-cols-12 lg:gap-10">
      <div className="lg:col-span-7">
        {CHAPTERS.map((chapter, index) => (
          <section key={chapter.id} id={chapter.id} data-chapter={index} className="scroll-mt-24 border-t border-lab-hairline py-10">
            <p className="font-mono text-xs text-lab-ink-subtle">{String(index + 1).padStart(2, "0")}</p>
            <h2 className="mt-2 text-xl font-medium tracking-tight text-lab-ink">{chapter.title}</h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-lab-ink-muted">{chapter.where}</p>
            {chapter.id === "scramble" ? (
              <div className="mt-4">
                <p aria-hidden className="font-mono text-lg text-lab-ink">{scrambled}</p>
                <p className="sr-only">{SCRAMBLE}</p>
                <button type="button" className="mt-3 inline-flex min-h-11 items-center text-sm text-lab-primary outline-none focus-visible:ring-2 focus-visible:ring-lab-primary" onClick={playScramble}>
                  播放解码
                </button>
              </div>
            ) : null}
            {chapter.id === "shimmer" ? (
              <button
                key={shimmerKey}
                type="button"
                className="btn-shimmer mt-4 inline-flex min-h-11 items-center rounded-full border border-lab-hairline px-4 text-sm text-lab-ink outline-none focus-visible:ring-2 focus-visible:ring-lab-primary"
                onClick={() => setShimmerKey((value) => value + 1)}
              >
                再扫一次
              </button>
            ) : null}
            {chapter.id === "count" ? (
              <p className="mt-4 font-mono text-sm text-lab-ink">
                栏目 <CountUp value={channels} /> · 游戏 <CountUp value={games} /> · 枪械库 <CountUp value={guns} />
              </p>
            ) : null}
            {chapter.id === "type" ? (
              <div className="mt-4">
                <p aria-hidden className="min-h-7 font-mono text-lg text-lab-ink">
                  {typed}
                  <span className="type-caret" />
                </p>
                <p className="sr-only">字在光后面一个一个落下来。</p>
                <button type="button" className="mt-3 inline-flex min-h-11 items-center text-sm text-lab-primary outline-none focus-visible:ring-2 focus-visible:ring-lab-primary" onClick={() => { setTyped(""); setTyping((value) => value + 1); }}>
                  播放打字
                </button>
              </div>
            ) : null}
            {chapter.id === "marquee" ? (
              <div className="mt-4">
                <div className="marquee overflow-hidden rounded-xl border border-lab-hairline py-3" data-paused={paused ? "true" : "false"}>
                  <div className="marquee-track gap-8 px-4 text-sm text-lab-ink-subtle">
                    <span aria-hidden>{CHAPTERS.map((item) => item.title).join("  ·  ")} · </span>
                    <span aria-hidden>{CHAPTERS.map((item) => item.title).join("  ·  ")} · </span>
                  </div>
                </div>
                <button type="button" className="mt-3 inline-flex min-h-11 items-center text-sm text-lab-primary outline-none focus-visible:ring-2 focus-visible:ring-lab-primary" onClick={() => setPaused((value) => !value)}>
                  {paused ? "继续滚动" : "暂停"}
                </button>
              </div>
            ) : null}
            {chapter.id === "spring" ? (
              <button
                key={sprung ? "sprung" : "rest"}
                type="button"
                className="nav-drawer mt-4 inline-flex min-h-11 items-center rounded-2xl border border-lab-hairline bg-lab-canvas px-4 text-sm text-lab-ink outline-none focus-visible:ring-2 focus-visible:ring-lab-primary"
                onClick={() => setSprung((value) => !value)}
              >
                {sprung ? "已经弹到原大" : "再弹一次"}
              </button>
            ) : null}
            {chapter.id === "easing" ? (
              <div key={easeKey} className="ease-track is-playing mt-4 space-y-3">
                <span className="ease-linear" />
                <span className="ease-out" />
                <button type="button" className="inline-flex min-h-11 items-center text-sm text-lab-primary outline-none focus-visible:ring-2 focus-visible:ring-lab-primary" onClick={() => setEaseKey((value) => value + 1)}>
                  再比一次
                </button>
              </div>
            ) : null}
          </section>
        ))}
      </div>
      <aside className="mt-8 lg:sticky lg:top-20 lg:col-span-5 lg:mt-0 lg:self-start">
        <div className="rounded-2xl border border-lab-hairline p-5">
          <p className="text-[11px] tracking-[0.18em] text-lab-primary">正在读</p>
          <p className="mt-2 text-xl font-medium tracking-tight text-lab-ink">{CHAPTERS[active]?.title}</p>
          <p className="mt-3 text-sm leading-relaxed text-lab-ink-muted">{CHAPTERS[active]?.where}</p>
        </div>
      </aside>
    </div>
  );
}
