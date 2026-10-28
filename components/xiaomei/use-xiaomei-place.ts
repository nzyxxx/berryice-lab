"use client";

import {
  clampPlace,
  defaultPlace,
  nearestPeek,
  placeAfterResize,
  placeFromStored,
  xiaomeiSpriteBox,
  type XiaomeiPeek,
  type XiaomeiPoint,
} from "@/lib/xiaomei-place";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "berryice.xiaomei";
const DRAG_SLOP = 6;

type StoredPlace = XiaomeiPoint & {
  hidden: boolean;
  peek: XiaomeiPeek | null;
};

type DragState = {
  id: number;
  originX: number;
  originY: number;
  startX: number;
  startY: number;
  moved: boolean;
  peeked: boolean;
  announced: boolean;
};

function readStored(): StoredPlace | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredPlace>;
    if (typeof parsed.x !== "number" || typeof parsed.y !== "number" || !Number.isFinite(parsed.x)) {
      return null;
    }
    const peek =
      parsed.peek === "left" || parsed.peek === "right" || parsed.peek === "top" || parsed.peek === "bottom"
        ? parsed.peek
        : null;
    return { x: parsed.x, y: parsed.y, hidden: parsed.hidden === true, peek };
  } catch {
    return null;
  }
}

function writeStored(place: StoredPlace) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(place));
  } catch {
    /* 隐私模式写不进也还能拖，只是刷新会回到角落。 */
  }
}

function viewport() {
  return { vw: window.innerWidth, vh: window.innerHeight };
}

function subscribeNothing() {
  return () => {};
}

type LivePlace = {
  compact: boolean;
  hidden: boolean;
  pos: XiaomeiPoint;
  peek: XiaomeiPeek | null;
};

function bootPlace(): LivePlace {
  const compact = window.matchMedia("(max-width: 639px)").matches;
  const box = xiaomeiSpriteBox(compact);
  const { vw, vh } = viewport();
  const stored = readStored();
  const pos = stored
    ? placeFromStored(stored, vw, vh, box.width, box.height)
    : defaultPlace(vw, vh, box.width, box.height);
  return { compact, hidden: stored?.hidden ?? false, pos, peek: stored?.peek ?? null };
}

export function useXiaomeiPlace(options: {
  onTap: () => void;
  onHold?: () => void;
  onDragStart?: () => void;
  allowPeek: boolean;
}) {
  const mounted = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const [live, setLive] = useState<LivePlace | null>(null);
  if (mounted && live === null) setLive(bootPlace());

  const hidden = live?.hidden ?? false;
  const pos = live?.pos ?? { x: 0, y: 0 };
  const peek = live?.peek ?? null;
  const compact = live?.compact ?? false;
  const ready = live !== null;

  const onTapRef = useRef(options.onTap);
  const onHoldRef = useRef(options.onHold);
  const onDragStartRef = useRef(options.onDragStart);
  const allowPeekRef = useRef(options.allowPeek);
  const posRef = useRef(pos);
  const peekRef = useRef(peek);
  const hiddenRef = useRef(hidden);
  const compactRef = useRef(compact);
  const dragRef = useRef<DragState | null>(null);
  const pointerTapped = useRef(false);
  const holdTimer = useRef(0);
  const holdFired = useRef(false);
  const box = xiaomeiSpriteBox(compact);
  const boxRef = useRef(box);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    onTapRef.current = options.onTap;
    onHoldRef.current = options.onHold;
    onDragStartRef.current = options.onDragStart;
    allowPeekRef.current = options.allowPeek;
    posRef.current = pos;
    peekRef.current = peek;
    hiddenRef.current = hidden;
    compactRef.current = compact;
    boxRef.current = box;
  });

  const setPos = useCallback((next: XiaomeiPoint) => {
    setLive((current) => (current ? { ...current, pos: next } : current));
  }, []);
  const setPeek = useCallback((next: XiaomeiPeek | null) => {
    setLive((current) => (current ? { ...current, peek: next } : current));
  }, []);
  const setHidden = useCallback((next: boolean) => {
    setLive((current) => (current ? { ...current, hidden: next } : current));
  }, []);
  const setCompact = useCallback((next: boolean) => {
    setLive((current) => (current ? { ...current, compact: next } : current));
  }, []);

  const persist = useCallback((next: StoredPlace) => {
    writeStored(next);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const viewRef = { vw: window.innerWidth, vh: window.innerHeight };
    const onResize = () => {
      const nextCompact = window.matchMedia("(max-width: 639px)").matches;
      const prevBox = xiaomeiSpriteBox(compactRef.current);
      const nextBox = xiaomeiSpriteBox(nextCompact);
      const { vw, vh } = viewport();
      const anchored = placeAfterResize(
        posRef.current,
        prevBox,
        nextBox,
        viewRef.vw,
        viewRef.vh,
        vw,
        vh,
      );
      if (!anchored) return;
      viewRef.vw = vw;
      viewRef.vh = vh;
      posRef.current = anchored;
      setPos(anchored);
      setCompact(nextCompact);
      persist({ ...anchored, hidden: hiddenRef.current, peek: peekRef.current });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [persist, ready, setCompact, setPos]);

  const clearPeek = useCallback(() => {
    if (!peekRef.current) return;
    peekRef.current = null;
    setPeek(null);
    persist({ ...posRef.current, hidden: hiddenRef.current, peek: null });
  }, [persist, setPeek]);

  const hide = useCallback(() => {
    hiddenRef.current = true;
    setHidden(true);
    persist({ ...posRef.current, hidden: true, peek: peekRef.current });
  }, [persist, setHidden]);

  const restore = useCallback(() => {
    hiddenRef.current = false;
    setHidden(false);
    persist({ ...posRef.current, hidden: false, peek: peekRef.current });
  }, [persist, setHidden]);

  const resetCorner = useCallback(() => {
    const { vw, vh } = viewport();
    const size = boxRef.current;
    const next = defaultPlace(vw, vh, size.width, size.height);
    posRef.current = next;
    peekRef.current = null;
    setPos(next);
    setPeek(null);
    persist({ ...next, hidden: hiddenRef.current, peek: null });
  }, [persist, setPeek, setPos]);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    // 按下时如果页面正在输入，不能把焦点抢过来。
    const active = document.activeElement;
    const typing =
      active instanceof HTMLInputElement ||
      active instanceof HTMLTextAreaElement ||
      active instanceof HTMLSelectElement ||
      (active instanceof HTMLElement && active.isContentEditable);
    if (typing) event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    holdFired.current = false;
    window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => {
      holdFired.current = true;
      onHoldRef.current?.();
    }, 560);
    dragRef.current = {
      id: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      startX: posRef.current.x,
      startY: posRef.current.y,
      moved: false,
      peeked: peekRef.current !== null,
      announced: false,
    };
  }, []);

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.originX;
    const dy = event.clientY - drag.originY;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_SLOP) return;
    drag.moved = true;
    window.clearTimeout(holdTimer.current);
    if (!drag.announced) {
      drag.announced = true;
      onDragStartRef.current?.();
    }
    setDragging(true);
    if (peekRef.current) {
      peekRef.current = null;
      setPeek(null);
    }
    const { vw, vh } = viewport();
    const next = clampPlace(
      drag.startX + dx,
      drag.startY + dy,
      vw,
      vh,
      boxRef.current.width,
      boxRef.current.height,
    );
    posRef.current = next;
    setPos(next);
  }, [setPeek, setPos]);

  const finishPointer = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.id !== event.pointerId) return;
      dragRef.current = null;
      window.clearTimeout(holdTimer.current);
      setDragging(false);
      pointerTapped.current = true;
      if (holdFired.current) {
        holdFired.current = false;
        return;
      }
      if (drag.moved) {
        const { vw, vh } = viewport();
        const size = boxRef.current;
        const edge = allowPeekRef.current
          ? nearestPeek(posRef.current.x, posRef.current.y, vw, vh, size.width, size.height)
          : null;
        peekRef.current = edge;
        setPeek(edge);
        persist({ ...posRef.current, hidden: false, peek: edge });
        return;
      }
      if (drag.peeked) {
        peekRef.current = null;
        setPeek(null);
        persist({ ...posRef.current, hidden: hiddenRef.current, peek: null });
        return;
      }
      onTapRef.current();
    },
    [persist, setPeek],
  );

  const onClick = useCallback(() => {
    if (pointerTapped.current) {
      pointerTapped.current = false;
      return;
    }
    onTapRef.current();
  }, []);

  const onEnter = useCallback(() => {
    clearPeek();
  }, [clearPeek]);

  return {
    ready,
    hidden,
    pos,
    peek,
    dragging,
    box,
    hide,
    restore,
    clearPeek,
    resetCorner,
    onEnter,
    spriteHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finishPointer,
      onPointerCancel: finishPointer,
      onClick,
    },
  };
}
