"use client";

import { useEffect, useRef } from "react";

type Density = "normal" | "low";

type Streak = {
  x: number;
  y: number;
  len: number;
  speed: number;
  alpha: number;
  layer: number;
  wobble: number;
  /** 每条雨丝自带一点倾角偏差，整片完全平行会很假 */
  tilt: number;
};

type LayerConfig = {
  share: number;
  speedMin: number;
  speedMax: number;
  lenMin: number;
  lenMax: number;
  alphaMin: number;
  alphaMax: number;
  spriteWidth: number;
  blur: number;
  /** 越近的层受风影响越大，形成景深 */
  windScale: number;
};

/**
 * 景深按真实光学排：越近的雨越虚。
 *
 * 离眼睛最近的雨是离焦的，又被运动模糊拉长，实际读起来是一层几乎看不清的软纱，
 * 不是清晰的亮线。中景那层才是承担「看得出在下雨」的主力。
 * 反过来做（近处最锐最亮）就会变成屏保。
 */
const LAYERS: LayerConfig[] = [
  // 远景：细、慢、淡，密集时提供雨雾般的底纹
  { share: 0.42, speedMin: 3, speedMax: 4.4, lenMin: 20, lenMax: 34, alphaMin: 0.07, alphaMax: 0.14, spriteWidth: 2, blur: 0.6, windScale: 0.5 },
  // 中景：唯一清晰可辨的一层，雨的「形」全靠它
  { share: 0.36, speedMin: 5.4, speedMax: 7.6, lenMin: 44, lenMax: 70, alphaMin: 0.16, alphaMax: 0.28, spriteWidth: 4, blur: 1.1, windScale: 0.78 },
  // 近景：又宽又快又糊，压到很低的透明度，只留一道掠过的湿气
  { share: 0.22, speedMin: 10, speedMax: 15, lenMin: 90, lenMax: 150, alphaMin: 0.08, alphaMax: 0.16, spriteWidth: 9, blur: 3.4, windScale: 1 },
];

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** 头亮尾透的软边雨丝，预渲染一次后靠 drawImage 复用 */
function buildStreakSprite(width: number, blur: number): HTMLCanvasElement {
  const height = 128;
  const pad = Math.ceil(blur * 3);
  const sprite = document.createElement("canvas");
  sprite.width = width + pad * 2;
  sprite.height = height;

  const ctx = sprite.getContext("2d");
  if (!ctx) return sprite;

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "rgba(176, 200, 224, 0)");
  gradient.addColorStop(0.45, "rgba(186, 208, 230, 0.35)");
  gradient.addColorStop(0.86, "rgba(214, 234, 255, 0.85)");
  gradient.addColorStop(1, "rgba(236, 248, 255, 0.98)");

  ctx.filter = `blur(${blur}px)`;
  ctx.fillStyle = gradient;
  ctx.fillRect(pad, 0, width, height);

  return sprite;
}

/** 宙斯之雨：三层景深冷雨，带阵风与雨势起伏。画布只覆盖视口。 */
export function RainField({ density = "normal" }: { density?: Density }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * 雨势走 ref 而不是进依赖数组：进了依赖数组，换一次雨势就要重建整块画布、
   * 重新光栅化精灵、重新播种。这里始终按满量播种，靠绘制时取前 N 条来调雨势。
   */
  const densityRef = useRef<Density>(density);
  useEffect(() => {
    densityRef.current = density;
  }, [density]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    if (prefersReducedMotion()) return;

    let frame = 0;
    let running = true;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let time = 0;
    let lastTime = performance.now();
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const sprites = LAYERS.map((layer) => buildStreakSprite(layer.spriteWidth, layer.blur));
    const streaks: Streak[] = [];

    const totalCount = () => (width < 640 ? 90 : width < 1024 ? 150 : 210);

    const seed = () => {
      streaks.length = 0;
      const total = totalCount();
      for (let layer = 0; layer < LAYERS.length; layer += 1) {
        const cfg = LAYERS[layer];
        const count = Math.round(total * cfg.share);
        for (let i = 0; i < count; i += 1) {
          streaks.push({
            x: Math.random() * (width + 240) - 120,
            y: Math.random() * height,
            len: cfg.lenMin + Math.random() * (cfg.lenMax - cfg.lenMin),
            speed: cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin),
            alpha: cfg.alphaMin + Math.random() * (cfg.alphaMax - cfg.alphaMin),
            layer,
            wobble: Math.random() * Math.PI * 2,
            tilt: (Math.random() - 0.5) * 0.09,
          });
        }
      }

      // 播种是按层依次入列的，不打散的话「取前 N 条」会只取到最远那层
      for (let i = streaks.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [streaks[i], streaks[j]] = [streaks[j], streaks[i]];
      }
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const loop = (now: number) => {
      if (!running) return;
      frame = requestAnimationFrame(loop);

      // 标签页切走时 rAF 本就被节流，这里额外避免补帧造成的瞬移
      const dt = Math.min((now - lastTime) / 16.67, 3);
      lastTime = now;
      time += dt;

      // 阵风与雨势各走一条慢周期，叠加出忽大忽小的层次
      const gust = Math.sin(time * 0.0042) * 0.6 + Math.sin(time * 0.0011) * 0.4;
      const intensity = 0.72 + Math.sin(time * 0.0016) * 0.28;
      const windAngle = gust * 0.26;

      ctx.clearRect(0, 0, width, height);

      const layerAngle = LAYERS.map((cfg) => windAngle * cfg.windScale);
      const layerTan = LAYERS.map((_, i) => Math.tan(layerAngle[i]));

      /**
       * 雨只在被照亮的地方现形。
       *
       * 光源对齐顶部那团青色光晕（页面背景里 50% -10% 的那个椭圆）。
       * 不做这一步的话，全屏均匀亮度的雨丝读起来就是屏保：真实夜雨是暗的，
       * 你只在路灯、窗光扫到的那片区域看得见它。
       */
      const lightX = width * 0.5;
      const lightY = -height * 0.1;
      const lightReach = Math.hypot(width * 0.62, height * 0.82);

      const active =
        densityRef.current === "low" ? Math.round(streaks.length * 0.5) : streaks.length;

      for (let i = 0; i < active; i += 1) {
        const streak = streaks[i];
        const cfg = LAYERS[streak.layer];
        const sprite = sprites[streak.layer];

        const lx = (streak.x - lightX) / lightReach;
        const ly = (streak.y - lightY) / lightReach;
        const lit = 1 - Math.min(1, Math.sqrt(lx * lx + ly * ly));
        // 留一点底噪，暗角完全不下雨同样出戏
        const alpha = streak.alpha * intensity * (0.22 + lit * lit * 1.05);

        if (alpha > 0.004) {
          const angle = layerAngle[streak.layer] + streak.tilt;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          ctx.globalAlpha = alpha;
          // scale(dpr) · translate(x,y) · rotate(θ) 一次写入，省掉 save/restore
          ctx.setTransform(
            dpr * cos,
            dpr * sin,
            -dpr * sin,
            dpr * cos,
            dpr * streak.x,
            dpr * streak.y
          );
          ctx.drawImage(sprite, -sprite.width / 2, -streak.len, sprite.width, streak.len);
        }

        const fall = streak.speed * cfg.windScale * dt * 1.15;
        streak.y += fall;
        streak.x += layerTan[streak.layer] * fall + Math.sin(time * 0.01 + streak.wobble) * 0.12;

        if (streak.y - streak.len > height) {
          streak.y = -Math.random() * 120;
          streak.x = Math.random() * (width + 240) - 120;
        }
        if (streak.x < -140) streak.x = width + 120;
        else if (streak.x > width + 140) streak.x = -120;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
    };

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 160);
    };

    const onVisibility = () => {
      if (document.hidden) return;
      lastTime = performance.now();
    };

    resize();
    frame = requestAnimationFrame(loop);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-lab-canvas" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(56,189,248,0.12),transparent_55%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(8,9,13,0.35))] dark:bg-[linear-gradient(to_bottom,transparent,rgba(8,9,13,0.55))]" />
      <canvas ref={canvasRef} className="absolute left-0 top-0" />
    </div>
  );
}
