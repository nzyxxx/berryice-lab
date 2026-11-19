"use client";

import { CountUp, DemoBeam, Magnetic, Marquee, Tilt, TypeCaret, spotLeave, spotMove } from "@/components/lab/motion-play";
import Link from "next/link";
import { useEffect, useState } from "react";

const CHAPTERS = [
  {
    id: "spotlight",
    en: "Spotlight",
    title: "聚光灯",
    time: "00:24–00:41",
    body: "视频里，光斑跟着指针在卡片表面移动，离开卡片就灭。这里用径向渐变的圆心写在 --spot-x / --spot-y 上，只在精细指针移动时更新，不另开画布。首页六栏都有这一层。触屏不设坐标，避免手指滚动时乱闪。",
    where: "首页六栏",
    href: "/#channels",
  },
  {
    id: "reveal",
    en: "Scroll Reveal",
    title: "滚动显现",
    time: "00:42–00:56",
    body: "内容进入视口时再亮起来。六栏默认就是可见的，脚本只在交叉观察命中后加上 is-in，播放一次不透明度。没有脚本、或系统要求减少动效时，不加这个类，栏保持原样。不把首屏文字先藏成透明。",
    where: "首页六栏",
    href: "/#channels",
  },
  {
    id: "beam",
    en: "Border Beam",
    title: "边缘流光",
    time: "00:57–01:07",
    body: "细光沿边框走一圈。实现是锥形渐变的角度变量 --beam，从 0° 转到 360°，2.6 秒一圈，只画 1px 的环。首页只放在「游戏」那一格，悬停或键盘焦点时才转，移开就停。触屏不转。",
    where: "首页「游戏」",
    href: "/games",
  },
  {
    id: "magnetic",
    en: "Magnetic Button",
    title: "磁吸按钮",
    time: "01:08–01:24",
    body: "指针靠近按钮约 88px 时，按钮向指针挪一小段；离开这个范围，transform 清空，180ms ease-out 回到原位。它和倾斜不写在同一层，避免两个 transform 互相盖掉。触屏和减少动效直接停在原位。",
    where: "首页「进小莓的房间」",
    href: "/dafeiyu?character=xiaomei",
  },
  {
    id: "story",
    en: "Scrollytelling",
    title: "滚动叙事",
    time: "01:25–01:46",
    body: "一块区域粘在视口里，正文往下走，旁边的状态跟着当前段落换。这一页右侧「正在读」就是这样：交叉观察看哪一节占得更多，就把标题和说明换成那一节。它不靠逐帧循环。减少动效时文字照常换，只是没有额外的位移动画。",
    where: "本页右侧",
    href: "#story",
  },
  {
    id: "tilt",
    en: "3D Tilt",
    title: "三维倾斜",
    time: "01:47–02:01",
    body: "视频画面标了 rotateX / rotateY。指针在静帧矩形里的相对位置，映射成大约 ±7° 的旋转，透视 900px。手指不触发。离开画面时 transform 清空。首页人物用这一层，上浮留给六栏，两边不抢同一个 transform。",
    where: "首页静帧",
    href: "/",
  },
  {
    id: "scramble",
    en: "Text Scramble",
    title: "文字解码",
    time: "02:02–02:18",
    body: "目标句子先被同组汉字打乱，再按定时器逐字还原。间隔 40ms，还原完就清掉定时器。读屏不听中间的乱字，只听到终稿「夜雨画廊」。标题、导航和正文不用它。",
    where: "仅本页示例",
    href: "#scramble",
  },
  {
    id: "shimmer",
    en: "Shimmer",
    title: "流光扫过",
    time: "02:19–02:36",
    body: "一道柔高光从左扫到右，640ms ease-out，只播一次。首页房间按钮在悬停或焦点时扫过。下面的按钮可以再手动扫一次。它走 CSS 动画，不占空闲帧。",
    where: "首页房间按钮",
    href: "/",
  },
  {
    id: "parallax",
    en: "Parallax",
    title: "视差滚动",
    time: "02:37–02:53",
    body: "视频里前景和背景速度不同，1x / 0.3x 只是示意。首页人名背后那层光用滚动时间线慢慢下移 28px，人物本身不跟着移出画外。精细指针且没有要求减少动效时才启用。雨幕仍是原来的气候层，这里不加第二层背景。",
    where: "首页背后的光",
    href: "/",
  },
  {
    id: "count",
    en: "Count Up",
    title: "数字递增",
    time: "02:54–03:16",
    body: "数字进入视口后，用一段 700ms 的 ease-out 从 0 补到真实终值，补完就取消动画帧。读屏直接听到终值，不播报中间数。枪械库的数来自仓库里的枪械目录，栏目和游戏来自现在的公开清单。不写访客数，也不把某一次采样的条数当成线上总数。",
    where: "游戏页与本页",
    href: "/games",
  },
  {
    id: "lift",
    en: "Hover Lift",
    title: "悬停上浮",
    time: "03:17–03:35",
    body: "卡片抬起 0.25rem，并加一层与强调色混在一起的阴影。键盘焦点和悬停同一套。按下时回到原位并略收。减少动效时过渡被压到几乎为零，卡片仍可点。",
    where: "首页六栏",
    href: "/#channels",
  },
  {
    id: "type",
    en: "Typewriter",
    title: "打字机",
    time: "03:36–03:50",
    body: "句子按 90ms 一个字出现，末尾有闪烁光标。播完清掉定时器。读屏听到的是整句，不跟着逐字刷新。人名、栏目标题和文章标题都不用打字机。",
    where: "仅本页示例",
    href: "#type",
  },
  {
    id: "stagger",
    en: "Stagger",
    title: "错峰",
    time: "03:51–04:06",
    body: "视频写明间隔 0.05 秒。六栏的 animation-delay 是 0、50、100、150、200、250 毫秒，只改变不透明度，不改位置，所以播完不会把格子顶线错开。减少动效时这段动画被关掉。",
    where: "首页六栏",
    href: "/#channels",
  },
  {
    id: "marquee",
    en: "Marquee",
    title: "跑马灯",
    time: "04:07–04:22",
    body: "两段相同的名字并排，匀速移到一半就接上，看起来没有断点。悬停、焦点落在灯带上、或按下暂停，都会把当前位移定住，之后的滚动和再移入不再改这个位置。离开屏幕或切到别的标签也停。减少动效时灯带停在起点，动画是 none，不是把时长压到 0.01 毫秒。滚动的那一层不进无障碍树，章节标题才是可访问的正文。",
    where: "仅本页示例",
    href: "#marquee",
  },
  {
    id: "spring",
    en: "Spring",
    title: "弹性",
    time: "04:23–04:44",
    body: "视频里的弹窗从 95% 回到 100%，并略微过冲。手机菜单和下面的按钮用同一段 280ms 曲线，起点是 scale(0.95)。这是一次打开，不是循环。减少动效时时长被全局规则压掉。",
    where: "手机菜单",
    href: "#spring",
  },
  {
    id: "easing",
    en: "Easing",
    title: "缓动",
    time: "04:45–05:22",
    body: "视频把 linear 和 ease-out 放在一起比快慢。站点上的按钮用 200ms ease-out。下面两条轨道各走 900ms，一条匀速，一条先快后慢，只为看清差别。再比一次会重放，不会留在空转。",
    where: "按钮用 ease-out，对比仅本页",
    href: "#easing",
  },
] as const;

const SCRAMBLE = "夜雨画廊";
const TYPE_LINE = "字在光后面一个一个落下来。";

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
  const [springKey, setSpringKey] = useState(0);
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
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setTyped(TYPE_LINE.slice(0, index));
      if (index >= TYPE_LINE.length) window.clearInterval(timer);
    }, 90);
    return () => window.clearInterval(timer);
  }, [typing]);

  function playScramble() {
    const alphabet = "夜雨莓冰紫青光影";
    let step = 0;
    const timer = window.setInterval(() => {
      step += 1;
      setScrambled(
        [...SCRAMBLE]
          .map((char, index) => (index < step / 2 ? char : alphabet[Math.floor(Math.random() * alphabet.length)] ?? char))
          .join("")
      );
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
            <p className="font-mono text-xs text-lab-ink-subtle">
              {String(index + 1).padStart(2, "0")} · {chapter.en} · {chapter.time}
            </p>
            <h2 className="mt-2 text-xl font-medium tracking-tight text-lab-ink">{chapter.title}</h2>
            <p className="mt-3 max-w-xl text-[15px] leading-7 text-lab-ink-muted">{chapter.body}</p>
            <p className="mt-3 text-sm text-lab-ink-subtle">
              用在{" "}
              <Link href={chapter.href} className="text-lab-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-lab-primary">
                {chapter.where}
              </Link>
            </p>
            {chapter.id === "spotlight" ? (
              <div
                data-demo="spotlight"
                data-lit="false"
                onPointerMove={spotMove}
                onPointerLeave={spotLeave}
                onPointerCancel={spotLeave}
                className="spotlight-pad relative mt-4 h-24 overflow-hidden rounded-2xl border border-lab-hairline"
              />
            ) : null}
            {chapter.id === "beam" ? (
              <div data-demo="beam" className="channel-card relative mt-4 h-16 rounded-2xl border border-lab-hairline">
                <DemoBeam />
              </div>
            ) : null}
            {chapter.id === "magnetic" ? (
              <Magnetic className="mt-4">
                <button data-demo="magnetic" type="button" className="inline-flex min-h-11 items-center rounded-full border border-lab-primary/35 px-4 text-sm text-lab-primary outline-none focus-visible:ring-2 focus-visible:ring-lab-primary">
                  靠近再离开
                </button>
              </Magnetic>
            ) : null}
            {chapter.id === "tilt" ? (
              <Tilt className="mt-4 w-40">
                <div data-demo="tilt" className="flex h-24 items-center justify-center rounded-2xl border border-lab-hairline text-sm text-lab-ink">
                  在这块上移动
                </div>
              </Tilt>
            ) : null}
            {chapter.id === "scramble" ? (
              <div className="mt-4" data-demo="scramble">
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
                data-demo="shimmer"
                type="button"
                className="btn-shimmer mt-4 inline-flex min-h-11 items-center rounded-full border border-lab-hairline px-4 text-sm text-lab-ink outline-none focus-visible:ring-2 focus-visible:ring-lab-primary"
                onClick={() => setShimmerKey((value) => value + 1)}
              >
                再扫一次
              </button>
            ) : null}
            {chapter.id === "count" ? (
              <p data-demo="count" className="mt-4 font-mono text-sm text-lab-ink">
                栏目 <CountUp value={channels} /> · 游戏 <CountUp value={games} /> · 枪械库 <CountUp value={guns} />
              </p>
            ) : null}
            {chapter.id === "type" ? (
              <div className="mt-4" data-demo="type" data-final={TYPE_LINE}>
                <p aria-hidden className="min-h-7 font-mono text-lg text-lab-ink">
                  {typed}
                  <TypeCaret />
                </p>
                <p className="sr-only">{TYPE_LINE}</p>
                <button type="button" className="mt-3 inline-flex min-h-11 items-center text-sm text-lab-primary outline-none focus-visible:ring-2 focus-visible:ring-lab-primary" onClick={() => { setTyped(""); setTyping((value) => value + 1); }}>
                  播放打字
                </button>
              </div>
            ) : null}
            {chapter.id === "marquee" ? (
              <div className="mt-4">
                <Marquee paused={paused}>
                  <span aria-hidden>{CHAPTERS.map((item) => item.title).join("  ·  ")} · </span>
                  <span aria-hidden>{CHAPTERS.map((item) => item.title).join("  ·  ")} · </span>
                </Marquee>
                <button type="button" className="mt-3 inline-flex min-h-11 items-center text-sm text-lab-primary outline-none focus-visible:ring-2 focus-visible:ring-lab-primary" onClick={() => setPaused((value) => !value)}>
                  {paused ? "继续滚动" : "暂停"}
                </button>
              </div>
            ) : null}
            {chapter.id === "spring" ? (
              <button
                key={springKey}
                data-demo="spring"
                type="button"
                className="nav-drawer mt-4 inline-flex min-h-11 items-center rounded-2xl border border-lab-hairline bg-lab-canvas px-4 text-sm text-lab-ink outline-none focus-visible:ring-2 focus-visible:ring-lab-primary"
                onClick={() => setSpringKey((value) => value + 1)}
              >
                从 95% 弹回
              </button>
            ) : null}
            {chapter.id === "easing" ? (
              <div key={easeKey} data-demo="ease" className="ease-track is-playing mt-4 space-y-3">
                <span className="ease-linear" />
                <span className="ease-out" />
                <button type="button" className="inline-flex min-h-11 items-center text-sm text-lab-primary outline-none focus-visible:ring-2 focus-visible:ring-lab-primary" onClick={() => setEaseKey((value) => value + 1)}>
                  再比一次
                </button>
              </div>
            ) : null}
            {chapter.id === "reveal" ? <p data-demo="reveal" className="sr-only">六栏默认可见，is-in 只播放一次</p> : null}
            {chapter.id === "parallax" ? <p data-demo="parallax" className="sr-only">首页 .hero-wash 使用滚动时间线</p> : null}
            {chapter.id === "lift" ? <p data-demo="lift" className="sr-only">六栏悬停 translateY</p> : null}
            {chapter.id === "stagger" ? <p data-demo="stagger" className="sr-only">间隔 50 毫秒</p> : null}
            {chapter.id === "story" ? <p data-demo="story" className="sr-only">右侧面板随当前章节更换</p> : null}
          </section>
        ))}
      </div>
      <aside className="mt-8 lg:sticky lg:top-20 lg:col-span-5 lg:mt-0 lg:self-start">
        <div data-demo="story-panel" className="rounded-2xl border border-lab-hairline p-5">
          <p className="text-[11px] tracking-[0.18em] text-lab-primary">正在读</p>
          <p className="mt-2 text-xl font-medium tracking-tight text-lab-ink">{CHAPTERS[active]?.title}</p>
          <p className="mt-3 text-sm leading-relaxed text-lab-ink-muted">{CHAPTERS[active]?.body}</p>
        </div>
      </aside>
    </div>
  );
}
