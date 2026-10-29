/** 小莓在视口里的位置。纯计算，不碰 DOM。 */

/** 按住这么久、并且没拖动，打开菜单。右键是另一条入口，不走这条计时。 */
export const XIAOMEI_PET_HOLD_MS = 450;

/** 五张表情都是 256×438 全身立绘，腿和鞋在框内。像素来自 ship_fullbody_v1。 */
export const XIAOMEI_FRAME = { width: 256, height: 438 } as const;

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

/** 菜单 / 记忆 / 对话 / 气泡与 CSS `mt-2` `mb-2` 对齐。 */
export const XIAOMEI_POPOVER_GAP = 8;

/** 离 visualViewport / 安全区再让 8px，避免贴边。 */
export const XIAOMEI_POPOVER_PAD = 8;

/** 与 `w-52` + `max-h-24rem` 对齐，略估高，宁可先翻面。 */
export const XIAOMEI_MENU_PANEL = { width: 208, height: 428 } as const;

/** 与 `min(17.5rem, 100vw-2rem)` + `max-h-22rem` 对齐。 */
export const XIAOMEI_MEMORY_PANEL = { width: 280, height: 352 } as const;

export const XIAOMEI_CHAT_PANEL = { width: 280, height: 260 } as const;

export const XIAOMEI_SPEECH_PANEL = { width: 240, height: 96 } as const;

export const XIAOMEI_HINT_PANEL = { width: 180, height: 40 } as const;

export type XiaomeiAnchorBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type XiaomeiVisibleView = {
  left: number;
  top: number;
  width: number;
  height: number;
  safeTop: number;
  safeRight: number;
  safeBottom: number;
  safeLeft: number;
};

export type XiaomeiPopoverPlace = {
  align: "left" | "right";
  placement: "up" | "down";
  shiftX: number;
  shiftY: number;
  maxHeight: number;
};

/**
 * 探出半个身位时的可见盒。菜单打开时 transform 被清掉，peek 传 null。
 */
export function liveAnchorBox(
  pos: XiaomeiPoint,
  box: { width: number; height: number },
  peek: XiaomeiPeek | null,
): XiaomeiAnchorBox {
  let x = pos.x;
  let y = pos.y;
  switch (peek) {
    case "left":
      x -= box.width / 2;
      break;
    case "right":
      x += box.width / 2;
      break;
    case "top":
      y -= box.height / 2;
      break;
    case "bottom":
      y += box.height / 2;
      break;
    default:
      break;
  }
  return { x, y, width: box.width, height: box.height };
}

/** 把 inner + visualViewport + 安全区收成同一套可视矩形。缺 visual 就用 inner。 */
export function xiaomeiVisibleView(input: {
  innerWidth: number;
  innerHeight: number;
  visual?: { offsetLeft: number; offsetTop: number; width: number; height: number } | null;
  safe?: { top?: number; right?: number; bottom?: number; left?: number } | null;
}): XiaomeiVisibleView {
  const visual = input.visual;
  const safe = input.safe;
  return {
    left: visual?.offsetLeft ?? 0,
    top: visual?.offsetTop ?? 0,
    width: visual?.width ?? input.innerWidth,
    height: visual?.height ?? input.innerHeight,
    safeTop: Math.max(0, safe?.top ?? 0),
    safeRight: Math.max(0, safe?.right ?? 0),
    safeBottom: Math.max(0, safe?.bottom ?? 0),
    safeLeft: Math.max(0, safe?.left ?? 0),
  };
}

function clampNumber(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(max, Math.max(min, value));
}

/**
 * 按剩余空间翻面，不够再平移进可视区。
 * 近顶向下、近底向上；近右齐右（面板往左长），近左齐左。
 * 只算数，不读 DOM。
 */
export function placeXiaomeiPopover(input: {
  anchor: XiaomeiAnchorBox;
  view: XiaomeiVisibleView;
  panel: { width: number; height: number };
  gap?: number;
  pad?: number;
}): XiaomeiPopoverPlace {
  const gap = input.gap ?? XIAOMEI_POPOVER_GAP;
  const pad = input.pad ?? XIAOMEI_POPOVER_PAD;
  const { anchor, view, panel } = input;

  const viewLeft = view.left + pad + view.safeLeft;
  const viewTop = view.top + pad + view.safeTop;
  const viewRight = view.left + view.width - pad - view.safeRight;
  const viewBottom = view.top + view.height - pad - view.safeBottom;
  const viewH = Math.max(0, viewBottom - viewTop);

  const spaceAbove = anchor.y - viewTop;
  const spaceBelow = viewBottom - (anchor.y + anchor.height);
  const needH = panel.height + gap;

  let placement: "up" | "down";
  if (spaceAbove >= needH && spaceBelow < needH) placement = "up";
  else if (spaceBelow >= needH && spaceAbove < needH) placement = "down";
  else placement = spaceAbove >= spaceBelow ? "up" : "down";

  const roomIfLeft = viewRight - anchor.x;
  const roomIfRight = anchor.x + anchor.width - viewLeft;
  const spaceToLeft = anchor.x - viewLeft;
  const spaceToRight = viewRight - (anchor.x + anchor.width);

  let align: "left" | "right";
  if (roomIfLeft >= panel.width && roomIfRight >= panel.width) {
    align = spaceToRight <= spaceToLeft ? "right" : "left";
  } else if (roomIfRight >= panel.width) {
    align = "right";
  } else if (roomIfLeft >= panel.width) {
    align = "left";
  } else {
    align = roomIfRight >= roomIfLeft ? "right" : "left";
  }

  const maxHeight = Math.max(0, Math.min(panel.height, viewH));

  // 位移按 CSS 实际宽度算（菜单 w-52），不要先收成 viewW，否则齐右会偏。
  const left = align === "left" ? anchor.x : anchor.x + anchor.width - panel.width;
  const top = placement === "up" ? anchor.y - gap - maxHeight : anchor.y + anchor.height + gap;

  const clampedLeft = clampNumber(left, viewLeft, viewRight - panel.width);
  const clampedTop = clampNumber(top, viewTop, viewBottom - maxHeight);

  return {
    align,
    placement,
    shiftX: clampedLeft - left,
    shiftY: clampedTop - top,
    maxHeight,
  };
}

export function xiaomeiPopoverOffsetStyle(
  shiftX: number,
  shiftY: number,
  maxHeight?: number,
): { transform?: string; maxHeight?: number } {
  const style: { transform?: string; maxHeight?: number } = {};
  if (shiftX !== 0 || shiftY !== 0) style.transform = `translate(${shiftX}px, ${shiftY}px)`;
  if (typeof maxHeight === "number" && maxHeight > 0) style.maxHeight = maxHeight;
  return style;
}
