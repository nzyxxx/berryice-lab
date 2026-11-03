/**
 * 最小的 GIF89a 编码器：全局 256 色调色板 + LZW，支持多帧和透明。
 *
 * 不引第三方库：gif.js 之类要带 Web Worker 和几十 KB 的包，
 * 这里只需要把 240px 见方、几十帧以内的表情压出来。
 * 纯函数，不碰 DOM，Node 测试和浏览器共用。
 */

export interface GifFrame {
  /** RGBA，长度 = width * height * 4 */
  rgba: Uint8Array | Uint8ClampedArray;
  /** 帧时长，单位 1/100 秒 */
  delayCs: number;
}

const TRANSPARENT_INDEX = 255;
const OPAQUE_COLORS = 255;
const ALPHA_CUTOFF = 128;

function key15(r: number, g: number, b: number): number {
  return ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
}

interface Palette {
  /** 256 * 3，未用到的槽位是黑色 */
  table: Uint8Array;
  /** 15 位颜色键 → 调色板下标 */
  lookup: Int16Array;
  hasTransparency: boolean;
}

/**
 * 按 5-5-5 分桶统计出现次数，取最常见的 255 桶，桶内取均值当调色板颜色。
 * 第 256 格留给透明。对表情这种大色块、少渐变的图，比固定 3-3-2 调色板干净得多。
 */
function buildPalette(frames: GifFrame[]): Palette {
  const counts = new Uint32Array(32768);
  const sumR = new Float64Array(32768);
  const sumG = new Float64Array(32768);
  const sumB = new Float64Array(32768);
  let hasTransparency = false;

  for (const frame of frames) {
    const px = frame.rgba;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] < ALPHA_CUTOFF) {
        hasTransparency = true;
        continue;
      }
      const k = key15(px[i], px[i + 1], px[i + 2]);
      counts[k] += 1;
      sumR[k] += px[i];
      sumG[k] += px[i + 1];
      sumB[k] += px[i + 2];
    }
  }

  const used: number[] = [];
  for (let k = 0; k < 32768; k += 1) if (counts[k] > 0) used.push(k);
  used.sort((a, b) => counts[b] - counts[a]);
  const picked = used.slice(0, OPAQUE_COLORS);

  const table = new Uint8Array(256 * 3);
  picked.forEach((k, index) => {
    table[index * 3] = Math.round(sumR[k] / counts[k]);
    table[index * 3 + 1] = Math.round(sumG[k] / counts[k]);
    table[index * 3 + 2] = Math.round(sumB[k] / counts[k]);
  });

  const lookup = new Int16Array(32768).fill(-1);
  picked.forEach((k, index) => {
    lookup[k] = index;
  });

  // 没进前 255 的颜色，就近映射。每个 15 位键只算一次。
  for (const k of used.slice(OPAQUE_COLORS)) {
    const r = sumR[k] / counts[k];
    const g = sumG[k] / counts[k];
    const b = sumB[k] / counts[k];
    let best = 0;
    let bestDist = Infinity;
    for (let index = 0; index < picked.length; index += 1) {
      const dr = table[index * 3] - r;
      const dg = table[index * 3 + 1] - g;
      const db = table[index * 3 + 2] - b;
      const dist = dr * dr + dg * dg + db * db;
      if (dist < bestDist) {
        bestDist = dist;
        best = index;
      }
    }
    lookup[k] = best;
  }

  return { table, lookup, hasTransparency };
}

function indexFrame(frame: GifFrame, palette: Palette): Uint8Array {
  const px = frame.rgba;
  const out = new Uint8Array(px.length / 4);
  for (let i = 0, p = 0; i < px.length; i += 4, p += 1) {
    out[p] = px[i + 3] < ALPHA_CUTOFF ? TRANSPARENT_INDEX : palette.lookup[key15(px[i], px[i + 1], px[i + 2])];
  }
  return out;
}

class ByteWriter {
  private chunks: Uint8Array[] = [];
  private buf = new Uint8Array(4096);
  private len = 0;

  byte(value: number) {
    if (this.len === this.buf.length) this.flushChunk();
    this.buf[this.len++] = value & 0xff;
  }

  u16(value: number) {
    this.byte(value);
    this.byte(value >> 8);
  }

  bytes(values: ArrayLike<number>) {
    for (let i = 0; i < values.length; i += 1) this.byte(values[i]);
  }

  ascii(text: string) {
    for (let i = 0; i < text.length; i += 1) this.byte(text.charCodeAt(i));
  }

  private flushChunk() {
    this.chunks.push(this.buf.slice(0, this.len));
    this.buf = new Uint8Array(4096);
    this.len = 0;
  }

  result(): Uint8Array<ArrayBuffer> {
    this.flushChunk();
    const total = this.chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const chunk of this.chunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  }
}

/** GIF 的 LZW：可变码长（最长 12 位），码表满了发 clear 重来，输出按 255 字节切块。 */
function writeLzw(out: ByteWriter, indices: Uint8Array, minCodeSize: number) {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let nextCode = eoiCode + 1;
  const table = new Map<number, number>();

  const block = new Uint8Array(255);
  let blockLen = 0;
  let bitBuf = 0;
  let bitCount = 0;

  const pushByte = (value: number) => {
    block[blockLen++] = value;
    if (blockLen === 255) {
      out.byte(255);
      out.bytes(block);
      blockLen = 0;
    }
  };

  const emit = (code: number) => {
    bitBuf |= code << bitCount;
    bitCount += codeSize;
    while (bitCount >= 8) {
      pushByte(bitBuf & 0xff);
      bitBuf >>>= 8;
      bitCount -= 8;
    }
  };

  out.byte(minCodeSize);
  emit(clearCode);

  let prefix = indices[0];
  for (let i = 1; i < indices.length; i += 1) {
    const k = indices[i];
    const key = (prefix << 8) | k;
    const hit = table.get(key);
    if (hit !== undefined) {
      prefix = hit;
      continue;
    }
    emit(prefix);
    if (nextCode === 4096) {
      emit(clearCode);
      table.clear();
      codeSize = minCodeSize + 1;
      nextCode = eoiCode + 1;
    } else {
      if (nextCode >= 1 << codeSize) codeSize += 1;
      table.set(key, nextCode++);
    }
    prefix = k;
  }
  emit(prefix);
  emit(eoiCode);
  if (bitCount > 0) pushByte(bitBuf & 0xff);
  if (blockLen > 0) {
    out.byte(blockLen);
    out.bytes(block.subarray(0, blockLen));
  }
  out.byte(0);
}

export function encodeGif(width: number, height: number, frames: GifFrame[]): Uint8Array<ArrayBuffer> {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 0xffff || height > 0xffff) {
    throw new RangeError("GIF 尺寸必须是 1–65535 的整数");
  }
  if (frames.length === 0) throw new RangeError("至少要一帧");
  for (const frame of frames) {
    if (frame.rgba.length !== width * height * 4) throw new RangeError("帧像素数和尺寸对不上");
  }

  const palette = buildPalette(frames);
  const out = new ByteWriter();

  out.ascii("GIF89a");
  out.u16(width);
  out.u16(height);
  // 有全局色表 | 色深 8 位 | 色表 256 项
  out.byte(0xf7);
  out.byte(0);
  out.byte(0);
  out.bytes(palette.table);

  if (frames.length > 1) {
    out.bytes([0x21, 0xff, 0x0b]);
    out.ascii("NETSCAPE2.0");
    out.bytes([0x03, 0x01, 0x00, 0x00, 0x00]);
  }

  // 有透明时每帧先清回背景，否则透明区会叠出上一帧的残影。
  const disposal = palette.hasTransparency ? 2 : 1;
  for (const frame of frames) {
    out.bytes([0x21, 0xf9, 0x04]);
    out.byte((disposal << 2) | (palette.hasTransparency ? 1 : 0));
    out.u16(Math.max(2, Math.min(0xffff, Math.round(frame.delayCs))));
    out.byte(palette.hasTransparency ? TRANSPARENT_INDEX : 0);
    out.byte(0);

    out.byte(0x2c);
    out.u16(0);
    out.u16(0);
    out.u16(width);
    out.u16(height);
    out.byte(0);

    writeLzw(out, indexFrame(frame, palette), 8);
  }

  out.byte(0x3b);
  return out.result();
}
