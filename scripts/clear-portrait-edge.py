#!/usr/bin/env python3
"""把小莓静帧边缘上的黑底渗色换回邻近实色。

根因：半透明像素的 RGB 接近纯黑，旁边不透明像素才是银紫头发和衣服。
这不是预乘可以反算回来的颜色，反预乘会把发丝算成随机色。
只改这些被污染的半透明像素的 RGB，alpha 和所有不透明像素不动。
画布仍是 640×853。不读、不写 idle / stretch / walk。

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
            luminance = (red + green + blue) / 3
            solid = (color[0] + color[1] + color[2]) / 3
            neutral = abs(red - green) < 18 and abs(green - blue) < 18
            if luminance + 25 < solid or (neutral and luminance + 8 < solid):
                target[x, y] = (color[0], color[1], color[2], alpha)
    return out


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else root / "public/characters/xiaomei/idle-candd-24-still.webp"
    destination = (
        Path(sys.argv[2]) if len(sys.argv) > 2 else root / "public/characters/xiaomei/idle-candd-24-still-clear.webp"
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
