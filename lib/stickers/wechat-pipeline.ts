import { WECHAT_STICKER_EDGE, WECHAT_STICKER_LIMIT_BYTES } from "../../data/stickers";
import { encodeGif, type GifFrame } from "./gif-encode";

/**
 * 浏览器里的「做成微信版」：居中裁方形 → 256 色 GIF → 压进 300KB。
 *
 * - 动图逐帧：靠 WebCodecs 的 `ImageDecoder`（Chromium 系）。没有它的浏览器只取首帧，结果里标 `first-frame`。
 * - MP4：只取首帧做静态表情。视频逐帧转码是 Webby / ffmpeg 的活，不在浏览器里硬做。
 * - 体积超了就按「降帧 → 缩边」的梯子往下试，全程有总时限，超时直接报错，不挂住页面。
 * 全程不上传，素材不离开这台浏览器。
 */

export type SourceKind = "gif" | "webp" | "image" | "video";

export interface SourceProbe {
  kind: SourceKind;
  width: number;
  height: number;
}

export interface WechatSticker {
  blob: Blob;
  bytes: number;
  sourceBytes: number;
  edge: number;
  frames: number;
  mode: "all-frames" | "first-frame";
  withinLimit: boolean;
}

export type PipelineErrorCode = "unsupported" | "too-large" | "decode" | "timeout" | "network" | "cors";

export class PipelineError extends Error {
  readonly code: PipelineErrorCode;
  constructor(code: PipelineErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export const ACCEPTED_SOURCE_TYPES = "image/gif,image/webp,image/png,image/jpeg,video/mp4";
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const MAX_FRAMES = 48;
const FETCH_TIMEOUT_MS = 10_000;
const PROBE_TIMEOUT_MS = 8_000;
const PIPELINE_DEADLINE_MS = 25_000;
const EDGE_LADDER = [WECHAT_STICKER_EDGE, 200, 160, 120];

export function sourceKind(type: string): SourceKind | null {
  if (type === "image/gif") return "gif";
  if (type === "image/webp") return "webp";
  if (type === "image/png" || type === "image/jpeg") return "image";
  if (type === "video/mp4") return "video";
  return null;
}

function requireKind(blob: Blob): SourceKind {
  const kind = sourceKind(blob.type);
  if (!kind) throw new PipelineError("unsupported", "只收 GIF、WebP、PNG、JPG 和 MP4。");
  if (blob.size > MAX_SOURCE_BYTES) throw new PipelineError("too-large", "原文件超过 20MB，先在别处剪短再拖进来。");
  return kind;
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new PipelineError("timeout", message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** 让出主线程一拍，好让「处理中」的状态先画出来。 */
function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function loadVideo(blob: Blob, until: "loadedmetadata" | "loadeddata"): Promise<{ video: HTMLVideoElement; release: () => void }> {
  const url = URL.createObjectURL(blob);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  const release = () => {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  };
  return new Promise((resolve, reject) => {
    video.addEventListener("error", () => {
      release();
      reject(new PipelineError("decode", "这段视频浏览器解不开。"));
    }, { once: true });
    video.addEventListener(until, () => resolve({ video, release }), { once: true });
    video.src = url;
  });
}

export async function probeSource(blob: Blob): Promise<SourceProbe> {
  const kind = requireKind(blob);
  if (kind === "video") {
    const { video, release } = await withTimeout(loadVideo(blob, "loadedmetadata"), PROBE_TIMEOUT_MS, "视频读太久了，换一段短的试试。");
    const probe = { kind, width: video.videoWidth, height: video.videoHeight };
    release();
    return probe;
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await withTimeout(createImageBitmap(blob), PROBE_TIMEOUT_MS, "图片读太久了。");
  } catch (error) {
    if (error instanceof PipelineError) throw error;
    throw new PipelineError("decode", "这张图浏览器解不开，可能文件坏了。");
  }
  const probe = { kind, width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return probe;
}

/** 粘贴链接时用。大多数图床不开 CORS，读不到就明说，不绕代理。 */
export async function fetchSource(rawUrl: string): Promise<File> {
  let url: URL;
  try {
    url = new URL(rawUrl.trim(), window.location.href);
  } catch {
    throw new PipelineError("network", "这不是一个能打开的地址。");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new PipelineError("network", "只支持 http / https 地址。");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(url, { mode: "cors", credentials: "omit", signal: controller.signal });
  } catch {
    clearTimeout(timer);
    if (controller.signal.aborted) throw new PipelineError("timeout", "链接 10 秒没响应。");
    throw new PipelineError("cors", "对方不让别的网站直接读这张图（CORS）。先存到本地，再拖进来。");
  }
  if (!response.ok) {
    clearTimeout(timer);
    throw new PipelineError("network", `链接返回 ${response.status}，图可能已经没了。`);
  }
  const declared = Number(response.headers.get("content-length") ?? 0);
  if (declared > MAX_SOURCE_BYTES) {
    clearTimeout(timer);
    controller.abort();
    throw new PipelineError("too-large", "原文件超过 20MB，先在别处剪短再拖进来。");
  }
  let blob: Blob;
  try {
    blob = await response.blob();
  } catch {
    throw new PipelineError(controller.signal.aborted ? "timeout" : "network", "下载到一半断了。");
  } finally {
    clearTimeout(timer);
  }
  const type = blob.type.split(";")[0].trim();
  const name = decodeURIComponent(url.pathname.split("/").pop() || "sticker") || "sticker";
  const file = new File([blob], name, { type });
  requireKind(file);
  return file;
}

/** 按心里有数的口径估一下：原体积 × 裁掉的面积 × 缩小的面积；非 GIF 的静态图按单帧算。 */
export function estimateWechatBytes(sourceBytes: number, probe: SourceProbe): number {
  const side = Math.max(1, Math.min(probe.width, probe.height));
  if (probe.kind === "gif" || probe.kind === "webp") {
    const crop = (side * side) / Math.max(1, probe.width * probe.height);
    const scale = Math.min(1, (WECHAT_STICKER_EDGE * WECHAT_STICKER_EDGE) / (side * side));
    const reencode = probe.kind === "webp" ? 1.8 : 1;
    return Math.round(sourceBytes * crop * scale * reencode);
  }
  const edge = Math.min(WECHAT_STICKER_EDGE, side);
  return Math.round(edge * edge * 0.6);
}

interface SquareFrame {
  image: ImageData;
  delayCs: number;
}

function squareCanvas(edge: number) {
  const canvas = document.createElement("canvas");
  canvas.width = edge;
  canvas.height = edge;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new PipelineError("decode", "这个浏览器拿不到 canvas。");
  ctx.imageSmoothingQuality = "high";
  return { canvas, ctx };
}

function drawCover(ctx: CanvasRenderingContext2D, source: CanvasImageSource, width: number, height: number, edge: number) {
  const side = Math.min(width, height);
  ctx.clearRect(0, 0, edge, edge);
  ctx.drawImage(source, (width - side) / 2, (height - side) / 2, side, side, 0, 0, edge, edge);
}

async function decodeAllFrames(blob: Blob, edge: number): Promise<SquareFrame[] | null> {
  if (typeof ImageDecoder === "undefined" || !(await ImageDecoder.isTypeSupported(blob.type))) return null;
  const decoder = new ImageDecoder({ data: await blob.arrayBuffer(), type: blob.type });
  const { ctx } = squareCanvas(edge);
  try {
    await decoder.tracks.ready;
    await decoder.completed;
    const count = decoder.tracks.selectedTrack?.frameCount ?? 1;
    const step = Math.ceil(count / MAX_FRAMES);
    const frames: SquareFrame[] = [];
    for (let index = 0; index < count; index += step) {
      const { image } = await decoder.decode({ frameIndex: index });
      const durationUs = image.duration ?? 100_000;
      drawCover(ctx, image, image.displayWidth, image.displayHeight, edge);
      image.close();
      frames.push({ image: ctx.getImageData(0, 0, edge, edge), delayCs: (durationUs / 10_000) * step });
    }
    return frames;
  } finally {
    decoder.close();
  }
}

async function decodeFirstFrame(blob: Blob, kind: SourceKind, edge: number): Promise<SquareFrame[]> {
  const { ctx } = squareCanvas(edge);
  if (kind === "video") {
    const { video, release } = await loadVideo(blob, "loadeddata");
    drawCover(ctx, video, video.videoWidth, video.videoHeight, edge);
    release();
  } else {
    const bitmap = await createImageBitmap(blob);
    drawCover(ctx, bitmap, bitmap.width, bitmap.height, edge);
    bitmap.close();
  }
  return [{ image: ctx.getImageData(0, 0, edge, edge), delayCs: 10 }];
}

function resample(frames: SquareFrame[], fromEdge: number, toEdge: number, step: number): GifFrame[] {
  const picked: GifFrame[] = [];
  for (let i = 0; i < frames.length; i += step) {
    const delayCs = frames.slice(i, i + step).reduce((sum, f) => sum + f.delayCs, 0);
    picked.push({ rgba: frames[i].image.data, delayCs });
  }
  if (toEdge === fromEdge) return picked;

  const src = squareCanvas(fromEdge);
  const dst = squareCanvas(toEdge);
  return picked.map((frame) => {
    src.ctx.putImageData(new ImageData(new Uint8ClampedArray(frame.rgba), fromEdge, fromEdge), 0, 0);
    dst.ctx.clearRect(0, 0, toEdge, toEdge);
    dst.ctx.drawImage(src.canvas, 0, 0, toEdge, toEdge);
    return { rgba: dst.ctx.getImageData(0, 0, toEdge, toEdge).data, delayCs: frame.delayCs };
  });
}

export async function makeWechatSticker(blob: Blob): Promise<WechatSticker> {
  const kind = requireKind(blob);
  const startedAt = performance.now();
  const edge0 = WECHAT_STICKER_EDGE;

  let frames: SquareFrame[];
  let mode: WechatSticker["mode"] = "first-frame";
  try {
    const animated =
      kind === "gif" || kind === "webp"
        ? await withTimeout(decodeAllFrames(blob, edge0), PIPELINE_DEADLINE_MS, "拆帧太久了，换一张短一点的动图。")
        : null;
    if (animated && animated.length > 0) {
      frames = animated;
      mode = "all-frames";
    } else {
      frames = await withTimeout(decodeFirstFrame(blob, kind, edge0), PIPELINE_DEADLINE_MS, "读图太久了。");
    }
  } catch (error) {
    if (error instanceof PipelineError) throw error;
    throw new PipelineError("decode", "这张图浏览器解不开，可能文件坏了。");
  }

  let last: WechatSticker | null = null;
  const steps = frames.length > 1 ? [1, 2] : [1];
  for (const edge of EDGE_LADDER) {
    for (const step of steps) {
      if (performance.now() - startedAt > PIPELINE_DEADLINE_MS) {
        throw new PipelineError("timeout", "压了 25 秒还没压进 300KB，这张交给 Webby 用 ffmpeg 处理。");
      }
      await yieldToBrowser();
      const gifFrames = resample(frames, edge0, edge, step);
      const bytes = encodeGif(edge, edge, gifFrames);
      last = {
        blob: new Blob([bytes], { type: "image/gif" }),
        bytes: bytes.length,
        sourceBytes: blob.size,
        edge,
        frames: gifFrames.length,
        mode,
        withinLimit: bytes.length <= WECHAT_STICKER_LIMIT_BYTES,
      };
      if (last.withinLimit) return last;
    }
  }
  if (!last) throw new PipelineError("decode", "没有可用的帧。");
  return last;
}
