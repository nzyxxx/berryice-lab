#!/usr/bin/env python3
"""把小莓静帧半透明边缘的底色换成旁边的实色。

根因：边缘半透明像素的 RGB 还留着黑底或白底，实心像素才是头发、发卡和衣服。
反预乘算不回这些颜色。所有半透明像素的 RGB 都改成最近的不透明像素，alpha 不动。
不透明的白领、高光和蓝莓白边不改。画布仍是 640×853。
不读、不写 idle / stretch / walk。仓库里没有比这张更大的透明原图，不能补出新像素。

依赖本机的 Pillow，不进线上构建。
"""

from __future__ import annotations

import sys
from collections import deque
from pathlib import Path

from PIL import Image


def clear_edge(source: Image.Image) -> Image.Image:
    image = source.convert("RGBA")
    width, height = image.size
    pixels = image.load()
    nearest: list[tuple[int, int, int] | None] = [None] * (width * height)
    distance = [10**9] * (width * height)
    queue: deque[int] = deque()
    for y in range(height):
        for x in range(width):
            red, green, blue, alpha = pixels[x, y]
            if alpha < 250:
                continue
            index = y * width + x
            nearest[index] = (red, green, blue)
            distance[index] = 0
            queue.append(index)
    while queue:
        index = queue.popleft()
        x, y = index % width, index // width
        color = nearest[index]
        if color is None:
            continue
        step = distance[index] + 1
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            xx, yy = x + dx, y + dy
            if not (0 <= xx < width and 0 <= yy < height):
                continue
            neighbor = yy * width + xx
            if distance[neighbor] <= step:
                continue
            distance[neighbor] = step
            nearest[neighbor] = color
            queue.append(neighbor)

    out = image.copy()
    target = out.load()
    for y in range(height):
        for x in range(width):
            red, green, blue, alpha = pixels[x, y]
            if alpha == 0 or alpha >= 250:
                continue
            color = nearest[y * width + x]
            if color is None:
                continue
            target[x, y] = (color[0], color[1], color[2], alpha)
    return out


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else root / "public/characters/xiaomei/idle-candd-24-still.webp"
    destination = (
        Path(sys.argv[2]) if len(sys.argv) > 2 else root / "public/characters/xiaomei/idle-candd-24-still-matte.webp"
    )
    original = Image.open(source)
    if original.size != (640, 853):
        raise SystemExit(f"unexpected canvas {original.size}")
    cleared = clear_edge(original)
    before = original.convert("RGBA")
    changed_opaque = 0
    src = before.load()
    dst = cleared.load()
    for y in range(before.height):
        for x in range(before.width):
            if src[x, y][3] >= 250 and src[x, y] != dst[x, y]:
                changed_opaque += 1
    if changed_opaque:
        raise SystemExit(f"opaque pixels changed: {changed_opaque}")
    destination.parent.mkdir(parents=True, exist_ok=True)
    cleared.save(destination, format="WEBP", lossless=True, quality=100, method=6)
    print(destination)


if __name__ == "__main__":
    main()
