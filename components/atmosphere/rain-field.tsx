"use client";

import { useEffect, useState } from "react";

type Density = "normal" | "low";

type LayerSpec = {
  /** 贴图边长。同时就是一次循环的位移量 —— 平移整数个周期才接得上 */
  size: number;
  /** 一张贴图里播多少条雨丝 */
  count: number;
  lenMin: number;
  lenMax: number;
  /** 雨丝宽度 */
  width: number;
  blur: number;
  alphaMin: number;
  alphaMax: number;
  /** 倾角（弧度），直接画进贴图 */
  tilt: number;
  /** 落完一个周期的秒数 */
  fall: number;
  /** 阵风起伏的周期 */
  gust: number;
  opacityLow: number;
  opacityHigh: number;
};

/**
 * 暴雨：1px 细丝，15–30px 长，倾角不超过 5°。
 * 远景短、淡、慢；近景更长、更亮、更快。长度差就是这一层里的速度差。
 * 三层 fall 互质，避免整片雨同时回到起点。
 * 倾角单位是弧度，画进贴图；图层本身只做垂直平移。
 */
const LAYERS: LayerSpec[] = [
  {
    size: 192,
    count: 46,
    lenMin: 15,
    lenMax: 20,
    width: 1,
    blur: 0,
    alphaMin: 0.16,
    alphaMax: 0.3,
    tilt: 0.03,
    fall: 0.74,
    gust: 19,
    opacityLow: 0.86,
    opacityHigh: 1,
  },
  {
    size: 220,
    count: 32,
    lenMin: 18,
    lenMax: 25,
    width: 1,
    blur: 0.15,
    alphaMin: 0.32,
    alphaMax: 0.55,
    tilt: 0.055,
    fall: 0.33,
    gust: 13,
    opacityLow: 0.9,
    opacityHigh: 1,
  },
  {
    size: 256,
    count: 22,
    lenMin: 24,
    lenMax: 30,
    width: 1,
    blur: 0.35,
    alphaMin: 0.5,
    alphaMax: 0.82,
    tilt: 0.08,
    fall: 0.17,
    gust: 11,
    opacityLow: 0.92,
    opacityHigh: 1,
  },
];

const SPLASHES = [
  { left: "18%", delay: "0s", duration: "0.9s", width: 18 },
  { left: "42%", delay: "0.3s", duration: "1s", width: 22 },
  { left: "67%", delay: "0.15s", duration: "0.85s", width: 16 },
  { left: "86%", delay: "0.45s", duration: "0.95s", width: 20 },
];

function drawStreak(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  len: number,
  alpha: number,
  spec: LayerSpec
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spec.tilt);

  // 头亮尾透：雨丝是运动模糊的痕迹，尾部是它几毫秒前待过的地方
  const gradient = ctx.createLinearGradient(0, -len, 0, 0);
  gradient.addColorStop(0, "rgba(176, 200, 224, 0)");
  gradient.addColorStop(0.45, `rgba(186, 208, 230, ${alpha * 0.35})`);
  gradient.addColorStop(0.86, `rgba(214, 234, 255, ${alpha * 0.85})`);
  gradient.addColorStop(1, `rgba(236, 248, 255, ${alpha})`);

  ctx.fillStyle = gradient;
  ctx.fillRect(-spec.width / 2, -len, spec.width, len);
  ctx.restore();
}

/**
 * 生成一张四边无缝的雨丝贴图。
 *
 * 先在 3×3 倍大的画布上把同一批雨丝平铺九遍，整体模糊一次，再抠出正中那格。
 * 这样跨越边界的雨丝在对边有对应的另一半，模糊也拿得到边界外的像素，
 * 平铺后接缝处既不断线也不出现一圈突然变清晰的硬边。
 *
 * 模糊放在最后一次性做：`ctx.filter` 是逐绘制操作生效的，
 * 挂着它画上百条雨丝会慢到肉眼可见。
 */
function buildRainTile(spec: LayerSpec): string {
  const size = spec.size;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  const scratch = document.createElement("canvas");
  scratch.width = Math.ceil(size * 3 * dpr);
  scratch.height = Math.ceil(size * 3 * dpr);
  const sctx = scratch.getContext("2d");
  if (!sctx) return "";
  sctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const streaks = Array.from({ length: spec.count }, () => ({
    x: Math.random() * size,
    y: Math.random() * size,
    len: spec.lenMin + Math.random() * (spec.lenMax - spec.lenMin),
    alpha: spec.alphaMin + Math.random() * (spec.alphaMax - spec.alphaMin),
  }));

  for (let ox = 0; ox < 3; ox += 1) {
    for (let oy = 0; oy < 3; oy += 1) {
      for (const streak of streaks) {
        drawStreak(sctx, streak.x + ox * size, streak.y + oy * size, streak.len, streak.alpha, spec);
      }
    }
  }

  const tile = document.createElement("canvas");
  tile.width = Math.ceil(size * dpr);
  tile.height = Math.ceil(size * dpr);
  const tctx = tile.getContext("2d");
  if (!tctx) return "";

  if (spec.blur > 0) tctx.filter = `blur(${spec.blur * dpr}px)`;
  const origin = Math.round(size * dpr);
  const span = Math.round(size * dpr);
  tctx.drawImage(scratch, origin, origin, span, span, 0, 0, tile.width, tile.height);

  return tile.toDataURL("image/png");
}

/** 贴图跟视口无关，一次生成全站复用，换路由不必重算 */
let tileCache: string[] | null = null;

function getRainTiles(): string[] {
  if (!tileCache) tileCache = LAYERS.map(buildRainTile);
  return tileCache;
}

/**
 * 宙斯之雨：三层景深冷雨。
 *
 * 不再逐帧在 canvas 上重画几百条雨丝 —— 那样每帧都要清空一整块全屏画布
 * 并把纹理重新交给合成器，实测桌面空闲就掉到 43 帧。
 * 现在雨丝预渲染成无缝贴图，三层各自只跑一条 transform 动画，
 * 全程在合成线程上，主线程每帧零开销。
 *
 * 倾角是画进贴图的，图层本身垂直下落：要让位移方向也带上倾角，
 * 就得横向也走整数个贴图周期，代价是几千像素的超绘。
 * 这点方向差在 0.1 上下的透明度和 1–3px 的模糊下读不出来，不值得拿显存换。
 */
export function RainField({ density = "normal" }: { density?: Density }) {
  const [tiles, setTiles] = useState<string[] | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(
      "(prefers-reduced-motion: reduce), (max-width: 767px), (pointer: coarse)"
    );

    const sync = () => {
      // 手机和「减少动态效果」都只留静态湿雾：
      // 三层超出视口的合成层在移动端 GPU 上要吃掉可观的显存
      setTiles(media.matches ? null : getRainTiles());
    };
    const onVisibility = () => setPaused(document.hidden);

    sync();
    onVisibility();
    media.addEventListener("change", sync);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      media.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const dim = density === "low" ? 0.5 : 1;

  return (
    <>
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-lab-canvas" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(56,189,248,0.12),transparent_55%)]" />

      {/*
        雨只在被照亮的地方现形。遮罩对齐上方那团青色光晕，
        全屏均匀亮度的雨丝读起来就是屏保：真实夜雨是暗的，
        你只在路灯、窗光扫到的那片区域看得见它。
      */}
      {tiles && (
        <div className={paused ? "rain-paused" : undefined}>
          <div
            className="absolute inset-0 [mask-image:linear-gradient(to_bottom,#000_0%,rgba(0,0,0,0.88)_70%,rgba(0,0,0,0.62)_100%)]"
            style={{ opacity: dim }}
          >
            {LAYERS.map((spec, index) =>
              tiles[index] ? (
                <div
                  key={spec.size}
                  className="absolute inset-x-0 animate-rain-layer"
                  style={
                    {
                      top: -spec.size,
                      bottom: 0,
                      backgroundImage: `url(${tiles[index]})`,
                      backgroundRepeat: "repeat",
                      backgroundSize: `${spec.size}px ${spec.size}px`,
                      "--rain-shift": `${spec.size}px`,
                      "--rain-fall": `${spec.fall}s`,
                      "--rain-gust": `${spec.gust}s`,
                      "--rain-lo": spec.opacityLow,
                      "--rain-hi": spec.opacityHigh,
                    } as React.CSSProperties
                  }
                />
              ) : null
            )}
          </div>
        </div>
      )}

      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(8,9,13,0.35))] dark:bg-[linear-gradient(to_bottom,transparent,rgba(8,9,13,0.55))]" />
    </div>
    {tiles ? (
      <div className={paused ? "rain-paused pointer-events-none fixed inset-x-0 bottom-0 z-30 h-8" : "pointer-events-none fixed inset-x-0 bottom-0 z-30 h-8"} aria-hidden>
        {SPLASHES.map((splash) => (
          <span
            key={splash.left}
            className="rain-splash"
            style={{
              left: splash.left,
              width: splash.width,
              animationDelay: splash.delay,
              animationDuration: splash.duration,
            }}
          />
        ))}
      </div>
    ) : null}
    </>
  );
}
