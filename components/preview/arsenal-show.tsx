"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export interface ArsenalGun {
  id: string;
  name: string;
  typeLabel: string;
  imageUrl: string;
  stats: { label: string; value: number; max: number }[];
  meta: string;
  pageHref: string;
  loadoutHref: string;
  /** 深色段里叠在枪上的大字。没写的枪只进环和横滑。 */
  chapter?: string;
}

const TONES = ["#f3efe8", "#161616", "#eadfd8", "#12151c", "#f7f4ef", "#241c18", "#ece7df", "#10141c", "#f4f1ea", "#1a1a1a"];

function ScrambleLink({ href, text }: { href: string; text: string }) {
  const [value, setValue] = useState(text);
  const timer = useRef(0);

  const stop = () => {
    window.clearTimeout(timer.current);
    setValue(text);
  };

  const play = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const tick = () => {
      frame += 1;
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      setValue(
        text
          .split("")
          .map((char, index) => {
            if (char === " " || frame > index + 4) return char;
            return alphabet[Math.floor(Math.random() * alphabet.length)];
          })
          .join("")
      );
      if (frame < text.length + 6) timer.current = window.setTimeout(tick, 32);
    };
    window.clearTimeout(timer.current);
    tick();
  };

  return (
    <Link
      href={href}
      onMouseEnter={play}
      onMouseLeave={stop}
      onFocus={play}
      onBlur={stop}
      className="mt-10 inline-flex min-h-11 items-center font-mono text-[12px] tracking-[0.28em] text-[#3a3a3a] underline decoration-[#3a3a3a]/30 underline-offset-8"
    >
      {value}
    </Link>
  );
}

function Poster({ gun, index }: { gun: ArsenalGun; index: number }) {
  const tone = TONES[index % TONES.length];
  const dark = tone < "#888";
  return (
    <article
      className="absolute left-1/2 top-1/2 h-[96px] w-[156px] overflow-hidden shadow-[0_18px_40px_rgba(40,36,30,0.16)] md:h-[112px] md:w-[180px]"
      style={{
        background: tone,
        borderRadius: 18,
        marginLeft: "calc(var(--card-w, 210px) / -2)",
        marginTop: "calc(var(--card-h, 132px) / -2)",
        transform: "rotateY(var(--a)) translateZ(var(--arc))",
        backfaceVisibility: "hidden",
      }}
    >
      <img src={gun.imageUrl} alt="" className="h-[72%] w-full object-contain p-3" />
      <p
        className="truncate px-3 text-[11px] font-medium tracking-wide"
        style={{ color: dark ? "#f4f1ea" : "#3c3c3c" }}
      >
        {gun.name}
      </p>
    </article>
  );
}

export function ArsenalShow({ guns }: { guns: ArsenalGun[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const ribbonRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const captionRef = useRef<HTMLSpanElement>(null);
  const darkRef = useRef<HTMLElement>(null);
  const wordTrackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const galleryRef = useRef<HTMLElement>(null);
  const galleryTrackRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cookieOn, setCookieOn] = useState(true);

  const chapters = useMemo(() => guns.filter((gun) => gun.chapter), [guns]);
  const featured = guns.slice(0, 6);

  useEffect(() => {
    const root = rootRef.current;
    const hero = heroRef.current;
    const ribbon = ribbonRef.current;
    const dark = darkRef.current;
    const canvas = canvasRef.current;
    if (!root || !hero || !ribbon || !dark || !canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let dead = false;
    const bag: { kill: () => void } = { kill() {} };

    void (async () => {
      const [lenisMod, gsapMod, stMod, THREE] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("three"),
      ]);
      if (dead) return;

      const gsap = gsapMod.default;
      const { ScrollTrigger } = stMod;
      gsap.registerPlugin(ScrollTrigger);

      const lenis = new lenisMod.default({ lerp: 0.085, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 30);
      camera.position.set(0, 0, 4.4);
      const material = new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 1.75), material);
      scene.add(mesh);
      const loader = new THREE.TextureLoader();
      const textures = chapters.map((gun) => {
        const texture = loader.load(gun.imageUrl, () => renderer.render(scene, camera));
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
      });
      if (textures[0]) material.map = textures[0];

      const fit = () => {
        const width = canvas.clientWidth || 1;
        const height = canvas.clientHeight || 1;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
      };
      fit();

      const paintHero = (state: { spin: number; tilt: number; zoom: number; lift: number; split: number; textY: number }) => {
        ribbon.style.transform = `translate3d(0, ${state.lift}px, ${state.zoom}px) rotateX(${state.tilt}deg) rotateY(${state.spin}deg)`;
        if (line1Ref.current) line1Ref.current.style.transform = `translate3d(${state.split}vw, ${state.textY}px, 0)`;
        if (line2Ref.current) line2Ref.current.style.transform = `translate3d(${-state.split * 0.72}vw, ${state.textY * 0.35}px, 0)`;
        if (captionRef.current) captionRef.current.style.opacity = String(Math.max(0, 1 - state.split / 22));
      };

      const wordEls = () => Array.from(dark.querySelectorAll<HTMLElement>("[data-word]"));
      const panelEls = () => Array.from(dark.querySelectorAll<HTMLElement>("[data-panel]"));
      const dotEls = () => Array.from(dark.querySelectorAll<HTMLElement>("[data-dot]"));
      let textureIndex = 0;

      const paintDark = (state: { word: number; rot: number }) => {
        const count = chapters.length;
        const mid = (count - 1) / 2;
        const track = wordTrackRef.current;
        if (track) track.style.transform = `translate3d(0, ${(mid - state.word) * 15}vh, 0)`;
        wordEls().forEach((el, index) => {
          el.style.opacity = String(Math.max(0.22, 1 - Math.abs(state.word - index) * 0.85));
        });
        panelEls().forEach((el, index) => {
          const near = Math.max(0, 1 - Math.abs(state.word - index) * 1.7);
          el.style.opacity = String(near);
          el.style.transform = `translate3d(${(1 - near) * 42}px, -50%, 0)`;
        });
        dotEls().forEach((el, index) => {
          el.style.opacity = String(index === Math.round(state.word) ? 1 : 0.28);
        });
        const next = Math.max(0, Math.min(count - 1, Math.round(state.word)));
        if (textures[next] && next !== textureIndex) {
          textureIndex = next;
          material.map = textures[next];
          material.needsUpdate = true;
        }
        mesh.rotation.y = state.rot;
        mesh.rotation.x = (state.word - mid) * 0.16;
        mesh.position.y = Math.sin(state.rot) * 0.08;
        renderer.render(scene, camera);
      };

      const ctx = gsap.context(() => {
        const mm = gsap.matchMedia();
        mm.add("(min-width: 768px)", () => {
          const state = { spin: -6, tilt: -6, zoom: 40, lift: -30, split: 0, textY: 0 };
          paintHero(state);
          gsap.timeline({
            scrollTrigger: { trigger: hero, start: "top top", end: "+=260%", pin: true, scrub: 0.85, anticipatePin: 1 },
          })
            .to(state, { spin: 48, tilt: -16, zoom: 40, lift: 0, duration: 0.36, ease: "none", onUpdate: () => paintHero(state) })
            .to(state, { spin: 86, tilt: -6, zoom: 240, lift: -16, textY: -24, duration: 0.28, ease: "power2.in", onUpdate: () => paintHero(state) })
            .to(state, { spin: 124, tilt: -32, zoom: -20, lift: 20, split: 22, textY: -12, duration: 0.36, ease: "power2.out", onUpdate: () => paintHero(state) });

          const darkState = { word: 0, rot: -0.7 };
          paintDark(darkState);
          gsap.timeline({
            scrollTrigger: { trigger: dark, start: "top top", end: "+=220%", pin: true, scrub: 0.9 },
          }).to(darkState, { word: Math.max(0, chapters.length - 1), rot: 0.85, duration: 1, ease: "none", onUpdate: () => paintDark(darkState) });

          const track = galleryTrackRef.current;
          const gallery = galleryRef.current;
          if (track && gallery) {
            gsap.to(track, {
              x: () => -Math.max(0, track.scrollWidth - window.innerWidth + 64),
              ease: "none",
              scrollTrigger: {
                trigger: gallery,
                start: "top top",
                end: () => `+=${Math.max(window.innerHeight, track.scrollWidth - window.innerWidth)}`,
                pin: true,
                scrub: 0.75,
                invalidateOnRefresh: true,
              },
            });
          }
        });

        mm.add("(max-width: 767px)", () => {
          const state = { spin: -12, tilt: 14, zoom: -80, lift: 30, split: 0, textY: 0 };
          paintHero(state);
          gsap.timeline({
            scrollTrigger: { trigger: hero, start: "top top", end: "+=160%", pin: true, scrub: 0.7 },
          })
            .to(state, { spin: 70, zoom: 160, tilt: 6, lift: 0, duration: 0.55, ease: "power1.inOut", onUpdate: () => paintHero(state) })
            .to(state, { spin: 100, tilt: 40, zoom: -80, lift: -20, split: 6, duration: 0.45, ease: "power2.out", onUpdate: () => paintHero(state) });

          const darkState = { word: 0, rot: -0.4 };
          paintDark(darkState);
          gsap.timeline({
            scrollTrigger: { trigger: dark, start: "top top", end: "+=140%", pin: true, scrub: 0.7 },
          }).to(darkState, { word: Math.max(0, chapters.length - 1), rot: 0.55, duration: 1, ease: "none", onUpdate: () => paintDark(darkState) });
        });
      }, root);

      const onResize = () => {
        fit();
        ScrollTrigger.refresh();
      };
      window.addEventListener("resize", onResize);

      bag.kill = () => {
        window.removeEventListener("resize", onResize);
        ctx.revert();
        gsap.ticker.remove(tick);
        lenis.destroy();
        material.dispose();
        mesh.geometry.dispose();
        textures.forEach((texture) => texture.dispose());
        renderer.dispose();
      };
    })();

    return () => {
      dead = true;
      bag.kill();
    };
  }, [chapters]);

  const ribbon = guns.length > 0 ? [...guns, ...guns] : guns;
  const spread = ribbon.length > 1 ? 360 : 0;

  return (
    <div ref={rootRef} className="bg-[#e5e1db] text-[#6b6b6b]">
      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-4 md:px-8">
        <Link href="/" className="text-[12px] font-medium tracking-[0.28em] text-[#4a4a4a]">
          BERRYICE
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/delta-gun"
            className="inline-flex min-h-11 items-center rounded-full bg-[#1c1c1c] px-4 text-[11px] font-medium tracking-[0.16em] text-[#f4f1ea]"
          >
            LET&apos;S TALK
          </Link>
          <button
            type="button"
            className="inline-flex min-h-11 items-center px-3 text-[11px] tracking-[0.2em] text-[#4a4a4a]"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            MENU
          </button>
        </div>
      </header>

      {menuOpen ? (
        <nav className="fixed right-5 top-16 z-40 w-52 rounded-2xl bg-[#f7f4ef] p-3 shadow-xl md:right-8">
          {[
            ["首页", "/"],
            ["改枪", "/delta-gun"],
            ["文章", "/writing"],
            ["关于", "/about"],
          ].map(([label, href]) => (
            <Link key={href} href={href} className="flex min-h-11 items-center px-3 text-sm text-[#2c2c2c]" onClick={() => setMenuOpen(false)}>
              {label}
            </Link>
          ))}
        </nav>
      ) : null}

      <section ref={heroRef} className="relative h-screen overflow-hidden bg-[#e5e1db]">
        <div className="absolute inset-x-0 top-[16vh] flex justify-center px-6">
          <h1 className="text-center font-sans text-[clamp(4.2rem,11vw,8.4rem)] font-medium uppercase leading-[0.82] tracking-[-0.045em] text-[#5e5e5e]">
            <span ref={line1Ref} className="block will-change-transform">
              ARSENAL
            </span>
            <span ref={captionRef} className="mx-auto mt-4 block max-w-[15rem] text-[11px] font-normal normal-case leading-relaxed tracking-[0.16em] text-[#8a8a8a]">
              三角洲的枪，收成一条会转的环
            </span>
            <span ref={line2Ref} className="mt-3 block will-change-transform">
              IN MOTION
            </span>
          </h1>
        </div>

        <div
          className="absolute inset-x-0 bottom-[6vh] h-[58vh] [--arc:520px] [--card-h:96px] [--card-w:156px] md:[--arc:640px] md:[--card-h:112px] md:[--card-w:180px]"
          style={{ perspective: "1500px" }}
        >
          <div ref={ribbonRef} className="absolute inset-0 [transform-style:preserve-3d]" style={{ transform: "translate3d(0,-30px,40px) rotateX(-6deg) rotateY(-6deg)" }}>
            {ribbon.map((gun, index) => (
              <div key={`${gun.id}-${index}`} className="absolute inset-0 [transform-style:preserve-3d]" style={{ ["--a" as string]: `${(index / Math.max(ribbon.length, 1)) * spread}deg` }}>
                <Poster gun={gun} index={index} />
              </div>
            ))}
          </div>
        </div>

        {cookieOn ? (
          <p className="absolute inset-x-0 bottom-5 z-10 text-center font-mono text-[10px] tracking-[0.18em] text-[#8a8a8a]">
            本地只记住主题偏好。
            <button type="button" className="ml-3 inline-flex min-h-11 items-center underline underline-offset-4" onClick={() => setCookieOn(false)}>
              知道了
            </button>
          </p>
        ) : null}
      </section>

      <section ref={darkRef} className="relative h-screen overflow-hidden text-white">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#101423_0%,#243049_48%,#323d59_100%)]" />
        <div className="arsenal-haze absolute -left-[10%] top-[8%] h-[55vh] w-[55vw] rounded-full bg-[#6e88b8]/35" />
        <div className="arsenal-haze absolute bottom-[-8%] right-[-6%] h-[48vh] w-[46vw] rounded-full bg-[#0c101c]/80" />
        <p className="absolute left-0 right-0 top-20 text-center font-mono text-[11px] tracking-[0.32em] text-white/70">枪械册</p>

        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden">
          <div ref={wordTrackRef} className="flex flex-col items-center">
            {chapters.map((gun) => (
              <span key={gun.id} data-word className="block text-[clamp(4.4rem,13vw,9rem)] font-medium leading-[0.9] tracking-[-0.04em]">
                {gun.chapter}
              </span>
            ))}
          </div>
        </div>

        <canvas ref={canvasRef} className="absolute inset-0 z-20 h-full w-full" />
        <div className="pointer-events-none absolute left-1/2 top-[58%] z-20 h-10 w-56 -translate-x-1/2 rounded-full bg-black/40 blur-2xl" />

        <div className="absolute left-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-5 md:left-10 md:flex">
          {chapters.map((gun, index) => (
            <span key={gun.id} data-dot className="flex gap-1" style={{ opacity: index === 0 ? 1 : 0.28 }}>
              {Array.from({ length: 7 }, (_, dot) => (
                <i key={dot} className="block size-1 rounded-full bg-white" />
              ))}
            </span>
          ))}
        </div>

        {chapters.map((gun, index) => (
          <aside
            key={gun.id}
            data-panel
            className="absolute right-4 top-1/2 z-30 w-[min(18rem,46vw)] md:right-12"
            style={{ transform: "translate3d(0,-50%,0)", opacity: index === 0 ? 1 : 0 }}
          >
            <h2 className="text-2xl font-medium tracking-tight text-white md:text-3xl">{gun.name}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{gun.meta || gun.typeLabel}</p>
            <ul className="mt-5 space-y-2">
              {gun.stats.slice(0, 4).map((stat) => (
                <li key={stat.label} className="grid grid-cols-[3rem_1fr_2rem] items-center gap-2 text-[11px] tracking-wide text-white/80">
                  <span>{stat.label}</span>
                  <span className="h-px bg-white/25">
                    <span className="block h-px bg-white" style={{ width: `${Math.min(100, (stat.value / stat.max) * 100)}%` }} />
                  </span>
                  <span className="text-right tabular-nums">{Math.round(stat.value)}</span>
                </li>
              ))}
            </ul>
            <Link href={gun.loadoutHref} className="mt-4 inline-flex min-h-11 items-center text-[11px] tracking-[0.18em] text-white underline underline-offset-4">
              改枪码
            </Link>
          </aside>
        ))}

        <p className="absolute inset-x-0 bottom-8 z-30 text-center font-mono text-[10px] tracking-[0.18em] text-white/75 md:text-[11px]">
          + DIFFERENT WEAPONS. ONE STANDARD OF CRAFT.
        </p>
      </section>

      <section className="bg-[#e5e1db] px-6 py-28 text-center md:py-36">
        <p className="mx-auto max-w-xl text-[clamp(1.7rem,4vw,3.1rem)] font-medium leading-[1.25] tracking-[-0.03em] text-[#2a2a2a]">
          把步枪、冲锋枪和狙击收成一套能翻的改枪册。
        </p>
        <ScrambleLink href="/delta-gun" text="VIEW ALL LOADOUTS" />
      </section>

      <section ref={galleryRef} className="overflow-hidden bg-[#efeae4] md:h-screen">
        <div
          ref={galleryTrackRef}
          className="flex gap-6 overflow-x-auto px-5 py-16 snap-x snap-mandatory md:h-full md:items-center md:overflow-visible md:px-16 md:py-0"
        >
          {featured.map((gun) => (
            <article key={gun.id} className="w-[84vw] max-w-[860px] shrink-0 snap-center">
              <Link href={gun.pageHref} className="block overflow-hidden rounded-[28px] bg-[#11161f] shadow-[0_24px_60px_rgba(30,26,20,0.12)]">
                <span className="flex aspect-[16/10] items-center justify-center">
                  <img src={gun.imageUrl} alt="" className="max-h-[78%] w-auto object-contain" />
                </span>
              </Link>
              <div className="mt-5 flex items-end justify-between gap-4 px-1">
                <div>
                  <h2 className="text-xl font-medium tracking-tight text-[#2a2a2a] md:text-2xl">{gun.name}</h2>
                  <p className="mt-1 text-sm text-[#7a7a7a]">{gun.typeLabel}</p>
                </div>
                <Link href={gun.pageHref} className="inline-flex min-h-11 items-center font-mono text-[11px] tracking-[0.2em] text-[#3a3a3a]">
                  VIEW
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
