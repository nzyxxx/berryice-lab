"use client";

import { useEffect, useState } from "react";

/**
 * 卡面粒子。
 *
 * 采样方式改自 Blake Carroll 的 particle-saga（MIT）：
 * 先把字画进一张小画布，留下 alpha > 0 的像素，再从这些像素里随机取点。
 * 这里只画一次，不做 three.js 的常驻粒子循环。
 *
 * Copyright (c) 2014 Blake Carroll
 * https://github.com/blakecarroll/particle-saga
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 */

const cache = new Map<string, string>();

function paint(title: string, kicker: string) {
  const key = `${kicker}\n${title}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const width = 208;
  const height = 256;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return "";

  const family = getComputedStyle(document.body).fontFamily || "sans-serif";
  ctx.fillStyle = "#fff";
  ctx.font = `500 13px ${family}`;
  ctx.fillText(kicker, 16, 36);
  ctx.font = `600 22px ${family}`;
  ctx.fillText(title, 16, height * 0.72);

  const image = ctx.getImageData(0, 0, width, height);
  const valid: number[] = [];
  for (let i = 3; i < image.data.length; i += 4) {
    if (image.data[i]! > 0) valid.push(i - 3);
  }

  ctx.clearRect(0, 0, width, height);
  const count = valid.length === 0 ? 0 : 88;
  for (let n = 0; n < count; n += 1) {
    const offset = valid[(Math.random() * valid.length) | 0] ?? 0;
    const pixel = (offset / 4) | 0;
    const x = pixel % width;
    const y = (pixel / width) | 0;
    ctx.globalAlpha = 0.35 + Math.random() * 0.55;
    ctx.fillStyle = "rgb(214, 224, 255)";
    ctx.beginPath();
    ctx.arc(x, y, 0.7 + Math.random() * 1.15, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const url = canvas.toDataURL("image/png");
  cache.set(key, url);
  return url;
}

export function ParticleVeil({ title, kicker }: { title: string; kicker: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const draw = () => {
      if (!cancelled) setUrl(paint(title, kicker));
    };
    if (document.fonts?.ready) {
      document.fonts.ready.then(draw).catch(draw);
    } else {
      draw();
    }
    return () => {
      cancelled = true;
    };
  }, [title, kicker]);

  if (!url) return null;
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ backgroundImage: `url(${url})`, backgroundSize: "100% 100%" }}
    />
  );
}
