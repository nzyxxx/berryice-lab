/**
 * 生成 /stickers 的示意表情：public/stickers/demo/*.gif。
 * 全部程序化绘制（透明底的小团子），不含任何外部素材。
 *
 *   node --experimental-strip-types scripts/make-sticker-demos.mts
 *
 * 跑完把打印出的字节数抄回 data/stickers.ts。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { encodeGif, type GifFrame } from "../lib/stickers/gif-encode";

const EDGE = 240;
type RGB = [number, number, number];

const INK: RGB = [8, 9, 13];
const WHITE: RGB = [244, 246, 251];
const CYAN: RGB = [56, 189, 248];
const VIOLET: RGB = [167, 139, 250];
const RAIN: RGB = [184, 212, 232];

function shade([r, g, b]: RGB, k: number): RGB {
  return [Math.round(r * k), Math.round(g * k), Math.round(b * k)];
}

class Canvas {
  px = new Uint8Array(EDGE * EDGE * 4);

  dot(x: number, y: number, c: RGB) {
    const xi = Math.round(x);
    const yi = Math.round(y);
    if (xi < 0 || yi < 0 || xi >= EDGE || yi >= EDGE) return;
    const i = (yi * EDGE + xi) * 4;
    this.px[i] = c[0];
    this.px[i + 1] = c[1];
    this.px[i + 2] = c[2];
    this.px[i + 3] = 255;
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, c: RGB) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.dot(x, y, c);
      }
    }
  }

  rect(x: number, y: number, w: number, h: number, c: RGB) {
    for (let yy = Math.round(y); yy < Math.round(y + h); yy += 1) {
      for (let xx = Math.round(x); xx < Math.round(x + w); xx += 1) this.dot(xx, yy, c);
    }
  }

  glyph(rows: string[], x: number, y: number, scale: number, c: RGB) {
    rows.forEach((row, ry) => {
      [...row].forEach((cell, rx) => {
        if (cell === "#") this.rect(x + rx * scale, y + ry * scale, scale, scale, c);
      });
    });
  }
}

const QUESTION = [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."];

interface Pose {
  dx?: number;
  dy?: number;
  squash?: number;
  eyeAngle?: number;
  eyeScale?: number;
  tilt?: number;
}

/** 团子：深色描边 + 身体 + 眼睛 + 腮红。 */
function blob(cv: Canvas, body: RGB, cheek: RGB, pose: Pose) {
  const squash = pose.squash ?? 1;
  const cx = 120 + (pose.dx ?? 0);
  const rx = 78 / Math.sqrt(squash);
  const ry = 70 * squash;
  const cy = 200 - ry + (pose.dy ?? 0);
  cv.ellipse(cx, cy, rx + 4, ry + 4, shade(body, 0.35));
  cv.ellipse(cx, cy, rx, ry, body);
  cv.ellipse(cx - rx * 0.28, cy - ry * 0.45, rx * 0.22, ry * 0.12, shade(body, 1.18).map((v) => Math.min(255, v)) as RGB);

  const tilt = pose.tilt ?? 0;
  const eyeScale = pose.eyeScale ?? 1;
  const angle = pose.eyeAngle ?? 0;
  const ox = Math.cos(angle) * 6;
  const oy = Math.sin(angle) * 6;
  for (const side of [-1, 1]) {
    const ex = cx + side * rx * 0.36 + ox;
    const ey = cy - ry * 0.05 + side * tilt + oy;
    cv.ellipse(ex, ey, 9 * eyeScale, 13 * eyeScale, INK);
    cv.ellipse(ex - 3 * eyeScale, ey - 5 * eyeScale, 3 * eyeScale, 3.5 * eyeScale, WHITE);
    cv.ellipse(cx + side * rx * 0.62, cy + ry * 0.22, 11, 6, cheek);
  }
  cv.ellipse(cx + ox * 0.5, cy + ry * 0.3 + oy * 0.5, 6, 4, INK);
}

function rain(cv: Canvas, frame: number, total: number) {
  for (let lane = 0; lane < 9; lane += 1) {
    const x = 14 + lane * 27;
    const y = ((lane * 53 + (frame / total) * EDGE) % EDGE) - 10;
    cv.rect(x, y, 2, 14, RAIN);
  }
}

type Draw = (cv: Canvas, t: number, frame: number, total: number) => void;

const demos: { file: string; frames: number; delayCs: number; draw: Draw }[] = [
  {
    file: "leiden-hop.gif",
    frames: 12,
    delayCs: 7,
    draw: (cv, t) => {
      const hop = Math.abs(Math.sin(t * Math.PI));
      blob(cv, VIOLET, CYAN, { dy: -hop * 46, squash: hop < 0.15 ? 0.82 : 1 + hop * 0.06 });
    },
  },
  {
    file: "homelander-what.gif",
    frames: 10,
    delayCs: 6,
    draw: (cv, t, frame) => {
      blob(cv, CYAN, VIOLET, { dx: Math.sin(t * Math.PI * 4) * 6, eyeScale: 1.45 });
      const marks = [
        [18, 22],
        [92, 6],
        [176, 22],
      ];
      marks.forEach(([x, y], i) => {
        if ((frame + i * 3) % 10 < 7) cv.glyph(QUESTION, x, y, 7, WHITE);
      });
    },
  },
  {
    file: "this-one-is-mine.gif",
    frames: 8,
    delayCs: 6,
    draw: (cv, t) => {
      blob(cv, CYAN, WHITE, { tilt: Math.sin(t * Math.PI * 2) * 6, dx: Math.sin(t * Math.PI * 2) * 10 });
      cv.ellipse(196, 70, 10, 16, RAIN);
      cv.ellipse(196, 58, 5, 8, RAIN);
    },
  },
  {
    file: "xiaomei-nod.gif",
    frames: 10,
    delayCs: 8,
    draw: (cv, t) => {
      const nod = Math.max(0, Math.sin(t * Math.PI * 2));
      blob(cv, WHITE, VIOLET, { dy: nod * 10, squash: 1 - nod * 0.06, eyeAngle: Math.PI / 2, eyeScale: 0.9 });
    },
  },
  {
    file: "rainy-slack.gif",
    frames: 12,
    delayCs: 8,
    draw: (cv, t, frame, total) => {
      rain(cv, frame, total);
      blob(cv, VIOLET, WHITE, { dx: Math.sin(t * Math.PI * 2) * 14, tilt: Math.sin(t * Math.PI * 2) * 4, eyeScale: 0.8 });
    },
  },
  {
    file: "feed-spin.gif",
    frames: 12,
    delayCs: 6,
    draw: (cv, t) => {
      blob(cv, VIOLET, CYAN, { eyeAngle: t * Math.PI * 2, squash: 1 + Math.sin(t * Math.PI * 4) * 0.04 });
    },
  },
];

const outDir = path.join(process.cwd(), "public/stickers/demo");
mkdirSync(outDir, { recursive: true });

for (const demo of demos) {
  const frames: GifFrame[] = [];
  for (let i = 0; i < demo.frames; i += 1) {
    const cv = new Canvas();
    demo.draw(cv, i / demo.frames, i, demo.frames);
    frames.push({ rgba: cv.px, delayCs: demo.delayCs });
  }
  const bytes = encodeGif(EDGE, EDGE, frames);
  writeFileSync(path.join(outDir, demo.file), bytes);
  console.log(`${demo.file}\t${bytes.length} bytes\t${demo.frames} frames`);
}
