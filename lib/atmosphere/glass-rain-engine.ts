/**
 * 玻璃雨引擎：水珠附着在玻璃表面，偶尔汇聚成流滑落并擦出湿痕。
 *
 * 刻意做成与框架无关的单例：无论页面上有多少玻璃卡片，全站只跑一条 rAF。
 * 每张卡片只是注册一块自己的画布，滚出视口即停止计算。
 */

type Bead = {
  x: number;
  y: number;
  r: number;
  alpha: number;
  /** 微弱呼吸，避免水珠看起来是贴上去的静态贴图 */
  phase: number;
};

type TrailPoint = { x: number; y: number; life: number };

type Slider = {
  x: number;
  y: number;
  r: number;
  vy: number;
  /** 横向漂移，让水流走出弯路而不是直线 */
  drift: number;
  trail: TrailPoint[];
};

type Impact = { x: number; y: number; r: number; life: number };

type Surface = {
  canvas: HTMLCanvasElement;
  host: HTMLElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number;
  intensity: number;
  beads: Bead[];
  sliders: Slider[];
  impacts: Impact[];
  visible: boolean;
  impactAccumulator: number;
  /** 攒够帧预算才更新一次，单位与 dt 相同（1 ≈ 一帧 16.7ms） */
  pending: number;
};

const surfaces = new Set<Surface>();
let frameId = 0;
let lastTime = 0;
let beadSprite: HTMLCanvasElement | null = null;
let intersectionObserver: IntersectionObserver | null = null;
let resizeObserver: ResizeObserver | null = null;

const BEAD_SPRITE_SIZE = 96;

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * 水珠只画一次：左上暗缘 + 中部透亮 + 右下高光，读起来像一颗有厚度的水珠。
 * 逐帧 createRadialGradient 太贵，全站共用这一张贴图缩放绘制。
 */
function getBeadSprite(): HTMLCanvasElement {
  if (beadSprite) return beadSprite;

  const sprite = document.createElement("canvas");
  sprite.width = BEAD_SPRITE_SIZE;
  sprite.height = BEAD_SPRITE_SIZE;
  const ctx = sprite.getContext("2d");
  if (!ctx) return sprite;

  const c = BEAD_SPRITE_SIZE / 2;
  const r = c - 2;

  // 水珠是一枚透镜，把背后的暗色压缩进来 —— 在深色玻璃上它比周围更暗。
  // 画成发亮的圆点就成了灰尘，这是「像水」与「像噪点」的分界。
  const lens = ctx.createRadialGradient(c, c, 0, c, c, r);
  lens.addColorStop(0, "rgba(6, 10, 16, 0.44)");
  lens.addColorStop(0.6, "rgba(8, 12, 19, 0.31)");
  lens.addColorStop(1, "rgba(10, 14, 20, 0)");
  ctx.fillStyle = lens;
  ctx.beginPath();
  ctx.arc(c, c, r, 0, Math.PI * 2);
  ctx.fill();

  // 光从上方来，被水珠折射到下沿。这道亮弧是认出「这是水」的主要线索
  ctx.strokeStyle = "rgba(206, 232, 255, 0.88)";
  ctx.lineWidth = r * 0.16;
  ctx.beginPath();
  ctx.arc(c, c, r * 0.8, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();

  // 上缘一道极淡的冷边，给出体积感
  ctx.strokeStyle = "rgba(148, 178, 212, 0.26)";
  ctx.lineWidth = r * 0.09;
  ctx.beginPath();
  ctx.arc(c, c, r * 0.84, Math.PI * 1.08, Math.PI * 1.92);
  ctx.stroke();

  // 高光克制，一大就又变回白点
  ctx.fillStyle = "rgba(255, 255, 255, 0.68)";
  ctx.beginPath();
  ctx.ellipse(c - r * 0.34, c - r * 0.34, r * 0.15, r * 0.1, -Math.PI / 5, 0, Math.PI * 2);
  ctx.fill();

  beadSprite = sprite;
  return sprite;
}

function drawBead(
  ctx: CanvasRenderingContext2D,
  sprite: HTMLCanvasElement,
  x: number,
  y: number,
  r: number,
  alpha: number
) {
  if (alpha <= 0.002 || r <= 0.2) return;
  ctx.globalAlpha = alpha;
  ctx.drawImage(sprite, x - r, y - r, r * 2, r * 2);
}

/**
 * 半径偏小的居多，偶尔几颗大的 —— 平方分布比均匀分布像真实凝结。
 * 下限不能再低了：半径不足 1px 时精灵里的暗缘和高光会缩到亚像素被抹平，
 * 画上去只剩一层几乎看不见的灰雾。
 */
function randomBeadRadius() {
  const t = Math.random();
  // 下限抬到 1.7：再小的话暗透镜、亮弧、高光全被压进亚像素，
  // 缩放后只剩一团糊白点，也就是「灰尘感」的来源
  return 1.7 + t * t * 4.3;
}

function seedBeads(surface: Surface) {
  const area = surface.width * surface.height;
  // 更少更大：一堆小点是噪点，几颗有结构的水珠才是雨
  const target = Math.round((area / 2400) * surface.intensity);
  surface.beads = [];
  for (let i = 0; i < target; i += 1) {
    surface.beads.push({
      x: Math.random() * surface.width,
      y: Math.random() * surface.height,
      r: randomBeadRadius(),
      alpha: 0.4 + Math.random() * 0.55,
      phase: Math.random() * Math.PI * 2,
    });
  }
}

function measure(surface: Surface) {
  const rect = surface.host.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  if (width === surface.width && height === surface.height) return;

  surface.dpr = Math.min(window.devicePixelRatio || 1, 2);
  surface.width = width;
  surface.height = height;
  surface.canvas.width = Math.floor(width * surface.dpr);
  surface.canvas.height = Math.floor(height * surface.dpr);
  surface.canvas.style.width = `${width}px`;
  surface.canvas.style.height = `${height}px`;
  surface.ctx.setTransform(surface.dpr, 0, 0, surface.dpr, 0, 0);
  seedBeads(surface);
}

/** 一颗水珠积到临界质量就挂不住了，开始下滑 */
function promoteToSlider(surface: Surface) {
  const candidates = surface.beads.filter((bead) => bead.r > 1.9);
  if (candidates.length === 0) return;

  const bead = candidates[Math.floor(Math.random() * candidates.length)];
  surface.beads.splice(surface.beads.indexOf(bead), 1);
  surface.sliders.push({
    x: bead.x,
    y: bead.y,
    r: bead.r + 0.6,
    vy: 0.16 + Math.random() * 0.22,
    drift: (Math.random() - 0.5) * 0.16,
    trail: [],
  });
}

function updateSurface(surface: Surface, dt: number, time: number) {
  const { width, height } = surface;

  // 新雨滴落到玻璃上
  surface.impactAccumulator += dt * 0.14 * surface.intensity;
  while (surface.impactAccumulator >= 1) {
    surface.impactAccumulator -= 1;
    const x = Math.random() * width;
    const y = Math.random() * height;
    surface.impacts.push({ x, y, r: 0.5, life: 1 });
    surface.beads.push({
      x,
      y,
      r: randomBeadRadius(),
      alpha: 0.4 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
    });
  }

  // 封顶必须跟播种用同一个口径带上 intensity，否则撞击不断补水珠，
  // 停留久了所有卡片都会涨到同一个密度，枪码卡调低 intensity 就白设了
  const maxBeads = Math.round(((width * height) / 1800) * surface.intensity);
  if (surface.beads.length > maxBeads) {
    surface.beads.splice(0, surface.beads.length - maxBeads);
  }

  if (surface.sliders.length < 3 && Math.random() < 0.012 * dt * surface.intensity) {
    promoteToSlider(surface);
  }

  for (let i = surface.impacts.length - 1; i >= 0; i -= 1) {
    const impact = surface.impacts[i];
    impact.r += dt * 0.55;
    impact.life -= dt * 0.055;
    if (impact.life <= 0) surface.impacts.splice(i, 1);
  }

  for (let i = surface.sliders.length - 1; i >= 0; i -= 1) {
    const slider = surface.sliders[i];
    slider.vy += dt * 0.014 * (slider.r / 2.4);
    slider.y += slider.vy * dt;
    slider.x += slider.drift * dt;

    slider.trail.push({ x: slider.x, y: slider.y, life: 1 });

    // 沿途吞并小水珠，越滑越大 —— 这是玻璃上水流的关键观感
    for (let b = surface.beads.length - 1; b >= 0; b -= 1) {
      const bead = surface.beads[b];
      const dx = bead.x - slider.x;
      const dy = bead.y - slider.y;
      if (dx * dx + dy * dy < (slider.r + bead.r) * (slider.r + bead.r)) {
        slider.r = Math.min(5.2, slider.r + bead.r * 0.16);
        surface.beads.splice(b, 1);
      }
    }

    for (let t = slider.trail.length - 1; t >= 0; t -= 1) {
      slider.trail[t].life -= dt * 0.02;
      if (slider.trail[t].life <= 0) slider.trail.splice(t, 1);
    }

    if (slider.y - slider.r > height) {
      if (slider.trail.length === 0) surface.sliders.splice(i, 1);
      else slider.y = height + slider.r + 1;
    }
  }

  for (const bead of surface.beads) {
    bead.phase += dt * 0.02;
  }

  void time;
}

/**
 * 湿痕画成一条描边，而不是几十颗排队的水珠 —— 后者既是一串珠子不是一道痕，
 * 单条水流还要几十次 drawImage。
 *
 * 水流朝下滑，所以拖尾里越靠上的点存在得越久、也就越干。这道痕几乎垂直，
 * 一道竖直渐变就替代了逐点的 alpha 衰减。
 */
function drawTrail(ctx: CanvasRenderingContext2D, slider: Slider) {
  const trail = slider.trail;
  if (trail.length < 2) return;

  const tail = trail[0];
  const head = trail[trail.length - 1];

  // 首尾同高时渐变退化成不着色，直接跳过这一帧
  if (Math.abs(head.y - tail.y) < 0.5) return;

  const gradient = ctx.createLinearGradient(0, tail.y, 0, head.y);
  gradient.addColorStop(0, `rgba(198, 226, 250, ${0.2 * tail.life})`);
  gradient.addColorStop(1, `rgba(216, 240, 255, ${0.32 * head.life})`);

  ctx.globalAlpha = 1;
  ctx.strokeStyle = gradient;
  ctx.lineWidth = slider.r * 1.24;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(tail.x, tail.y);
  for (let i = 1; i < trail.length; i += 1) {
    ctx.lineTo(trail[i].x, trail[i].y);
  }
  ctx.stroke();
}

function drawSurface(surface: Surface, time: number) {
  const ctx = surface.ctx;
  const sprite = getBeadSprite();
  ctx.clearRect(0, 0, surface.width, surface.height);

  for (const slider of surface.sliders) {
    drawTrail(ctx, slider);
  }

  for (const bead of surface.beads) {
    const shimmer = 0.88 + Math.sin(time * 0.002 + bead.phase) * 0.12;
    drawBead(ctx, sprite, bead.x, bead.y, bead.r, bead.alpha * shimmer * 0.9);
  }

  for (const slider of surface.sliders) {
    drawBead(ctx, sprite, slider.x, slider.y, slider.r, 0.72);
  }

  for (const impact of surface.impacts) {
    if (impact.life <= 0) continue;
    ctx.globalAlpha = impact.life * 0.28;
    ctx.strokeStyle = "rgba(214, 238, 255, 1)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(impact.x, impact.y, impact.r, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

function tick(now: number) {
  frameId = requestAnimationFrame(tick);
  const dt = Math.min((now - lastTime) / 16.67, 3);
  lastTime = now;

  for (const surface of surfaces) {
    if (!surface.visible) continue;

    surface.pending += dt;

    /**
     * 没有水流在滑的卡片，画面上只有水珠按三秒周期缓慢呼吸，20fps 完全看不出来。
     * 每帧重绘的真正代价不是那十几次 drawImage，而是每帧都要把这块画布的纹理
     * 重新交给合成器——卡片一多，这里就是掉帧的大头。眼睛真正会追的是下滑的
     * 水流，所以只有它在时才给满帧。
     */
    if (surface.pending < (surface.sliders.length > 0 ? 1 : 3)) continue;

    updateSurface(surface, surface.pending, now);
    drawSurface(surface, now);
    surface.pending = 0;
  }
}

function ensureObservers() {
  if (!intersectionObserver) {
    intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          for (const surface of surfaces) {
            if (surface.host === entry.target) surface.visible = entry.isIntersecting;
          }
        }
      },
      { rootMargin: "120px" }
    );
  }

  if (!resizeObserver) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        for (const surface of surfaces) {
          if (surface.host === entry.target) measure(surface);
        }
      }
    });
  }
}

function startLoop() {
  if (frameId) return;
  lastTime = performance.now();
  frameId = requestAnimationFrame(tick);
}

function stopLoop() {
  if (!frameId) return;
  cancelAnimationFrame(frameId);
  frameId = 0;
}

/** 注册一块玻璃表面，返回注销函数 */
export function registerGlassSurface(
  canvas: HTMLCanvasElement,
  host: HTMLElement,
  intensity = 1
): () => void {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return () => {};

  const surface: Surface = {
    canvas,
    host,
    ctx,
    width: 0,
    height: 0,
    dpr: 1,
    intensity,
    beads: [],
    sliders: [],
    impacts: [],
    visible: true,
    impactAccumulator: 0,
    // 初值打散，否则所有卡片会挤在同一帧集中刷新，变成每三帧一次尖峰
    pending: Math.random() * 3,
  };

  ensureObservers();
  surfaces.add(surface);
  measure(surface);
  intersectionObserver?.observe(host);
  resizeObserver?.observe(host);
  startLoop();

  return () => {
    surfaces.delete(surface);
    intersectionObserver?.unobserve(host);
    resizeObserver?.unobserve(host);
    if (surfaces.size === 0) stopLoop();
  };
}
