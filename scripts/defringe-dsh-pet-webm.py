#!/usr/bin/env python3
"""Remove the white matte fringe on dsh-pet VP9-alpha thumbs.

The shipped 640x360 thumbs are tagged ALPHA_MODE=1 (premultiplied), but the
soft ring around the silhouette stores straight RGB left over from a light
matte. On a near-black stage the browser adds that RGB on top of the
background, which reads as a flickering white halo.

For pixels within a few steps of an opaque texel, replace that straight color
with the nearest opaque color (the ink/hair/lace that actually belongs there),
then premultiply so the file matches its alpha mode. Isolated translucent
effects keep their own color and are only premultiplied. Alpha itself is not
eroded, so the edge stays soft.

Decode and encode with libvpx-vp9. -auto-alt-ref 0 is required or the alpha
plane is dropped.

Usage:
  python3 scripts/defringe-dsh-pet-webm.py public/dsh-pet-7340/thumb/main
  python3 scripts/defringe-dsh-pet-webm.py one.webm -o /tmp/one.webm
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

import numpy as np

WIDTH = 640
HEIGHT = 360
FRAME_BYTES = WIDTH * HEIGHT * 4
OPAQUE_AT = 240
RADIUS = 3
# CRF 36 keeps the thumbs near their original size. The halo is gone at this
# setting; the interior shifts by only a few levels versus the previous thumb.
CRF = "36"
CPU_USED = "4"


def defringe_frame(rgba: np.ndarray) -> np.ndarray:
    """rgba is HxWx4 uint8. Returns a new array; does not mutate input."""
    rgb = rgba[..., :3].astype(np.int16)
    alpha = rgba[..., 3].astype(np.int16)
    opaque = alpha >= OPAQUE_AT
    color = np.zeros_like(rgb)
    color[opaque] = rgb[opaque]
    filled = opaque.copy()
    for _ in range(RADIUS):
        padded_color = np.pad(color, ((1, 1), (1, 1), (0, 0)), mode="edge")
        padded_filled = np.pad(filled, 1, mode="constant")
        neighbor_colors = (
            padded_color[1:-1, 0:-2],
            padded_color[1:-1, 2:],
            padded_color[0:-2, 1:-1],
            padded_color[2:, 1:-1],
            padded_color[0:-2, 0:-2],
            padded_color[0:-2, 2:],
            padded_color[2:, 0:-2],
            padded_color[2:, 2:],
        )
        neighbor_filled = (
            padded_filled[1:-1, 0:-2],
            padded_filled[1:-1, 2:],
            padded_filled[0:-2, 1:-1],
            padded_filled[2:, 1:-1],
            padded_filled[0:-2, 0:-2],
            padded_filled[0:-2, 2:],
            padded_filled[2:, 0:-2],
            padded_filled[2:, 2:],
        )
        gained = np.zeros(alpha.shape, dtype=bool)
        straight = np.zeros_like(color)
        for sample, mask in zip(neighbor_colors, neighbor_filled):
            take = (~filled) & mask & ~gained
            straight[take] = sample[take]
            gained |= take
        if not gained.any():
            break
        color[gained] = straight[gained]
        filled |= gained

    # Fringe texels take the dilated silhouette color. Everything else keeps
    # its own straight color (effects, and the already-opaque interior).
    straight_rgb = rgb.copy()
    fringe = filled & ~opaque
    straight_rgb[fringe] = color[fringe]
    coverage = (alpha.astype(np.float32) / 255.0)[..., None]
    premul = np.clip(straight_rgb.astype(np.float32) * coverage, 0, 255).astype(np.uint8)
    out = rgba.copy()
    out[..., :3] = premul
    return out


def _ffmpeg_base() -> list[str]:
    return ["ffmpeg", "-hide_banner", "-loglevel", "error"]


def transcode(src: Path, dst: Path) -> None:
    decode = subprocess.Popen(
        [
            *_ffmpeg_base(),
            "-c:v",
            "libvpx-vp9",
            "-i",
            str(src),
            "-f",
            "rawvideo",
            "-pix_fmt",
            "rgba",
            "pipe:1",
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    encode = subprocess.Popen(
        [
            *_ffmpeg_base(),
            "-f",
            "rawvideo",
            "-pix_fmt",
            "rgba",
            "-s",
            f"{WIDTH}x{HEIGHT}",
            "-r",
            "24",
            "-i",
            "pipe:0",
            "-an",
            "-c:v",
            "libvpx-vp9",
            "-pix_fmt",
            "yuva420p",
            "-auto-alt-ref",
            "0",
            "-b:v",
            "0",
            "-crf",
            CRF,
            "-cpu-used",
            CPU_USED,
            "-row-mt",
            "1",
            "-threads",
            "2",
            "-metadata:s:v:0",
            "alpha_mode=1",
            "-y",
            str(dst),
        ],
        stdin=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    assert decode.stdout is not None and encode.stdin is not None
    frames = 0
    try:
        while True:
            blob = decode.stdout.read(FRAME_BYTES)
            if not blob:
                break
            if len(blob) != FRAME_BYTES:
                raise RuntimeError(f"{src.name}: short frame ({len(blob)} bytes)")
            frame = np.frombuffer(blob, dtype=np.uint8).reshape(HEIGHT, WIDTH, 4)
            fixed = defringe_frame(frame)
            encode.stdin.write(fixed.tobytes())
            frames += 1
        encode.stdin.close()
    finally:
        decode.stdout.close()
    decode_err = decode.stderr.read().decode() if decode.stderr else ""
    encode_err = encode.stderr.read().decode() if encode.stderr else ""
    decode.wait()
    encode.wait()
    if decode.returncode != 0:
        raise RuntimeError(f"{src.name}: decode failed\n{decode_err}")
    if encode.returncode != 0:
        raise RuntimeError(f"{src.name}: encode failed\n{encode_err}")
    if frames == 0:
        raise RuntimeError(f"{src.name}: no frames decoded (alpha dropped?)")


def alpha_is_real(path: Path) -> bool:
    """A real alpha plane is neither a solid plate nor missing."""
    probe = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream_tags=ALPHA_MODE",
            "-of",
            "default=nw=1:nk=1",
            str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    if probe.stdout.strip() != "1":
        return False
    raw = subprocess.run(
        [
            *_ffmpeg_base(),
            "-c:v",
            "libvpx-vp9",
            "-i",
            str(path),
            "-frames:v",
            "1",
            "-f",
            "rawvideo",
            "-pix_fmt",
            "rgba",
            "pipe:1",
        ],
        check=True,
        capture_output=True,
    )
    if len(raw.stdout) != FRAME_BYTES:
        return False
    alpha = np.frombuffer(raw.stdout, dtype=np.uint8).reshape(HEIGHT, WIDTH, 4)[..., 3]
    # Transparent field is alpha 0/1, the body is opaque. Both have to survive.
    return bool((alpha <= 1).mean() > 0.5 and (alpha >= 250).mean() > 0.05)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="a .webm file or a directory of them")
    parser.add_argument("-o", "--output", type=Path, help="output file (single input only)")
    args = parser.parse_args()
    source = args.source
    if source.is_dir():
        if args.output:
            print("-o is only valid for a single file", file=sys.stderr)
            return 2
        files = sorted(source.glob("*.webm"))
    else:
        files = [source]
    if not files:
        print(f"no webm under {source}", file=sys.stderr)
        return 1
    for src in files:
        dst = args.output if args.output else src
        tmp = dst.with_suffix(dst.suffix + ".defringe.tmp.webm")
        try:
            transcode(src, tmp)
            if not alpha_is_real(tmp):
                raise RuntimeError(f"{src.name}: encoded file lost its alpha plane")
            tmp.replace(dst)
        except Exception:
            tmp.unlink(missing_ok=True)
            raise
        print(f"{src.name} -> {dst} ({dst.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
