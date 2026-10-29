"use client";

import { XiaomeiChatSheet } from "@/components/xiaomei/xiaomei-chat-sheet";
import { XiaomeiMemorySheet } from "@/components/xiaomei/xiaomei-memory-sheet";
import { XiaomeiMenu } from "@/components/xiaomei/xiaomei-menu";
import { xiaomeiWhisperClass } from "@/components/xiaomei/xiaomei-surface";
import { XiaomeiStage } from "@/components/xiaomei/xiaomei-stage";
import { useXiaomeiChat } from "@/components/xiaomei/use-xiaomei-chat";
import { useXiaomeiMeters } from "@/components/xiaomei/use-xiaomei-meters";
import { useXiaomeiPlace } from "@/components/xiaomei/use-xiaomei-place";
import { useXiaomeiPresence } from "@/components/xiaomei/use-xiaomei-presence";
import {
  XIAOMEI_ABOUT,
  XIAOMEI_CATCHPHRASE,
  XIAOMEI_HOLD_HINT,
  XIAOMEI_LONG_PRESS_HINT,
  XIAOMEI_CLICK_LINES,
  XIAOMEI_FEED_FULL_LINES,
  XIAOMEI_FEED_LINES,
  XIAOMEI_FEED_SOFT_LINES,
  XIAOMEI_FEED_TOO_MUCH_LINES,
  XIAOMEI_HUNGRY_LINES,
  XIAOMEI_HOVER_LINES,
  XIAOMEI_LINES,
  XIAOMEI_MUTTER_LINES,
  XIAOMEI_NAME,
  XIAOMEI_RECALL_LINES,
  XIAOMEI_SAY_EVENT,
  XIAOMEI_SPAM_LINES,
  isXiaomeiMood,
  pickTaggedLine,
  pickXiaomeiLine,
  type XiaomeiMood,
  type XiaomeiSayDetail,
} from "@/lib/xiaomei-lines";
import {
  resolveXiaomeiFace,
  xiaomeiChatCue,
  xiaomeiCueKind,
  xiaomeiMotionClass,
  xiaomeiPropKind,
} from "@/lib/xiaomei-actions";
import {
  forgetXiaomeiNote,
  isXiaomeiHungry,
  memoryNotesForDrawer,
  readXiaomeiMemory,
  toneFromAffection,
  writeXiaomeiMemory,
  type XiaomeiMemoryRecord,
} from "@/lib/xiaomei-memory";
import { XIAOMEI_METERS_KEY, readFeedClock } from "@/lib/xiaomei-meters";
import {
  XIAOMEI_CHAT_PANEL,
  XIAOMEI_HINT_PANEL,
  XIAOMEI_MEMORY_PANEL,
  XIAOMEI_MENU_PANEL,
  XIAOMEI_SPEECH_PANEL,
  dockXiaomeiChat,
  liveAnchorBox,
  peekTransform,
  placeXiaomeiPopover,
  xiaomeiPopoverOffsetStyle,
  xiaomeiVisibleView,
} from "@/lib/xiaomei-place";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

type Speech = {
  text: string;
  mood: XiaomeiMood;
  source: "greet" | "hover" | "click" | "event" | "about" | "spam" | "mutter" | "feed";
};

const MUTE_KEY = "berryice.xiaomei.muted";
const MUTE_EVENT = "xiaomei-mute";
const HINT_KEY = "berryice.xiaomei.chatHint";
const HINT_EVENT = "xiaomei-hint";
const SPAM_WINDOW_MS = 2400;

function subscribeMute(onChange: () => void) {
  window.addEventListener(MUTE_EVENT, onChange);
  return () => window.removeEventListener(MUTE_EVENT, onChange);
}

let muteCache: { raw: string | null; value: boolean } = { raw: null, value: false };

function readMuted(): boolean {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(MUTE_KEY);
  } catch {
    raw = null;
  }
  if (muteCache.raw === raw) return muteCache.value;
  muteCache = { raw, value: raw === "1" };
  return muteCache.value;
}

function writeMuted(next: boolean) {
  const raw = next ? "1" : "0";
  try {
    localStorage.setItem(MUTE_KEY, raw);
  } catch {
    /* 这次还静音，刷新后可能回来。 */
  }
  muteCache = { raw, value: next };
  window.dispatchEvent(new Event(MUTE_EVENT));
}

let hintCache: { raw: string | null; value: boolean } = { raw: null, value: false };

function subscribeHint(onChange: () => void) {
  window.addEventListener(HINT_EVENT, onChange);
  return () => window.removeEventListener(HINT_EVENT, onChange);
}

function readHintSeen(): boolean {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(HINT_KEY);
  } catch {
    raw = null;
  }
  if (hintCache.raw === raw) return hintCache.value;
  hintCache = { raw, value: raw === "1" };
  return hintCache.value;
}

function subscribeCoarse(onChange: () => void) {
  const query = window.matchMedia("(pointer: coarse), (hover: none)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function readCoarse(): boolean {
  return window.matchMedia("(pointer: coarse), (hover: none)").matches;
}

function markHintSeen() {
  if (readHintSeen()) return;
  const raw = "1";
  try {
    localStorage.setItem(HINT_KEY, raw);
  } catch {
    /* 记不住就下次再提示一次。 */
  }
  hintCache = { raw, value: true };
  window.dispatchEvent(new Event(HINT_EVENT));
}

const EMPTY_VIEW_FRAME = {
  inset: 0,
  height: 0,
  width: 0,
  offsetTop: 0,
  offsetLeft: 0,
  safeTop: 0,
  safeRight: 0,
  safeBottom: 0,
  safeLeft: 0,
};

function readSafeInsets(probe: HTMLElement) {
  const style = getComputedStyle(probe);
  return {
    safeTop: parseFloat(style.paddingTop) || 0,
    safeRight: parseFloat(style.paddingRight) || 0,
    safeBottom: parseFloat(style.paddingBottom) || 0,
    safeLeft: parseFloat(style.paddingLeft) || 0,
  };
}

function useKeyboardFrame(active: boolean) {
  const [frame, setFrame] = useState(EMPTY_VIEW_FRAME);
  useEffect(() => {
    if (!active) return;
    const probe = document.createElement("div");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText =
      "position:fixed;inset:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)";
    document.documentElement.appendChild(probe);
    const read = () => {
      const viewport = window.visualViewport;
      const height = viewport?.height ?? window.innerHeight;
      const width = viewport?.width ?? window.innerWidth;
      const offsetTop = viewport?.offsetTop ?? 0;
      const offsetLeft = viewport?.offsetLeft ?? 0;
      const inset = Math.max(0, Math.round(window.innerHeight - height - offsetTop));
      const safe = readSafeInsets(probe);
      setFrame((prev) =>
        prev.inset === inset &&
        prev.height === height &&
        prev.width === width &&
        prev.offsetTop === offsetTop &&
        prev.offsetLeft === offsetLeft &&
        prev.safeTop === safe.safeTop &&
        prev.safeRight === safe.safeRight &&
        prev.safeBottom === safe.safeBottom &&
        prev.safeLeft === safe.safeLeft
          ? prev
          : { inset, height, width, offsetTop, offsetLeft, ...safe },
      );
    };
    read();
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", read);
    viewport?.addEventListener("scroll", read);
    window.addEventListener("resize", read);
    return () => {
      viewport?.removeEventListener("resize", read);
      viewport?.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
      probe.remove();
      setFrame(EMPTY_VIEW_FRAME);
    };
  }, [active]);
  return frame;
}

/**
 * 全站右下角的小莓妹。拖拽用指针事件。
 * 待机、喝水、点心、打伞、转圈、散步只用 CSS，不留 rAF。
 * z-40：低于弹层（门户 z-50）、回到顶部（z-60）和移动抽屉（z-70）。
 * 点击从本地池里随机回一句；和模型说话从菜单「跟她说话」进。
 * 长按立绘打开菜单；桌面右键同样可以。没有单独的菜单按钮。
 */
export function XiaomeiCompanion() {
  const meters = useXiaomeiMeters();
  const metersRef = useRef(meters.meters);
  metersRef.current = meters.meters;
  const warmRef = useRef(meters.warm);
  warmRef.current = meters.warm;
  const coarse = useSyncExternalStore(subscribeCoarse, readCoarse, () => false);
  const hintSeen = useSyncExternalStore(subscribeHint, readHintSeen, () => true);
  const chat = useXiaomeiChat({
    getMeters: () => {
      let raw: string | null = null;
      try {
        raw = localStorage.getItem(XIAOMEI_METERS_KEY);
      } catch {
        raw = null;
      }
      return {
        affection: metersRef.current.affection,
        fullness: metersRef.current.fullness,
        feedCountToday: readFeedClock(raw, new Date()).feedCountToday,
      };
    },
    onReplied: () => {
      warmRef.current();
    },
  });
  const [chatOpen, setChatOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [memoryRecord, setMemoryRecord] = useState<XiaomeiMemoryRecord | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const muted = useSyncExternalStore(subscribeMute, readMuted, () => false);
  const [speech, setSpeech] = useState<Speech | null>(null);
  const [moodPin, setMoodPin] = useState<XiaomeiMood | null>(null);
  const [hover, setHover] = useState(false);
  const keyboardFrame = useKeyboardFrame(chatOpen || menuOpen || memoryOpen || Boolean(speech));

  const chatOpenRef = useRef(false);
  const menuOpenRef = useRef(false);
  const memoryOpenRef = useRef(false);
  const memoryRecordRef = useRef<XiaomeiMemoryRecord | null>(null);
  const forgetLock = useRef(false);
  const spriteRef = useRef<HTMLButtonElement>(null);
  const mutedRef = useRef(false);
  const speechRef = useRef<Speech | null>(null);
  const flashClickRef = useRef<(mood: XiaomeiMood) => void>(() => {});
  const taps = useRef<number[]>([]);
  const pinSource = useRef<Speech["source"] | null>(null);

  useEffect(() => {
    chatOpenRef.current = chatOpen;
    menuOpenRef.current = menuOpen;
    memoryOpenRef.current = memoryOpen;
    memoryRecordRef.current = memoryRecord;
    mutedRef.current = muted;
    speechRef.current = speech;
  });

  const speak = useCallback((mood: XiaomeiMood, text: string, source: Speech["source"]) => {
    pinSource.current = source;
    setMoodPin(mood);
    if (mutedRef.current) {
      setSpeech(null);
      return;
    }
    setSpeech({ text, mood, source });
  }, []);

  const onTap = useCallback(() => {
    if (chatOpenRef.current || menuOpenRef.current) return;
    const now = Date.now();
    taps.current = taps.current.filter((stamp) => now - stamp < SPAM_WINDOW_MS);
    taps.current.push(now);
    if (taps.current.length >= 4) {
      flashClickRef.current("annoyed");
      speak("annoyed", pickXiaomeiLine(XIAOMEI_SPAM_LINES, speechRef.current?.text), "spam");
      return;
    }
    const tone = toneFromAffection(metersRef.current.affection);
    const pool = isXiaomeiHungry(metersRef.current.fullness)
      ? [...XIAOMEI_HUNGRY_LINES, ...XIAOMEI_HUNGRY_LINES, ...XIAOMEI_CLICK_LINES]
      : XIAOMEI_CLICK_LINES;
    const line = pickTaggedLine(pool, speechRef.current?.text, tone);
    flashClickRef.current(line.mood);
    speak(line.mood, line.text, "click");
  }, [speak]);

  const openMenu = useCallback(() => {
    markHintSeen();
    setMemoryOpen(false);
    setMenuOpen(true);
  }, []);

  const place = useXiaomeiPlace({
    onTap,
    onHold: openMenu,
    onDragStart: () => setMenuOpen(false),
    allowPeek: !chatOpen && !menuOpen && !memoryOpen,
  });
  const presence = useXiaomeiPresence({
    enabled: place.ready && !place.hidden && !chatOpen && !menuOpen && !memoryOpen,
    hungry: isXiaomeiHungry(meters.meters.fullness),
    paused: () =>
      speechRef.current != null || chatOpenRef.current || menuOpenRef.current || memoryOpenRef.current,
  });
  const { clear } = presence;

  useEffect(() => {
    flashClickRef.current = presence.flashClick;
  });

  useEffect(() => {
    if (!place.ready || place.hidden || muted) return;
    const id = window.setTimeout(() => {
      if (chatOpenRef.current || mutedRef.current) return;
      const remembered = readXiaomeiMemory();
      const tone = toneFromAffection(metersRef.current.affection);
      if (remembered.topics.length > 0) {
        const mood: XiaomeiMood = tone === "guarded" ? "annoyed" : tone === "classic" ? "content" : "happy";
        const text = pickXiaomeiLine(XIAOMEI_RECALL_LINES[tone]);
        setSpeech((current) => current ?? { text, mood, source: "greet" });
        setMoodPin((current) => current ?? mood);
        return;
      }
      setSpeech((current) => current ?? { text: XIAOMEI_CATCHPHRASE, mood: "content", source: "greet" });
      setMoodPin((current) => current ?? "content");
    }, 900);
    return () => window.clearTimeout(id);
  }, [muted, place.hidden, place.ready]);

  useEffect(() => {
    if (!moodPin || speech?.source === "hover") return;
    const id = window.setTimeout(() => {
      pinSource.current = null;
      setSpeech(null);
      setMoodPin(null);
    }, 4800);
    return () => window.clearTimeout(id);
  }, [moodPin, speech]);

  useEffect(() => {
    const onSay = (event: Event) => {
      const detail = (event as CustomEvent<XiaomeiSayDetail>).detail;
      if (!detail || !isXiaomeiMood(detail.mood) || place.hidden) return;
      const text = (detail.text?.trim() || pickXiaomeiLine(XIAOMEI_LINES[detail.mood])).slice(0, 48);
      speak(detail.mood, text, "event");
      place.clearPeek();
    };
    window.addEventListener(XIAOMEI_SAY_EVENT, onSay);
    return () => window.removeEventListener(XIAOMEI_SAY_EVENT, onSay);
  }, [place, speak]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [menuOpen]);

  const closeChat = useCallback(() => {
    setChatOpen(false);
    chat.stop();
    chat.resetFace();
    spriteRef.current?.focus({ preventScroll: true });
  }, [chat]);

  useEffect(() => {
    if (!menuOpen && !chatOpen && !memoryOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (memoryOpenRef.current) {
        setMemoryOpen(false);
        spriteRef.current?.focus({ preventScroll: true });
        return;
      }
      if (chatOpenRef.current) {
        closeChat();
        return;
      }
      setMenuOpen(false);
      spriteRef.current?.focus({ preventScroll: true });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chatOpen, closeChat, memoryOpen, menuOpen]);

  const openChat = useCallback(() => {
    markHintSeen();
    setMenuOpen(false);
    setMemoryOpen(false);
    setSpeech(null);
    clear();
    place.clearPeek();
    setChatOpen(true);
  }, [clear, place]);

  const openMemory = useCallback(() => {
    const record = readXiaomeiMemory();
    memoryRecordRef.current = record;
    setMemoryRecord(record);
    setMenuOpen(false);
    setChatOpen(false);
    chat.stop();
    chat.resetFace();
    pinSource.current = null;
    setSpeech(null);
    setMoodPin(null);
    clear();
    place.clearPeek();
    setMemoryOpen(true);
  }, [chat, clear, place]);

  const forgetNote = useCallback((summary: string) => {
    if (forgetLock.current) return;
    forgetLock.current = true;
    try {
      const base = memoryRecordRef.current ?? readXiaomeiMemory();
      const next = forgetXiaomeiNote(base, summary);
      writeXiaomeiMemory(next);
      memoryRecordRef.current = next;
      setMemoryRecord(next);
    } finally {
      forgetLock.current = false;
    }
  }, []);

  const closeMemory = useCallback(() => {
    setMemoryOpen(false);
    spriteRef.current?.focus({ preventScroll: true });
  }, []);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    if (next) setSpeech(null);
    writeMuted(next);
    setMenuOpen(false);
  }, []);

  if (!place.ready) return null;

  if (place.hidden) {
    return (
      <button
        type="button"
        aria-label={`请${XIAOMEI_NAME}回来`}
        onClick={place.restore}
        className="fixed bottom-24 right-3 z-40 flex size-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40"
      >
        <span
          aria-hidden
          className="size-5 rounded-full bg-[radial-gradient(circle_at_35%_30%,#d7e2ff,#4d63d6_46%,#1b2454_80%)] shadow-[0_0_0_1px_rgba(255,255,255,0.35),0_0_14px_rgba(90,120,255,0.45)]"
        />
      </button>
    );
  }

  const chatCue = xiaomeiChatCue(chatOpen, chat.status, chat.replyMood);
  const face = resolveXiaomeiFace({
    chatOpen,
    status: chat.status,
    replyMood: chat.replyMood,
    speechMood: speech?.mood ?? null,
    moodPin,
    leadMood: presence.lead,
    beatMood: presence.beatMood,
    hover: hover && !memoryOpen,
  });
  const showSpeech = speech && !chatOpen && !menuOpen && !memoryOpen && !muted;
  const peekApplied = chatOpen || menuOpen || memoryOpen ? null : place.peek;
  const anchor = liveAnchorBox(place.pos, place.box, peekApplied);
  const innerWidth = typeof window === "undefined" ? 800 : window.innerWidth;
  const innerHeight = typeof window === "undefined" ? 800 : window.innerHeight;
  const visual =
    keyboardFrame.width > 0
      ? {
          offsetLeft: keyboardFrame.offsetLeft,
          offsetTop: keyboardFrame.offsetTop,
          width: keyboardFrame.width,
          height: keyboardFrame.height,
        }
      : typeof window !== "undefined" && window.visualViewport
        ? {
            offsetLeft: window.visualViewport.offsetLeft,
            offsetTop: window.visualViewport.offsetTop,
            width: window.visualViewport.width,
            height: window.visualViewport.height,
          }
        : null;
  const view = xiaomeiVisibleView({
    innerWidth,
    innerHeight,
    visual,
    safe: {
      top: keyboardFrame.safeTop,
      right: keyboardFrame.safeRight,
      bottom: keyboardFrame.safeBottom,
      left: keyboardFrame.safeLeft,
    },
  });
  const sheetWidth = Math.min(XIAOMEI_MEMORY_PANEL.width, Math.max(0, view.width - 32));
  const panel = menuOpen
    ? XIAOMEI_MENU_PANEL
    : memoryOpen
      ? { width: sheetWidth, height: XIAOMEI_MEMORY_PANEL.height }
      : chatOpen
        ? { width: sheetWidth, height: XIAOMEI_CHAT_PANEL.height }
        : showSpeech
          ? XIAOMEI_SPEECH_PANEL
          : XIAOMEI_HINT_PANEL;
  const pop = placeXiaomeiPopover({ anchor, view, panel });
  const align = pop.align;
  const placement = pop.placement;
  const roomAbove = Math.max(0, anchor.y - (view.top + view.safeTop + 8));
  const roomBelow = Math.max(0, view.top + view.height - view.safeBottom - 8 - anchor.y - anchor.height);
  const dock = dockXiaomeiChat({
    y: place.pos.y,
    boxHeight: place.box.height,
    placement,
    roomAbove,
    roomBelow,
    keyboardInset: chatOpen ? keyboardFrame.inset : 0,
    visibleTop: keyboardFrame.offsetTop || view.top,
    visibleHeight: keyboardFrame.height || view.height,
  });
  const showHint = !hintSeen && !chatOpen && !menuOpen && !memoryOpen && !muted && !showSpeech;
  const memoryView = memoryRecord ? memoryNotesForDrawer(memoryRecord) : { facts: [], events: [] };

  return (
    <div
      className="fixed z-40"
      style={{
        left: place.pos.x,
        width: place.box.width,
        height: place.box.height,
        ...(dock.lift ? { top: "auto", bottom: keyboardFrame.inset + 8 } : { top: place.pos.y }),
        transform: chatOpen || menuOpen || memoryOpen ? "translate3d(0, 0, 0)" : peekTransform(place.peek),
        transition: place.dragging ? "none" : "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
      onPointerEnter={() => {
        setHover(true);
        place.onEnter();
        if (!chatOpenRef.current && !menuOpenRef.current && !memoryOpenRef.current && !speechRef.current) {
          const tone = toneFromAffection(metersRef.current.affection);
          const line = pickTaggedLine(XIAOMEI_HOVER_LINES, speechRef.current?.text, tone);
          speak(line.mood, line.text, "hover");
        }
      }}
      onPointerLeave={() => {
        setHover(false);
        if (pinSource.current !== "hover") return;
        pinSource.current = null;
        setSpeech(null);
        setMoodPin(null);
      }}
    >
      {menuOpen ? (
        <XiaomeiMenu
          muted={muted}
          align={align}
          placement={placement}
          shiftX={pop.shiftX}
          shiftY={pop.shiftY}
          maxHeight={pop.maxHeight}
          onTalk={openChat}
          onMutter={() => {
            setMenuOpen(false);
            const tone = toneFromAffection(metersRef.current.affection);
            const line = pickTaggedLine(XIAOMEI_MUTTER_LINES, speechRef.current?.text, tone);
            speak(line.mood, line.text, "mutter");
          }}
          onFeed={() => {
            const result = meters.feed();
            if (!result) return;
            setMenuOpen(false);
            const pool = result.tooMuch
              ? XIAOMEI_FEED_TOO_MUCH_LINES
              : result.kind === "full"
                ? XIAOMEI_FEED_FULL_LINES
                : result.kind === "soft"
                  ? XIAOMEI_FEED_SOFT_LINES
                  : XIAOMEI_FEED_LINES;
            const mood = result.tooMuch || result.kind === "full" ? "annoyed" : result.kind === "soft" ? "content" : "happy";
            presence.playFeed(mood);
            speak(mood, pickXiaomeiLine(pool, speechRef.current?.text), "feed");
          }}
          onMute={toggleMute}
          onCorner={() => {
            place.resetCorner();
            setMenuOpen(false);
          }}
          onAbout={() => {
            setMenuOpen(false);
            speak("content", XIAOMEI_ABOUT, "about");
          }}
          onMemory={openMemory}
          onHide={() => {
            setMenuOpen(false);
            setMemoryOpen(false);
            setChatOpen(false);
            chat.stop();
            place.hide();
          }}
        />
      ) : null}

      {memoryOpen && memoryRecord ? (
        <XiaomeiMemorySheet
          facts={memoryView.facts}
          events={memoryView.events}
          align={align}
          placement={placement}
          shiftX={pop.shiftX}
          shiftY={pop.shiftY}
          maxHeight={pop.maxHeight}
          onForget={forgetNote}
          onClose={closeMemory}
        />
      ) : null}

      {chatOpen ? (
        <XiaomeiChatSheet
          messages={chat.messages}
          pending={chat.pending}
          sceneLine={chat.sceneLine}
          align={align}
          placement={dock.placement}
          maxHeight={dock.maxHeight}
          shiftX={pop.shiftX}
          onSend={chat.send}
          onRetry={chat.retry}
          onClose={closeChat}
        />
      ) : null}

      {showSpeech ? (
        <div
          role="status"
          className={cn(
            xiaomeiWhisperClass(
              "pointer-events-none absolute z-10 w-max max-w-[15rem] rounded-2xl px-3 py-2 text-[13px] leading-relaxed",
            ),
            align === "right" ? "right-0" : "left-0",
            placement === "up" ? "bottom-full mb-2" : "top-full mt-2",
          )}
          style={xiaomeiPopoverOffsetStyle(pop.shiftX, pop.shiftY)}
        >
          {speech.text}
        </div>
      ) : null}

      {showHint ? (
        <p
          className={cn(
            xiaomeiWhisperClass(
              "pointer-events-none absolute z-10 w-max rounded-2xl px-2.5 py-1 text-xs leading-relaxed",
            ),
            align === "right" ? "right-0" : "left-0",
            placement === "up" ? "bottom-full mb-2" : "top-full mt-2",
          )}
          style={xiaomeiPopoverOffsetStyle(pop.shiftX, pop.shiftY)}
        >
          {coarse ? XIAOMEI_LONG_PRESS_HINT : XIAOMEI_HOLD_HINT}
        </p>
      ) : null}

      <button
        ref={spriteRef}
        type="button"
        data-xiaomei-beat={presence.beat ?? "rest"}
        aria-label={`${XIAOMEI_NAME}。点一下听她说，长按打开菜单`}
        aria-expanded={chatOpen || menuOpen || memoryOpen}
        aria-haspopup="menu"
        aria-controls={chatOpen ? "xiaomei-chat" : memoryOpen ? "xiaomei-memory" : undefined}
        className="absolute inset-0 cursor-grab touch-none bg-transparent p-0 select-none active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40"
        {...place.spriteHandlers}
        onKeyDown={(event) => {
          if (event.key === "ContextMenu" || (event.key === "F10" && event.shiftKey)) {
            event.preventDefault();
            openMenu();
          }
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          if (event.button === 2 || event.ctrlKey) openMenu();
        }}
      >
        <XiaomeiStage
          mood={face}
          motionClass={
            chatCue
              ? xiaomeiMotionClass(chatCue, place.dragging)
              : xiaomeiMotionClass(presence.beat, place.dragging)
          }
          prop={xiaomeiPropKind(presence.beat)}
          cue={chatCue ?? xiaomeiCueKind(presence.beat)}
          liftShadow={!place.dragging}
        />
      </button>
    </div>
  );
}
