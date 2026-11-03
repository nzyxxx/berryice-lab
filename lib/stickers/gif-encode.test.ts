import assert from "node:assert/strict";
import { test } from "node:test";
import { encodeGif, type GifFrame } from "./gif-encode.ts";

interface Decoded {
  width: number;
  height: number;
  palette: Uint8Array;
  loops: boolean;
  frames: { indices: Uint8Array; delayCs: number; transparentIndex: number | null }[];
}

/** 只认本编码器写出来的结构：全局色表、无局部色表、非交错。 */
function decodeGif(bytes: Uint8Array): Decoded {
  let p = 0;
  const u8 = () => bytes[p++];
  const u16 = () => {
    const v = bytes[p] | (bytes[p + 1] << 8);
    p += 2;
    return v;
  };
  const header = String.fromCharCode(...bytes.subarray(0, 6));
  assert.equal(header, "GIF89a");
  p = 6;
  const width = u16();
  const height = u16();
  const packed = u8();
  assert.equal(packed & 0x80, 0x80, "应带全局色表");
  const tableSize = 2 << (packed & 7);
  p += 2;
  const palette = bytes.slice(p, p + tableSize * 3);
  p += tableSize * 3;

  const frames: Decoded["frames"] = [];
  let loops = false;
  let delayCs = 0;
  let transparentIndex: number | null = null;

  const readSubBlocks = () => {
    const parts: number[] = [];
    for (let size = u8(); size !== 0; size = u8()) {
      for (let i = 0; i < size; i += 1) parts.push(u8());
    }
    return Uint8Array.from(parts);
  };

  for (;;) {
    const marker = u8();
    if (marker === 0x3b) break;
    if (marker === 0x21) {
      const label = u8();
      if (label === 0xf9) {
        const block = readSubBlocks();
        delayCs = block[1] | (block[2] << 8);
        transparentIndex = block[0] & 1 ? block[3] : null;
      } else {
        const block = readSubBlocks();
        if (label === 0xff && String.fromCharCode(...block.subarray(0, 11)) === "NETSCAPE2.0") loops = true;
      }
      continue;
    }
    assert.equal(marker, 0x2c, "未知块");
    p += 4;
    const w = u16();
    const h = u16();
    assert.equal(u8() & 0x80, 0, "不该有局部色表");
    const minCodeSize = u8();
    const data = readSubBlocks();
    frames.push({ indices: lzwDecode(data, minCodeSize, w * h), delayCs, transparentIndex });
  }
  return { width, height, palette, loops, frames };
}

function lzwDecode(data: Uint8Array, minCodeSize: number, pixelCount: number): Uint8Array {
  const clear = 1 << minCodeSize;
  const eoi = clear + 1;
  let codeSize = minCodeSize + 1;
  let dict: number[][] = [];
  const reset = () => {
    dict = [];
    for (let i = 0; i < clear; i += 1) dict[i] = [i];
    dict[clear] = [];
    dict[eoi] = [];
    codeSize = minCodeSize + 1;
  };
  reset();
  const out: number[] = [];
  let bitPos = 0;
  let prev: number[] | null = null;
  const read = () => {
    let code = 0;
    for (let i = 0; i < codeSize; i += 1) {
      const bit = (data[(bitPos + i) >> 3] >> ((bitPos + i) & 7)) & 1;
      code |= bit << i;
    }
    bitPos += codeSize;
    return code;
  };
  while (bitPos + codeSize <= data.length * 8) {
    const code = read();
    if (code === clear) {
      reset();
      prev = null;
      continue;
    }
    if (code === eoi) break;
    let entry: number[];
    if (code < dict.length) entry = dict[code];
    else if (prev) entry = [...prev, prev[0]];
    else throw new Error("坏的 LZW 码");
    out.push(...entry);
    if (prev) dict.push([...prev, entry[0]]);
    prev = entry;
    if (dict.length === 1 << codeSize && codeSize < 12) codeSize += 1;
  }
  assert.equal(out.length, pixelCount, "解出来的像素数不对");
  return Uint8Array.from(out);
}

function solidFrame(w: number, h: number, rgba: [number, number, number, number], delayCs = 10): GifFrame {
  const px = new Uint8Array(w * h * 4);
  for (let i = 0; i < px.length; i += 4) px.set(rgba, i);
  return { rgba: px, delayCs };
}

function colorAt(decoded: Decoded, frame: number, pixel: number) {
  const index = decoded.frames[frame].indices[pixel];
  return [decoded.palette[index * 3], decoded.palette[index * 3 + 1], decoded.palette[index * 3 + 2]];
}

test("单帧纯色：头、尺寸、尾、像素都对", () => {
  const bytes = encodeGif(4, 3, [solidFrame(4, 3, [56, 189, 248, 255])]);
  assert.equal(bytes[bytes.length - 1], 0x3b);
  const decoded = decodeGif(bytes);
  assert.equal(decoded.width, 4);
  assert.equal(decoded.height, 3);
  assert.equal(decoded.loops, false);
  assert.equal(decoded.frames.length, 1);
  assert.deepEqual(colorAt(decoded, 0, 0), [56, 189, 248]);
  assert.equal(decoded.frames[0].transparentIndex, null);
});

test("多帧：循环扩展、帧时长、每帧颜色", () => {
  const bytes = encodeGif(8, 8, [solidFrame(8, 8, [255, 0, 0, 255], 7), solidFrame(8, 8, [0, 0, 255, 255], 12)]);
  const decoded = decodeGif(bytes);
  assert.equal(decoded.loops, true);
  assert.deepEqual(
    decoded.frames.map((f) => f.delayCs),
    [7, 12]
  );
  assert.deepEqual(colorAt(decoded, 0, 63), [255, 0, 0]);
  assert.deepEqual(colorAt(decoded, 1, 0), [0, 0, 255]);
});

test("透明像素落到透明下标", () => {
  const frame = solidFrame(2, 2, [10, 20, 30, 255]);
  frame.rgba[3] = 0;
  const decoded = decodeGif(encodeGif(2, 2, [frame]));
  const t = decoded.frames[0].transparentIndex;
  assert.equal(t, 255);
  assert.equal(decoded.frames[0].indices[0], 255);
  assert.notEqual(decoded.frames[0].indices[1], 255);
});

test("颜色超过 255 种、码表写满 4096 也能原样解回", () => {
  const w = 240;
  const h = 240;
  const px = new Uint8Array(w * h * 4);
  let seed = 7;
  for (let i = 0; i < px.length; i += 4) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    px[i] = seed & 0xff;
    px[i + 1] = (seed >> 8) & 0xff;
    px[i + 2] = (seed >> 16) & 0xff;
    px[i + 3] = 255;
  }
  const decoded = decodeGif(encodeGif(w, h, [{ rgba: px, delayCs: 5 }]));
  assert.equal(decoded.frames[0].indices.length, w * h);
  for (let p = 0; p < w * h; p += 997) {
    const [r, g, b] = colorAt(decoded, 0, p);
    const dist = Math.abs(r - px[p * 4]) + Math.abs(g - px[p * 4 + 1]) + Math.abs(b - px[p * 4 + 2]);
    assert.ok(dist < 300, `像素 ${p} 偏得离谱`);
  }
});

test("帧尺寸不符直接拒绝", () => {
  assert.throws(() => encodeGif(2, 2, [solidFrame(3, 3, [0, 0, 0, 255])]), RangeError);
  assert.throws(() => encodeGif(2, 2, []), RangeError);
});
