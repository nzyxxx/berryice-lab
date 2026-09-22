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
 * 景深按真实光学排：越近的雨越虚。
 *
 * 离眼睛最近的雨是离焦的，又被运动模糊拉长，实际读起来是一层几乎看不清的软纱，
 * 不是清晰的亮线。中景那层才是承担「看得出在下雨」的主力。
 * 反过来做（近处最锐最亮）就会变成屏保。
 *
 * 三层的 size / fall / gust 刻意取互质感的数，三层永远不会同步到一起，
 * 不然整片雨会周期性地「一起呼吸」，立刻露出是贴图。
 */
const LAYERS: LayerSpec[] = [
  // 远景：细、慢、淡，提供雨雾般的底纹
  {
    size: 224,
    count: 13,
    lenMin: 20,
    lenMax: 34,
    width: 1.4,
    blur: 0.6,
    alphaMin: 0.07,
    alphaMax: 0.14,
    tilt: 0.1,
    fall: 3.7,
    gust: 23,
    opacityLow: 0.62,
    opacityHigh: 1,
  },
  // 中景：唯一清晰可辨的一层，雨的「形」全靠它
  {
    size: 320,
    count: 11,
    lenMin: 44,
    lenMax: 70,
    width: 2.6,
    blur: 1.1,
    alphaMin: 0.16,
    alphaMax: 0.28,
    tilt: 0.16,
    fall: 1.9,
    gust: 17,
    opacityLow: 0.55,
    opacityHigh: 1,
  },
  // 近景：又宽又快又糊，压到很低的透明度，只留一道掠过的湿气
  {
    size: 448,
    count: 6,
    lenMin: 90,
    lenMax: 150,
    width: 7,
    blur: 3.4,
    alphaMin: 0.08,
    alphaMax: 0.16,
    tilt: 0.21,
    fall: 1.1,
    gust: 13,
    opacityLow: 0.45,
    opacityHigh: 0.95,
  },
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

  const scratch = document.createElement("canvas");
  scratch.width = size * 3;
  scratch.height = size * 3;
  const sctx = scratch.getContext("2d");
  if (!sctx) return "";

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
  tile.width = size;
  tile.height = size;
  const tctx = tile.getContext("2d");
  if (!tctx) return "";

  tctx.filter = `blur(${spec.blur}px)`;
  tctx.drawImage(scratch, -size, -size);

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

  useEffect(() => {
    const media = window.matchMedia(
      "(prefers-reduced-motion: reduce), (max-width: 767px), (pointer: coarse)"
    );

    const sync = () => {
      // 手机和「减少动态效果」都只留静态湿雾：
      // 三层超出视口的合成层在移动端 GPU 上要吃掉可观的显存
      setTiles(media.matches ? null : getRainTiles());
    };

    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const dim = density === "low" ? 0.5 : 1;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-lab-canvas" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(56,189,248,0.12),transparent_55%)]" />

      {/*
        雨只在被照亮的地方现形。遮罩对齐上方那团青色光晕，
        全屏均匀亮度的雨丝读起来就是屏保：真实夜雨是暗的，
        你只在路灯、窗光扫到的那片区域看得见它。
      */}
      {tiles && (
        <div
          className="absolute inset-0 [mask-image:radial-gradient(ellipse_90%_80%_at_50%_-10%,#000_0%,rgba(0,0,0,0.5)_45%,rgba(0,0,0,0.14)_100%)]"
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
      )}

      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(8,9,13,0.35))] dark:bg-[linear-gradient(to_bottom,transparent,rgba(8,9,13,0.55))]" />
    </div>
  );
}
