"use client";

import {
  XIAOMEI_INERTIA_DAMP,
  XIAOMEI_INERTIA_MAX_MS,
  XIAOMEI_PET_HOLD_MS,
  XIAOMEI_RELEASE_SLOW_SPEED,
  classifyHitZone,
  pointerEntersHitZone,
  clampPlace,
  defaultPlace,
  estimatePointerVelocity,
  nearestPeek,
  placeAfterResize,
  placeFromStored,
  springStep,
  xiaomeiSpriteBox,
  type XiaomeiHitZone,
  type XiaomeiPeek,
  type XiaomeiPoint,
} from "@/lib/xiaomei-place";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "berryice.xiaomei";
const DRAG_SLOP = 6;
const SAMPLE_CAP = 12;

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
  localY: number;
  moved: boolean;
  peeked: boolean;
  announced: boolean;
};

type Sample = { t: number; x: number; y: number };

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

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
  onTap: (zone: XiaomeiHitZone) => void;
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

  const targetRef = useRef(pos);
  const velocityRef = useRef({ vx: 0, vy: 0 });
  const samplesRef = useRef<Sample[]>([]);
  const rafRef = useRef(0);
  const modeRef = useRef<"idle" | "follow" | "inertia">("idle");
  const inertiaUntilRef = useRef(0);
  const lastFrameRef = useRef(0);

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

  const stopMotion = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    modeRef.current = "idle";
    velocityRef.current = { vx: 0, vy: 0 };
  }, []);

  const writeLivePos = useCallback(
    (next: XiaomeiPoint) => {
      posRef.current = next;
      setPos(next);
    },
    [setPos],
  );

  const tickMotion = useCallback(() => {
    rafRef.current = 0;
    const mode = modeRef.current;
    if (mode === "idle") return;

    const now = performance.now();
    const dt = Math.min(Math.max((now - lastFrameRef.current) / 1000, 0), 1 / 30);
    lastFrameRef.current = now;
    const { vw, vh } = viewport();
    const size = boxRef.current;
    let { x, y } = posRef.current;
    let { vx, vy } = velocityRef.current;

    if (mode === "follow") {
      if (prefersReducedMotion()) {
        const snap = clampPlace(targetRef.current.x, targetRef.current.y, vw, vh, size.width, size.height);
        writeLivePos(snap);
        rafRef.current = requestAnimationFrame(tickMotion);
        return;
      }
      vx = springStep(vx, x, targetRef.current.x, dt);
      vy = springStep(vy, y, targetRef.current.y, dt);
      x += vx * dt;
      y += vy * dt;
      const next = clampPlace(x, y, vw, vh, size.width, size.height);
      // 撞边就抹掉对应轴速度，避免贴边抖。
      if (next.x !== x) vx = 0;
      if (next.y !== y) vy = 0;
      velocityRef.current = { vx, vy };
      writeLivePos(next);
      rafRef.current = requestAnimationFrame(tickMotion);
      return;
    }

    // inertia
    if (now >= inertiaUntilRef.current || prefersReducedMotion()) {
      const settled = clampPlace(x, y, vw, vh, size.width, size.height);
      writeLivePos(settled);
      stopMotion();
      setDragging(false);
      const edge = allowPeekRef.current
        ? nearestPeek(settled.x, settled.y, vw, vh, size.width, size.height)
        : null;
      peekRef.current = edge;
      setPeek(edge);
      persist({ ...settled, hidden: false, peek: edge });
      return;
    }

    const damp = Math.exp(-XIAOMEI_INERTIA_DAMP * dt);
    vx *= damp;
    vy *= damp;
    x += vx * dt;
    y += vy * dt;
    const next = clampPlace(x, y, vw, vh, size.width, size.height);
    if (next.x !== x) vx = 0;
    if (next.y !== y) vy = 0;
    velocityRef.current = { vx, vy };
    writeLivePos(next);
    if (Math.hypot(vx, vy) < 18) {
      stopMotion();
      setDragging(false);
      const edge = allowPeekRef.current
        ? nearestPeek(next.x, next.y, vw, vh, size.width, size.height)
        : null;
      peekRef.current = edge;
      setPeek(edge);
      persist({ ...next, hidden: false, peek: edge });
      return;
    }
    rafRef.current = requestAnimationFrame(tickMotion);
  }, [persist, setPeek, stopMotion, writeLivePos]);

  const ensureMotion = useCallback(() => {
    if (rafRef.current) return;
    lastFrameRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tickMotion);
  }, [tickMotion]);

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
      targetRef.current = anchored;
      setPos(anchored);
      setCompact(nextCompact);
      persist({ ...anchored, hidden: hiddenRef.current, peek: peekRef.current });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [persist, ready, setCompact, setPos]);

  useEffect(() => () => stopMotion(), [stopMotion]);

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
    stopMotion();
    const { vw, vh } = viewport();
    const size = boxRef.current;
    const next = defaultPlace(vw, vh, size.width, size.height);
    posRef.current = next;
    targetRef.current = next;
    peekRef.current = null;
    setPos(next);
    setPeek(null);
    persist({ ...next, hidden: hiddenRef.current, peek: null });
  }, [persist, setPeek, setPos, stopMotion]);

  const pushSample = useCallback((x: number, y: number) => {
    const samples = samplesRef.current;
    samples.push({ t: performance.now(), x, y });
    if (samples.length > SAMPLE_CAP) samples.shift();
  }, []);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    const active = document.activeElement;
    const typing =
      active instanceof HTMLInputElement ||
      active instanceof HTMLTextAreaElement ||
      active instanceof HTMLSelectElement ||
      (active instanceof HTMLElement && active.isContentEditable);
    if (typing) event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    stopMotion();
    holdFired.current = false;
    window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => {
      holdFired.current = true;
      onHoldRef.current?.();
    }, XIAOMEI_PET_HOLD_MS);
    const rect = event.currentTarget.getBoundingClientRect();
    samplesRef.current = [{ t: performance.now(), x: posRef.current.x, y: posRef.current.y }];
    velocityRef.current = { vx: 0, vy: 0 };
    targetRef.current = posRef.current;
    dragRef.current = {
      id: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      startX: posRef.current.x,
      startY: posRef.current.y,
      localY: event.clientY - rect.top,
      moved: false,
      peeked: peekRef.current !== null,
      announced: false,
    };
  }, [stopMotion]);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current;
      // 没按下的划过不是 poke / 摸头。分区只在 click / long-press 收口。
      if (!drag || drag.id !== event.pointerId) return;
      // 长按已经打开菜单。之后的手指抖动不能再当成拖拽，否则菜单会马上被拖走关掉。
      if (holdFired.current) return;
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
      targetRef.current = next;
      pushSample(next.x, next.y);
      if (prefersReducedMotion()) {
        writeLivePos(next);
        return;
      }
      modeRef.current = "follow";
      ensureMotion();
    },
    [ensureMotion, pushSample, setPeek, writeLivePos],
  );

  const finishPointer = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.id !== event.pointerId) return;
      dragRef.current = null;
      window.clearTimeout(holdTimer.current);
      pointerTapped.current = true;
      if (holdFired.current) {
        holdFired.current = false;
        stopMotion();
        setDragging(false);
        return;
      }
      if (drag.moved) {
        const { vw, vh } = viewport();
        const size = boxRef.current;
        const vel = estimatePointerVelocity(samplesRef.current);
        velocityRef.current = { vx: vel.vx, vy: vel.vy };

        if (prefersReducedMotion() || vel.speed < XIAOMEI_RELEASE_SLOW_SPEED) {
          stopMotion();
          const settled = clampPlace(posRef.current.x, posRef.current.y, vw, vh, size.width, size.height);
          writeLivePos(settled);
          setDragging(false);
          const edge = allowPeekRef.current
            ? nearestPeek(settled.x, settled.y, vw, vh, size.width, size.height)
            : null;
          peekRef.current = edge;
          setPeek(edge);
          persist({ ...settled, hidden: false, peek: edge });
          return;
        }

        // 快甩：短惯性再夹视口，不抛物线出屏。
        modeRef.current = "inertia";
        inertiaUntilRef.current = performance.now() + XIAOMEI_INERTIA_MAX_MS;
        ensureMotion();
        return;
      }
      setDragging(false);
      if (drag.peeked) {
        peekRef.current = null;
        setPeek(null);
        persist({ ...posRef.current, hidden: hiddenRef.current, peek: null });
        return;
      }
      // 松手才是短点。划过（pointermove 且没按下）在 onPointerMove 开头就返回，进不了这里。
      if (!pointerEntersHitZone("click")) return;
      const zone = classifyHitZone(drag.localY, boxRef.current.height);
      onTapRef.current(zone);
    },
    [ensureMotion, persist, setPeek, stopMotion, writeLivePos],
  );

  const onClick = useCallback(() => {
    if (pointerTapped.current) {
      pointerTapped.current = false;
      return;
    }
    onTapRef.current("body");
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
