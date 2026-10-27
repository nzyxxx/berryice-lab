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
  const dark = index % 2 === 1;
  return (
    <article
      className="absolute left-1/2 top-1/2 overflow-hidden shadow-[0_22px_40px_rgba(40,36,30,0.18)]"
      style={{
        background: tone,
        borderRadius: 18,
        width: "var(--card-w)",
        height: "var(--card-h)",
        marginLeft: "calc(var(--card-w) / -2)",
        marginTop: "calc(var(--card-h) / -2)",
        transform: "rotateY(var(--a)) translateZ(var(--arc))",
        backfaceVisibility: "hidden",
      }}
    >
      <img src={gun.imageUrl} alt="" className="h-[62%] w-full object-contain px-3 pt-3" />
      <p className="truncate px-3 text-[11px] font-medium tracking-wide" style={{ color: dark ? "#f4f1ea" : "#3c3c3c" }}>
        {gun.name}
      </p>
    </article>
  );
}

const GALLERY_POSTERS = [
  { bg: "#14161c", fg: "#f3efe8", wash: "radial-gradient(ellipse at 28% 42%, rgba(92,78,64,0.55), transparent 62%)" },
  { bg: "#f4efe8", fg: "#2c2a28", wash: "radial-gradient(ellipse at 72% 48%, rgba(190,168,148,0.85), transparent 60%)" },
  { bg: "#1c1916", fg: "#f6f1ea", wash: "radial-gradient(ellipse at 50% 80%, rgba(70,48,36,0.7), transparent 58%)" },
  { bg: "#e7e1d8", fg: "#2a2826", wash: "radial-gradient(ellipse at 20% 30%, rgba(255,255,255,0.7), transparent 55%)" },
  { bg: "#101114", fg: "#f4f1ea", wash: "radial-gradient(ellipse at 70% 30%, rgba(48,56,72,0.55), transparent 60%)" },
  { bg: "#efeae3", fg: "#241f1c", wash: "radial-gradient(ellipse at 40% 70%, rgba(176,154,132,0.7), transparent 58%)" },
];

export function ArsenalShow({ guns }: { guns: ArsenalGun[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const ribbonRef = useRef<HTMLDivElement>(null);
  const sweepRef = useRef<HTMLDivElement>(null);
  const grainRef = useRef<HTMLDivElement>(null);
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
    const el = grainRef.current;
    if (!el) return;
    const grain = document.createElement("canvas");
    grain.width = 160;
    grain.height = 160;
    const context = grain.getContext("2d");
    if (!context) return;
    const pixels = context.createImageData(160, 160);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const shade = 140 + Math.random() * 100;
      pixels.data[i] = shade;
      pixels.data[i + 1] = shade;
      pixels.data[i + 2] = shade;
      pixels.data[i + 3] = 36 + Math.random() * 50;
    }
    context.putImageData(pixels, 0, 0);
    el.style.backgroundImage = `url(${grain.toDataURL("image/png")})`;
    el.style.backgroundSize = "160px 160px";
    el.style.mixBlendMode = "overlay";
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const hero = heroRef.current;
    const camera = cameraRef.current;
    const ribbon = ribbonRef.current;
    const dark = darkRef.current;
    const canvas = canvasRef.current;
    if (!root || !hero || !camera || !ribbon || !dark || !canvas) return;
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

      const lenis = new lenisMod.default({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.9 });
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      const scene = new THREE.Scene();
      const view = new THREE.PerspectiveCamera(28, 1, 0.1, 30);
      view.position.set(0, 0, 7.2);
      const geometry = new THREE.PlaneGeometry(1.85, 0.78);
      const loader = new THREE.TextureLoader();
      const gunMeshes = chapters.map((gun, index) => {
        const material = new THREE.MeshBasicMaterial({ transparent: true, opacity: index === 0 ? 1 : 0, depthWrite: false, toneMapped: false });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        const texture = loader.load(gun.imageUrl, () => renderer.render(scene, view));
        texture.colorSpace = THREE.SRGBColorSpace;
        material.map = texture;
        return { mesh, material, texture };
      });

      const fit = () => {
        const width = canvas.clientWidth || 1;
        const height = canvas.clientHeight || 1;
        renderer.setSize(width, height, false);
        view.aspect = width / height;
        view.updateProjectionMatrix();
        renderer.render(scene, view);
      };
      fit();

      const paintHero = (state: { spin: number; tilt: number; dolly: number; lift: number; split: number; textY: number }) => {
        camera.style.transform = `translate3d(0, ${state.lift}px, ${state.dolly}px)`;
        ribbon.style.transform = `rotateX(${state.tilt}deg) rotateY(${state.spin}deg)`;
        if (line1Ref.current) line1Ref.current.style.transform = `translate3d(${state.split}vw, ${state.textY}px, 0)`;
        if (line2Ref.current) line2Ref.current.style.transform = `translate3d(${-state.split * 0.85}vw, ${state.textY * 0.4}px, 0)`;
        if (captionRef.current) captionRef.current.style.opacity = String(Math.max(0, 1 - state.split / 18));
      };

      const wordEls = () => Array.from(dark.querySelectorAll<HTMLElement>("[data-word]"));
      const panelEls = () => Array.from(dark.querySelectorAll<HTMLElement>("[data-panel]"));
      const dotEls = () => Array.from(dark.querySelectorAll<HTMLElement>("[data-dot]"));
      const paintDark = (state: { word: number; rot: number }) => {
        wordEls().forEach((el, index) => {
          const near = Math.max(0, 1 - Math.abs(state.word - index));
          el.style.opacity = String(0.2 + near * 0.72);
        });
        panelEls().forEach((el, index) => {
          const near = Math.max(0, 1 - Math.abs(state.word - index) * 1.35);
          el.style.opacity = String(near);
          el.style.transform = window.innerWidth >= 768 ? `translate3d(${(1 - near) * 28}px, -50%, 0)` : "none";
        });
        dotEls().forEach((el, index) => {
          el.style.opacity = String(0.22 + Math.max(0, 1 - Math.abs(state.word - index)) * 0.78);
        });
        gunMeshes.forEach(({ mesh, material }, index) => {
          const distance = Math.abs(state.word - index);
          material.opacity = distance >= 1 ? 0 : 1 - distance;
          mesh.rotation.y = state.rot;
          mesh.rotation.x = Math.sin(state.rot * 0.5) * 0.08;
        });
        if (sweepRef.current) {
          sweepRef.current.style.transform = `translate3d(calc(-50% + ${state.rot * 42}px), -50%, 0)`;
        }
        renderer.render(scene, view);
      };

      const ctx = gsap.context(() => {
        const mm = gsap.matchMedia();
        mm.add("(min-width: 768px)", () => {
          const state = { spin: -16, tilt: -18, dolly: 0, lift: -120, split: 0, textY: 0 };
          paintHero(state);
          gsap.timeline({
            scrollTrigger: { trigger: hero, start: "top top", end: "+=280%", pin: true, scrub: 0.7, anticipatePin: 1 },
          })
            .to(state, { spin: 34, tilt: -20, dolly: 20, lift: -120, duration: 0.34, ease: "none", onUpdate: () => paintHero(state) })
            .to(state, { spin: 72, tilt: -6, dolly: 460, lift: -20, textY: -28, duration: 0.34, ease: "power1.inOut", onUpdate: () => paintHero(state) })
            .to(state, { spin: 112, tilt: -32, dolly: -70, lift: -150, split: 26, textY: -6, duration: 0.36, ease: "power2.out", onUpdate: () => paintHero(state) });

          const darkState = { word: 0, rot: -0.55 };
          paintDark(darkState);
          gsap.timeline({
            scrollTrigger: { trigger: dark, start: "top top", end: "+=220%", pin: true, scrub: 0.85 },
          }).to(darkState, {
            word: Math.max(0, chapters.length - 1),
            rot: 0.7,
            duration: 1,
            ease: "power1.inOut",
            onUpdate: () => paintDark(darkState),
          });

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
                scrub: 0.8,
                invalidateOnRefresh: true,
              },
            });
          }
        });

        mm.add("(max-width: 767px)", () => {
          const state = { spin: -10, tilt: -16, dolly: 0, lift: 0, split: 0, textY: 0 };
          paintHero(state);
          gsap.timeline({
            scrollTrigger: { trigger: hero, start: "top top", end: "+=170%", pin: true, scrub: 0.65 },
          })
            .to(state, { spin: 48, dolly: 80, tilt: -14, duration: 0.45, ease: "none", onUpdate: () => paintHero(state) })
            .to(state, { spin: 90, dolly: 420, tilt: -6, duration: 0.3, ease: "power2.in", onUpdate: () => paintHero(state) })
            .to(state, { spin: 120, tilt: -28, dolly: -40, lift: -16, split: 8, duration: 0.25, ease: "power2.out", onUpdate: () => paintHero(state) });

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
        geometry.dispose();
        gunMeshes.forEach(({ material, texture }) => {
          material.dispose();
          texture.dispose();
        });
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
          className="absolute inset-x-0 bottom-0 top-[28vh] [--arc:280px] [--card-h:168px] [--card-w:132px] md:[--arc:360px] md:[--card-h:210px] md:[--card-w:164px]"
          style={{ perspective: "920px", perspectiveOrigin: "50% 42%" }}
        >
          <div ref={cameraRef} className="absolute inset-0 [transform-style:preserve-3d]" style={{ transform: "translate3d(0,-120px,0)" }}>
            <div ref={ribbonRef} className="absolute inset-0 [transform-style:preserve-3d]" style={{ transform: "rotateX(-18deg) rotateY(-16deg)" }}>
              {ribbon.map((gun, index) => (
                <div key={`${gun.id}-${index}`} className="absolute inset-0 [transform-style:preserve-3d]" style={{ ["--a" as string]: `${(index / Math.max(ribbon.length, 1)) * spread}deg` }}>
                  <Poster gun={gun} index={index} />
                </div>
              ))}
            </div>
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
        <div className="absolute inset-0 bg-[#07080c]" />
        <div ref={grainRef} className="pointer-events-none absolute inset-0 opacity-70" />
        <div className="arsenal-haze absolute left-[6%] top-[12%] h-[46vh] w-[40vw] rounded-full bg-[#1c1e24]/80" />
        <div className="arsenal-haze absolute bottom-[8%] right-[4%] h-[42vh] w-[38vw] rounded-full bg-[#101218]" />
        <div className="arsenal-haze absolute left-[38%] top-[28%] h-[36vh] w-[28vw] rounded-full bg-[#2a2c32]/40" />
        <p className="absolute left-0 right-0 top-20 z-30 text-center font-mono text-[11px] tracking-[0.32em] text-white/60">枪械册</p>

        <div className="pointer-events-none absolute inset-x-0 top-[18vh] bottom-[12vh] z-[5] flex items-center justify-center">
          <div ref={wordTrackRef} className="flex flex-col items-center">
            {chapters.map((gun, index) => (
              <span
                key={gun.id}
                data-word
                className="flex h-[14vh] items-center text-[clamp(2.5rem,4.8vw,4.2rem)] font-medium leading-none tracking-[-0.045em] text-white"
                style={{ opacity: index === 0 ? 0.92 : 0.22 }}
              >
                {gun.chapter}
              </span>
            ))}
          </div>
        </div>

        <canvas ref={canvasRef} className="absolute inset-0 z-20 h-full w-full" />
        <div
          ref={sweepRef}
          className="pointer-events-none absolute left-1/2 top-1/2 z-[21] h-[22vh] w-[34vw] -translate-x-1/2 -translate-y-1/2 opacity-70"
          style={{
            background: "linear-gradient(105deg, transparent 36%, rgba(255,255,255,0.16) 50%, transparent 64%)",
            mixBlendMode: "screen",
          }}
        />
        <div className="pointer-events-none absolute left-1/2 top-[62%] z-20 h-8 w-40 -translate-x-1/2 rounded-full bg-black/50 blur-2xl" />

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
            className="absolute bottom-16 right-4 z-30 w-[46vw] md:bottom-auto md:right-[7vw] md:top-1/2 md:w-[15rem]"
            style={{ transform: "translate3d(0,-50%,0)", opacity: index === 0 ? 1 : 0 }}
          >
            <h2 className="text-[1.65rem] font-medium leading-tight tracking-tight text-white">{gun.name}</h2>
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-white/65">{gun.meta || gun.typeLabel}</p>
            <ul className="mt-8 space-y-4">
              {gun.stats.slice(0, 4).map((stat) => (
                <li key={stat.label} className="grid grid-cols-[2.6rem_1fr_2rem] items-center gap-3 text-[11px] tracking-wide text-white/75">
                  <span>{stat.label}</span>
                  <span className="h-px bg-white/20">
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
          {featured.map((gun, index) => {
            const poster = GALLERY_POSTERS[index % GALLERY_POSTERS.length];
            const stat = gun.stats[0];
            return (
            <article key={gun.id} className="w-[84vw] max-w-[860px] shrink-0 snap-center">
              <Link href={gun.pageHref} className="relative block overflow-hidden rounded-[28px] shadow-[0_24px_60px_rgba(30,26,20,0.12)]" style={{ background: poster.bg }}>
                <span className="relative flex aspect-[16/10] items-center justify-center" style={{ background: poster.wash }}>
                  <span className="absolute left-6 top-5 font-mono text-[11px] tracking-[0.22em]" style={{ color: poster.fg }}>{gun.typeLabel}</span>
                  {stat ? (
                    <span className="absolute bottom-5 right-6 font-mono text-[11px] tracking-[0.16em]" style={{ color: poster.fg }}>
                      {stat.label} {Math.round(stat.value)}
                    </span>
                  ) : null}
                  <img src={gun.imageUrl} alt="" className="w-[70%] object-contain" />
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
            );
          })}
        </div>
      </section>
    </div>
  );
}
