/** 小莓在视口里的位置。纯计算，不碰 DOM。 */

export const XIAOMEI_FRAME = { width: 256, height: 351 } as const;

/** 顶栏大约 56px。再往上拖会被头挡住，点不到。 */
export const XIAOMEI_HEADER_INSET = 56;

/** 回到顶部按钮在 bottom-6，本身 44px。默认停在它上面。 */
export const XIAOMEI_BOTTOM_RESERVE = 88;

export const XIAOMEI_EDGE_PEEK_PX = 12;

const SIDE_MARGIN = 20;

export type XiaomeiPeek = "left" | "right" | "top" | "bottom";

export type XiaomeiPoint = { x: number; y: number };

export function xiaomeiSpriteBox(compact: boolean): { width: number; height: number } {
  const height = compact ? 72 : 96;
  const width = Math.round((height * XIAOMEI_FRAME.width) / XIAOMEI_FRAME.height);
  return { width, height };
}

export function clampPlace(
  x: number,
  y: number,
  vw: number,
  vh: number,
  width: number,
  height: number,
): XiaomeiPoint {
  const maxX = Math.max(0, vw - width);
  const maxY = Math.max(0, vh - height);
  const minY = Math.min(XIAOMEI_HEADER_INSET, maxY);
  return {
    x: Math.min(maxX, Math.max(0, x)),
    y: Math.min(maxY, Math.max(minY, y)),
  };
}

export function defaultPlace(vw: number, vh: number, width: number, height: number): XiaomeiPoint {
  return clampPlace(
    vw - width - SIDE_MARGIN,
    vh - height - XIAOMEI_BOTTOM_RESERVE,
    vw,
    vh,
    width,
    height,
  );
}

/** 旧坐标落在新视口外面时回到右下角，避免缩窗口后粘在左上角盖住标题。 */
export function placeFromStored(
  stored: XiaomeiPoint,
  vw: number,
  vh: number,
  width: number,
  height: number,
): XiaomeiPoint {
  if (stored.x < 0 || stored.y < 0 || stored.x > vw - width / 2 || stored.y > vh - height / 2) {
    return defaultPlace(vw, vh, width, height);
  }
  return clampPlace(stored.x, stored.y, vw, vh, width, height);
}

/** 按离右、离下的边距跟着窗口走。视口太小的中间态直接忽略。 */
export function placeAfterResize(
  prev: XiaomeiPoint,
  prevBox: { width: number; height: number },
  nextBox: { width: number; height: number },
  prevVw: number,
  prevVh: number,
  vw: number,
  vh: number,
): XiaomeiPoint | null {
  if (vw < 240 || vh < 320 || prevVw < 240 || prevVh < 320) return null;
  const right = prevVw - (prev.x + prevBox.width);
  const bottom = prevVh - (prev.y + prevBox.height);
  return clampPlace(
    vw - nextBox.width - right,
    vh - nextBox.height - bottom,
    vw,
    vh,
    nextBox.width,
    nextBox.height,
  );
}

/** 松手时贴边才探出半个身位。角落只选更近的一边，避免整个人滑进夹角。 */
export function nearestPeek(
  x: number,
  y: number,
  vw: number,
  vh: number,
  width: number,
  height: number,
  threshold = XIAOMEI_EDGE_PEEK_PX,
): XiaomeiPeek | null {
  const distances: Record<XiaomeiPeek, number> = {
    left: x,
    right: vw - (x + width),
    top: y,
    bottom: vh - (y + height),
  };
  let best: XiaomeiPeek | null = null;
  let bestDistance = threshold;
  for (const edge of ["left", "right", "top", "bottom"] as const) {
    if (distances[edge] <= bestDistance) {
      best = edge;
      bestDistance = distances[edge];
    }
  }
  return best;
}

function pickDockSide(prefer: "up" | "down", roomAbove: number, roomBelow: number): "up" | "down" {
  if (prefer === "up" && roomAbove >= 140) return "up";
  if (prefer === "down" && roomBelow >= 140) return "down";
  return roomAbove >= roomBelow ? "up" : "down";
}

/**
 * 键盘收起时，气泡高度跟立绘走。
 * 键盘盖住立绘时把她抬到可视区底边上方，避免输入框被盖住。
 * 小于 120 的落差多半是浏览器顶栏，不当成键盘。
 */
export function dockXiaomeiChat(input: {
  y: number;
  boxHeight: number;
  placement: "up" | "down";
  roomAbove: number;
  roomBelow: number;
  keyboardInset: number;
  visibleTop: number;
  visibleHeight: number;
}): { lift: boolean; placement: "up" | "down"; maxHeight: number } {
  const keyboard = input.keyboardInset > 120 && input.visibleHeight > 0;
  if (!keyboard) {
    const room = input.placement === "up" ? input.roomAbove : input.roomBelow;
    return {
      lift: false,
      placement: input.placement,
      maxHeight: Math.max(160, Math.min(260, room)),
    };
  }
  const visibleBottom = input.visibleTop + input.visibleHeight;
  const lift = input.y + input.boxHeight > visibleBottom - 8;
  const top = lift ? Math.max(XIAOMEI_HEADER_INSET, visibleBottom - input.boxHeight - 8) : input.y;
  const roomAbove = Math.max(0, top - input.visibleTop - 12);
  const roomBelow = Math.max(0, visibleBottom - top - input.boxHeight - 12);
  const placement = pickDockSide(input.placement, roomAbove, roomBelow);
  const room = placement === "up" ? roomAbove : roomBelow;
  return {
    lift,
    placement,
    maxHeight: Math.max(140, Math.min(240, room)),
  };
}

export function peekTransform(peek: XiaomeiPeek | null): string {
  switch (peek) {
    case "left":
      return "translateX(-50%)";
    case "right":
      return "translateX(50%)";
    case "top":
      return "translateY(-50%)";
    case "bottom":
      return "translateY(50%)";
    default:
      return "translate3d(0, 0, 0)";
  }
}
