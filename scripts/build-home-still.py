#!/usr/bin/env python3
"""从 864×1152 原图做首页静帧。

输入是已接受的同身份原图，不是 I2V 310×686 再放大的 640×853。
只把三处负空间的奶白块改成透明：左发梢下、右发梢下、右发边长白条。
衣领、袖、围裙、滚边和蓝莓发卡底托不进这三块矩形。
人物像素不缩放。外框按现有 640×853 静帧的身体占比补透明边，
所以页面上的角色大小不跟画布一起变。
"""

from __future__ import annotations

import hashlib
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE_PNG = ROOT / "scripts/portrait-sources/candD_fix1_cutout_raw.png"
SOURCE_JPG = ROOT / "scripts/portrait-sources/xiaomei_front_still_candD_fix1.jpg"
OUTPUT = ROOT / "public/characters/xiaomei/idle-candd-24-still-hi2.webp"

PNG_SHA = "8722aa473f0d25576525ca1f04672a12f400e63d09fa12a649f820318ffdb5c5"
JPG_SHA = "ca184df65115a311cf94afafd41398027430499dffdc4c3cd3143f794414978f"

# 现有首页静帧（640×853）里 alpha>16 的身体框。
OLD_BODY = (197, 171, 443, 724)
OLD_CANVAS = (640, 853)

# 三块负空间。坐标来自原图像素，矩形只是搜索范围，里面还要过奶白判定。
GAPS = (
    (322, 488, 372, 522, 205, 34),  # 左发梢下
    (492, 490, 548, 528, 198, 40),  # 右发梢下
    (612, 388, 662, 478, 210, 32),  # 右发边长白条
)
# hi 上线后仍留在洞边的底色。只在这两框里，并且接受稿像素接近奶油底，才清。
# 衣领连通块在 x 376–417，不在这两框里。
RESIDUE = (
    (320, 500, 372, 526),
    (470, 500, 524, 526),
)
BACKDROP = (249, 244, 241)
BACKDROP_DELTA = 16


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    digest.update(path.read_bytes())
    return digest.hexdigest()


def milky(r: int, g: int, b: int, a: int, lo: int, chroma: int) -> bool:
    return a >= 30 and min(r, g, b) >= lo and max(r, g, b) - min(r, g, b) <= chroma


def main() -> None:
    if sha256(SOURCE_PNG) != PNG_SHA or sha256(SOURCE_JPG) != JPG_SHA:
        sys.exit("原图哈希和 11/11 接受的两张不一致，停止。")
    png = Image.open(SOURCE_PNG).convert("RGBA")
    jpg = Image.open(SOURCE_JPG).convert("RGB")
    if png.size != (864, 1152) or jpg.size != (864, 1152):
        sys.exit(f"原图尺寸不是 864×1152：{png.size} {jpg.size}")
    # 奶油白底只用来核对身份，不参与删像素。衣领和围裙在这张 jpg 里也是浅色。
    corner = jpg.getpixel((0, 0))
    if corner != (249, 244, 241):
        sys.exit(f"对照 jpg 的底色不是 249,244,241：{corner}")

    out = png.copy()
    src = png.load()
    dst = out.load()
    cleared: list[tuple[int, int]] = []
    for x0, y0, x1, y1, lo, chroma in GAPS:
        for y in range(y0, y1):
            for x in range(x0, x1):
                r, g, b, a = src[x, y]
                if milky(r, g, b, a, lo, chroma):
                    dst[x, y] = (r, g, b, 0)
                    cleared.append((x, y))
    if not 400 <= len(cleared) <= 2000:
        sys.exit(f"清掉的像素数 {len(cleared)} 不在预期范围，停止。")

    # 洞边还剩一圈：接受稿在这些坐标上是奶油底，抠图却留下半透明灰白。
    # 贴着不透明发丝的那 1 个像素改成发色半透明，其余直接透明。
    residue: list[tuple[int, int]] = []
    for x0, y0, x1, y1 in RESIDUE:
        for y in range(y0, y1):
            for x in range(x0, x1):
                r, g, b, a = dst[x, y]
                if a < 8:
                    continue
                jr, jg, jb = jpg.getpixel((x, y))
                if max(abs(jr - BACKDROP[0]), abs(jg - BACKDROP[1]), abs(jb - BACKDROP[2])) > BACKDROP_DELTA:
                    continue
                dst[x, y] = (0, 0, 0, 0)
                residue.append((x, y))
    if not 200 <= len(residue) <= 800:
        sys.exit(f"洞边残留数 {len(residue)} 不在预期范围，停止。")
    softened = 0
    for x, y in residue:
        hair = None
        for oy in (-1, 0, 1):
            for ox in (-1, 0, 1):
                if ox == 0 and oy == 0:
                    continue
                nx, ny = x + ox, y + oy
                nr, ng, nb, na = dst[nx, ny]
                if na < 240:
                    continue
                jr, jg, jb = jpg.getpixel((nx, ny))
                if max(abs(jr - BACKDROP[0]), abs(jg - BACKDROP[1]), abs(jb - BACKDROP[2])) <= BACKDROP_DELTA:
                    continue
                hair = (nr, ng, nb)
                break
            if hair:
                break
        if hair:
            dst[x, y] = (hair[0], hair[1], hair[2], 80)
            softened += 1
    if not 8 <= softened <= 80:
        sys.exit(f"边缘抗锯齿像素 {softened} 不在预期范围，停止。")

    # 发梢高光必须还在：接受稿这里不是底色。
    highlight = dst[337, 498]
    if highlight[3] < 240:
        sys.exit(f"发梢高光被清掉了：{highlight}")
    # 右侧白尖 (490,512) 的接受稿是裁切过的近白，四周是底色，不能留成白点。
    spike = dst[490, 512]
    if spike[3] > 80 and min(spike[:3]) > 220:
        sys.exit(f"右侧白尖还在：{spike}")

    # 只给刚清开的洞边收白边。不改不透明的衣领和袖。
    width, height = out.size
    residue_at = set(residue)
    recolored = 0
    for x, y in cleared:
        for dy in range(-2, 3):
            for dx in range(-2, 3):
                nx, ny = x + dx, y + dy
                if (nx, ny) in residue_at or not (0 <= nx < width and 0 <= ny < height):
                    continue
                r, g, b, a = dst[nx, ny]
                if a == 0 or a >= 250 or not milky(r, g, b, a, 210, 30):
                    continue
                found = None
                for rad in range(1, 8):
                    for oy in range(-rad, rad + 1):
                        for ox in range(-rad, rad + 1):
                            if max(abs(ox), abs(oy)) != rad:
                                continue
                            mx, my = nx + ox, ny + oy
                            if 0 <= mx < width and 0 <= my < height and dst[mx, my][3] >= 250:
                                found = dst[mx, my]
                                break
                        if found:
                            break
                    if found:
                        break
                if found:
                    dst[nx, ny] = (found[0], found[1], found[2], a)
                    recolored += 1

    # 这些点必须仍是不透明的衣服或发卡，用来防止矩形划进衣领。
    for keep in ((400, 530), (320, 600), (430, 780), (560, 210)):
        if dst[keep][3] < 250:
            sys.exit(f"保留点 {keep} 被清掉了，停止。")

    minx, miny, maxx, maxy = width, height, 0, 0
    for y in range(height):
        for x in range(width):
            if dst[x, y][3] > 16:
                minx, miny = min(minx, x), min(miny, y)
                maxx, maxy = max(maxx, x), max(maxy, y)
    body_w, body_h = maxx - minx + 1, maxy - miny + 1
    old_w, old_h = OLD_CANVAS
    old_x0, old_y0, old_x1, old_y1 = OLD_BODY
    old_bw, old_bh = old_x1 - old_x0 + 1, old_y1 - old_y0 + 1
    canvas_w = round(body_w / (old_bw / old_w))
    canvas_h = round(body_h / (old_bh / old_h))
    if canvas_w / canvas_h > old_w / old_h:
        canvas_h = round(canvas_w * old_h / old_w)
    else:
        canvas_w = round(canvas_h * old_w / old_h)
    place_x = round((canvas_w - body_w) * old_x0 / (old_x0 + (old_w - 1 - old_x1)))
    place_y = round((canvas_h - body_h) * old_y0 / (old_y0 + (old_h - 1 - old_y1)))
    canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    canvas.paste(out.crop((minx, miny, maxx + 1, maxy + 1)), (place_x, place_y))
    if (canvas_w, canvas_h) != (1246, 1661):
        sys.exit(f"画布变成 {canvas_w}x{canvas_h}，人物比例会变，停止。")
    if abs(body_w / canvas_w - old_bw / old_w) > 0.01:
        sys.exit("身体宽度占比和现有静帧差超过 1%，停止。")
    if abs(body_h / canvas_h - old_bh / old_h) > 0.01:
        sys.exit("身体高度占比和现有静帧差超过 1%，停止。")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUTPUT, format="WEBP", lossless=True, quality=100, method=6, exact=True)
    check = Image.open(OUTPUT).convert("RGBA")
    if check.size != canvas.size or check.tobytes() != canvas.tobytes():
        sys.exit("写出的 webp 不是无损往返。")
    print(
        f"cleared {len(cleared)} residue {len(residue)} aa {softened} fringe {recolored} "
        f"bbox {minx},{miny}-{maxx},{maxy} {body_w}x{body_h} "
        f"canvas {canvas_w}x{canvas_h} at {place_x},{place_y} "
        f"sha {sha256(OUTPUT)}"
    )


if __name__ == "__main__":
    main()
