#!/usr/bin/env python3
"""Cut the 小莓 expression sheet into five transparent WebP sprites.

The sheet is a white-background sticker row. The white outline is the same
color as the backdrop and touches it, so a plain flood fill would eat the
border. This script:

1. Splits the row on the vertical gaps between the five busts.
2. Flood-fills near-white from each strip's edges (exterior only; apron,
   collar, and eye whites stay because the dress seals them).
3. Dilates the remaining silhouette just enough to paint the sticker outline
   back in pure white, and drops the gray JPEG fringe outside that ring.

Poses are named by how the face reads, not by a guessed left-to-right order.
Re-check the contact sheet under /tmp if the source art changes.

Usage:
  python3 scripts/slice-xiaomei.py <expressions-sheet.jpg> [out_dir]
"""

from __future__ import annotations

import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

# Named by the face, checked on the cut contact sheet (not by file order alone):
# wink + open smile, small pout, empty dot-mouth stare,
# side-eye with a flat mouth, closed-eye soft smile.
POSE_NAMES = ("happy", "sad", "blank", "annoyed", "content")

TARGET_WIDTH = 256
MAX_BYTES = 60 * 1024
# White ring outside the colored body, in source pixels. The JPEG fringe
# beyond this (lum ~220) is background and must not survive as a halo.
OUTLINE_PX = 4
RIM_ALPHA = 170


def flood_from_edges(passable: np.ndarray) -> np.ndarray:
    height, width = passable.shape
    seen = np.zeros((height, width), dtype=bool)
    queue: deque[tuple[int, int]] = deque()

    def push(y: int, x: int) -> None:
        if passable[y, x] and not seen[y, x]:
            seen[y, x] = True
            queue.append((y, x))

    for x in range(width):
        push(0, x)
        push(height - 1, x)
    for y in range(height):
        push(y, 0)
        push(y, width - 1)

    while queue:
        y, x = queue.popleft()
        if y > 0:
            push(y - 1, x)
        if y + 1 < height:
            push(y + 1, x)
        if x > 0:
            push(y, x - 1)
        if x + 1 < width:
            push(y, x + 1)
    return seen


def largest_component(mask: np.ndarray) -> np.ndarray:
    height, width = mask.shape
    seen = np.zeros((height, width), dtype=bool)
    best: list[tuple[int, int]] = []
    for y in range(height):
        for x in range(width):
            if not mask[y, x] or seen[y, x]:
                continue
            queue = deque([(y, x)])
            seen[y, x] = True
            cells: list[tuple[int, int]] = []
            while queue:
                cy, cx = queue.popleft()
                cells.append((cy, cx))
                for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                    if (
                        0 <= ny < height
                        and 0 <= nx < width
                        and mask[ny, nx]
                        and not seen[ny, nx]
                    ):
                        seen[ny, nx] = True
                        queue.append((ny, nx))
            if len(cells) > len(best):
                best = cells
    out = np.zeros((height, width), dtype=bool)
    for y, x in best:
        out[y, x] = True
    return out


def dilate(mask: np.ndarray, radius: int) -> np.ndarray:
    image = Image.fromarray(mask.astype(np.uint8) * 255)
    for _ in range(radius):
        image = image.filter(ImageFilter.MaxFilter(3))
    return np.asarray(image) > 0


def column_splits(ink: np.ndarray) -> list[tuple[int, int]]:
    width = ink.shape[1]
    counts = ink.sum(axis=0).astype(np.float64)
    smooth = np.convolve(counts, np.ones(11) / 11, mode="same")
    # The 4th/5th gutter only falls to ~18 ink pixels. A fixed low cutoff
    # fuses them. Valleys are a fraction of the busts' own density.
    active = smooth[smooth > 40]
    if active.size == 0:
        raise SystemExit("expression sheet has no ink")
    gutter_level = max(28.0, float(np.percentile(active, 55)) * 0.2)
    is_gutter = smooth < gutter_level
    runs: list[tuple[int, int]] = []
    start: int | None = None
    for x, gutter in enumerate(is_gutter):
        if not gutter and start is None:
            start = x
        elif gutter and start is not None:
            if x - start > 40:
                runs.append((start, x))
            start = None
    if start is not None and width - start > 40:
        runs.append((start, width))
    if len(runs) != 5:
        raise SystemExit(
            f"expected 5 busts, found {len(runs)} (gutter<{gutter_level:.1f}): {runs}"
        )

    bounds: list[tuple[int, int]] = []
    for index, (run_start, run_end) in enumerate(runs):
        left = 0 if index == 0 else (runs[index - 1][1] + run_start) // 2
        right = width if index == 4 else (run_end + runs[index + 1][0]) // 2
        bounds.append((left, right))
    return bounds


def cut_strip(rgb: np.ndarray) -> np.ndarray:
    lum = rgb.mean(axis=2)
    chroma = rgb.max(axis=2) - rgb.min(axis=2)
    # Near-white and the gray fringe outside the sticker. Interior whites are
    # not reachable from the strip edge, so the apron survives the fill.
    passable = (lum >= 228) & (chroma <= 18)
    exterior = flood_from_edges(passable)
    body = largest_component(~exterior)
    outline = dilate(body, OUTLINE_PX) & ~body
    rim = dilate(body, OUTLINE_PX + 1) & ~dilate(body, OUTLINE_PX)

    height, width = body.shape
    out = np.zeros((height, width, 4), dtype=np.uint8)
    out[..., 0:3][body] = rgb[body]
    out[..., 3][body] = 255
    out[..., 0:3][outline] = 255
    out[..., 3][outline] = 255
    out[..., 0:3][rim] = 255
    out[..., 3][rim] = RIM_ALPHA
    return out


def trim(image: Image.Image) -> Image.Image:
    alpha = np.asarray(image.split()[-1])
    ys, xs = np.where(alpha > 16)
    if len(xs) == 0:
        raise SystemExit("empty sprite")
    return image.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))


def shared_canvas(sprites: list[Image.Image]) -> list[Image.Image]:
    width = max(image.width for image in sprites)
    height = max(image.height for image in sprites)
    framed: list[Image.Image] = []
    for image in sprites:
        canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        # Bottom-align so swapping expressions doesn't hop the apron.
        x = (width - image.width) // 2
        y = height - image.height
        canvas.paste(image, (x, y), image)
        framed.append(canvas)
    scale = TARGET_WIDTH / width
    target = (TARGET_WIDTH, max(1, round(height * scale)))
    return [image.resize(target, Image.Resampling.LANCZOS) for image in framed]


def save_webp(image: Image.Image, path: Path) -> int:
    quality = 82
    while quality >= 40:
        image.save(path, "WEBP", quality=quality, method=6)
        size = path.stat().st_size
        if size <= MAX_BYTES:
            return size
        quality -= 6
    raise SystemExit(f"{path.name} is still over {MAX_BYTES} bytes")


def proof_sheet(sprites: list[Image.Image], path: Path) -> None:
    sample = sprites[0]
    pad = 12
    cell_w = sample.width + pad * 2
    cell_h = sample.height + pad * 2
    sheet = Image.new("RGBA", (cell_w * 5, cell_h * 2), (0, 0, 0, 255))
    backgrounds = ((8, 9, 13, 255), (255, 0, 255, 255))
    for row, background in enumerate(backgrounds):
        for col, sprite in enumerate(sprites):
            tile = Image.new("RGBA", (cell_w, cell_h), background)
            tile.paste(sprite, (pad, pad), sprite)
            sheet.paste(tile, (col * cell_w, row * cell_h))
    sheet.convert("RGB").save(path, "PNG")


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("usage: slice-xiaomei.py <sheet.jpg> [out_dir]")
    source = Path(sys.argv[1])
    out_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("public/xiaomei")
    out_dir.mkdir(parents=True, exist_ok=True)

    rgb = np.asarray(Image.open(source).convert("RGB"))
    lum = rgb.mean(axis=2)
    chroma = rgb.max(axis=2) - rgb.min(axis=2)
    ink = (lum < 210) | (chroma > 28)
    strips = column_splits(ink)

    cut: list[Image.Image] = []
    for index, (left, right) in enumerate(strips):
        rgba = cut_strip(rgb[:, left:right])
        image = trim(Image.fromarray(rgba, "RGBA"))
        # Heads sit at the top of the trim. A 1px collar of transparency means
        # the ahoge was not sliced off by the bbox.
        alpha = np.asarray(image.split()[-1])
        top_coverage = int((alpha[0] > 16).sum())
        print(
            f"{POSE_NAMES[index]} strip={left}:{right} trimmed={image.size} top_px={top_coverage}"
        )
        cut.append(image)

    framed = shared_canvas(cut)
    sizes: list[str] = []
    for name, image in zip(POSE_NAMES, framed, strict=True):
        path = out_dir / f"{name}.webp"
        nbytes = save_webp(image, path)
        sizes.append(f"{name} {image.size[0]}x{image.size[1]} {nbytes}B")
    print("canvas", framed[0].size)
    print("\n".join(sizes))
    proof_sheet(framed, Path("/tmp/xiaomei-proof.png"))

    # Raw heads for a second look, in case the cutout hides a mouth.
    for index, (left, right) in enumerate(strips):
        head = Image.fromarray(rgb[:, left:right]).crop((0, 140, right - left, 340))
        head.save(f"/tmp/xiaomei-head-{index}.jpg", quality=90)


if __name__ == "__main__":
    main()
