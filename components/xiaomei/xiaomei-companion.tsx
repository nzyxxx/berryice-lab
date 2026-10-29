"use client";

import { XiaomeiChatSheet } from "@/components/xiaomei/xiaomei-chat-sheet";
import { XiaomeiMenu } from "@/components/xiaomei/xiaomei-menu";
import { useXiaomeiChat } from "@/components/xiaomei/use-xiaomei-chat";
import { useXiaomeiMeters } from "@/components/xiaomei/use-xiaomei-meters";
import { useXiaomeiPlace } from "@/components/xiaomei/use-xiaomei-place";
import {
  XIAOMEI_ABOUT,
  XIAOMEI_CATCHPHRASE,
  XIAOMEI_HOLD_HINT,
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
  XIAOMEI_SPRITE,
  isXiaomeiMood,
  moodForChatStatus,
  pickTaggedLine,
  pickXiaomeiLine,
  type XiaomeiMood,
  type XiaomeiSayDetail,
} from "@/lib/xiaomei-lines";
import { isXiaomeiHungry, readXiaomeiMemory, toneFromAffection } from "@/lib/xiaomei-memory";
import { XIAOMEI_METERS_KEY, formatMeterDelta, readFeedClock } from "@/lib/xiaomei-meters";
import { dockXiaomeiChat, peekTransform } from "@/lib/xiaomei-place";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

type Speech = {
  text: string;
  mood: XiaomeiMood;
  source: "greet" | "hover" | "click" | "event" | "about" | "spam" | "mutter" | "feed";
  delta: string | null;
};
type Gesture = "glance" | "smile";

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

function useKeyboardFrame(active: boolean) {
  const [frame, setFrame] = useState({ inset: 0, height: 0, offsetTop: 0 });
  useEffect(() => {
    if (!active) return;
    const read = () => {
      const viewport = window.visualViewport;
      const height = viewport?.height ?? window.innerHeight;
      const offsetTop = viewport?.offsetTop ?? 0;
      const inset = Math.max(0, Math.round(window.innerHeight - height - offsetTop));
      setFrame((prev) =>
        prev.inset === inset && prev.height === height && prev.offsetTop === offsetTop
          ? prev
          : { inset, height, offsetTop },
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
      setFrame({ inset: 0, height: 0, offsetTop: 0 });
    };
  }, [active]);
  return frame;
}

/**
 * 全站右下角的小莓妹。拖拽用指针事件，待机和左右看只用 CSS，不留 rAF。
 * z-40：低于弹层（门户 z-50）、回到顶部（z-60）和移动抽屉（z-70）。
 * 点击从本地池里随机回一句；和模型说话从菜单「跟她说话」进。
 */
export function XiaomeiCompanion() {
  const meters = useXiaomeiMeters();
  const metersRef = useRef(meters.meters);
  metersRef.current = meters.meters;
  const warmRef = useRef(meters.warm);
  warmRef.current = meters.warm;
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
  const keyboardFrame = useKeyboardFrame(chatOpen);
  const [menuOpen, setMenuOpen] = useState(false);
  const muted = useSyncExternalStore(subscribeMute, readMuted, () => false);
  const [speech, setSpeech] = useState<Speech | null>(null);
  const [moodPin, setMoodPin] = useState<XiaomeiMood | null>(null);
  const [hover, setHover] = useState(false);
  const [gesture, setGesture] = useState<Gesture | null>(null);

  const chatOpenRef = useRef(false);
  const menuOpenRef = useRef(false);
  const spriteRef = useRef<HTMLButtonElement>(null);
  const mutedRef = useRef(false);
  const speechRef = useRef<Speech | null>(null);
  const taps = useRef<number[]>([]);
  const pinSource = useRef<Speech["source"] | null>(null);

  useEffect(() => {
    chatOpenRef.current = chatOpen;
    menuOpenRef.current = menuOpen;
    mutedRef.current = muted;
    speechRef.current = speech;
  });

  const speak = useCallback(
    (mood: XiaomeiMood, text: string, source: Speech["source"], delta?: { fullness: number; affection: number }) => {
      pinSource.current = source;
      setMoodPin(mood);
      if (mutedRef.current) {
        setSpeech(null);
        return;
      }
      setSpeech({
        text,
        mood,
        source,
        delta: delta ? formatMeterDelta(delta.fullness, delta.affection) : null,
      });
    },
    [],
  );

  const onTap = useCallback(() => {
    if (chatOpenRef.current || menuOpenRef.current) return;
    const now = Date.now();
    taps.current = taps.current.filter((stamp) => now - stamp < SPAM_WINDOW_MS);
    taps.current.push(now);
    if (taps.current.length >= 4) {
      speak("annoyed", pickXiaomeiLine(XIAOMEI_SPAM_LINES, speechRef.current?.text), "spam");
      return;
    }
    const tone = toneFromAffection(metersRef.current.affection);
    const pool = isXiaomeiHungry(metersRef.current.fullness)
      ? [...XIAOMEI_HUNGRY_LINES, ...XIAOMEI_HUNGRY_LINES, ...XIAOMEI_CLICK_LINES]
      : XIAOMEI_CLICK_LINES;
    const line = pickTaggedLine(pool, speechRef.current?.text, tone);
    speak(line.mood, line.text, "click");
  }, [speak]);

  const openMenu = useCallback(() => {
    markHintSeen();
    setMenuOpen(true);
  }, []);

  const place = useXiaomeiPlace({
    onTap,
    onHold: openMenu,
    onDragStart: () => setMenuOpen(false),
    allowPeek: !chatOpen && !menuOpen,
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
        setSpeech((current) => current ?? { text, mood, source: "greet", delta: null });
        setMoodPin((current) => current ?? mood);
        return;
      }
      setSpeech((current) => current ?? { text: XIAOMEI_CATCHPHRASE, mood: "content", source: "greet", delta: null });
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
    if (!place.ready || place.hidden) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    let timer = 0;
    let clearGesture = 0;
    const loop = () => {
      timer = window.setTimeout(() => {
        if (cancelled) return;
        if (!chatOpenRef.current && !menuOpenRef.current && !speechRef.current) {
          setGesture(Math.random() < 0.5 ? "glance" : "smile");
          clearGesture = window.setTimeout(() => setGesture(null), 1600);
        }
        loop();
      }, 9000 + Math.random() * 5000);
    };
    loop();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.clearTimeout(clearGesture);
    };
  }, [place.hidden, place.ready]);

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
    if (!menuOpen && !chatOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (chatOpenRef.current) {
        closeChat();
        return;
      }
      setMenuOpen(false);
      spriteRef.current?.focus({ preventScroll: true });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chatOpen, closeChat, menuOpen]);

  const openChat = useCallback(() => {
    markHintSeen();
    setMenuOpen(false);
    setSpeech(null);
    setGesture(null);
    place.clearPeek();
    setChatOpen(true);
  }, [place]);

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

  const face = faceFor({
    chatOpen,
    status: chat.status,
    replyMood: chat.replyMood,
    speech,
    moodPin,
    hover,
    gesture,
  });
  const showSpeech = speech && !chatOpen && !menuOpen && !muted;
  const align = place.pos.x > 160 ? "right" : "left";
  const placement = place.pos.y > 220 ? "up" : "down";
  const roomAbove = place.pos.y - 64;
  const roomBelow =
    (typeof window === "undefined" ? 800 : window.innerHeight) - place.pos.y - place.box.height - 96;
  const dock = dockXiaomeiChat({
    y: place.pos.y,
    boxHeight: place.box.height,
    placement,
    roomAbove,
    roomBelow,
    keyboardInset: chatOpen ? keyboardFrame.inset : 0,
    visibleTop: keyboardFrame.offsetTop,
    visibleHeight: keyboardFrame.height,
  });
  const showHint = !hintSeen && !chatOpen && !menuOpen && !muted && !showSpeech;

  return (
    <div
      className="fixed z-40"
      style={{
        left: place.pos.x,
        width: place.box.width,
        height: place.box.height,
        ...(dock.lift ? { top: "auto", bottom: keyboardFrame.inset + 8 } : { top: place.pos.y }),
        transform: chatOpen || menuOpen ? "translate3d(0, 0, 0)" : peekTransform(place.peek),
        transition: place.dragging ? "none" : "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
      onPointerEnter={() => {
        setHover(true);
        place.onEnter();
        if (!chatOpenRef.current && !menuOpenRef.current && !speechRef.current) {
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
          fullness={meters.meters.fullness}
          affection={meters.meters.affection}
          onTalk={openChat}
          onMutter={() => {
            setMenuOpen(false);
            const tone = toneFromAffection(metersRef.current.affection);
            const line = pickTaggedLine(XIAOMEI_MUTTER_LINES, speechRef.current?.text, tone);
            speak(line.mood, line.text, "mutter");
          }}
          onFeed={() => {
            const before = metersRef.current;
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
            speak(mood, pickXiaomeiLine(pool, speechRef.current?.text), "feed", {
              fullness: result.meters.fullness - before.fullness,
              affection: result.meters.affection - before.affection,
            });
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
          onHide={() => {
            setMenuOpen(false);
            setChatOpen(false);
            chat.stop();
            place.hide();
          }}
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
          onSend={chat.send}
          onRetry={chat.retry}
          onClose={closeChat}
        />
      ) : null}

      {showSpeech ? (
        <div
          role="status"
          className={cn(
            "pointer-events-none absolute z-10 w-max max-w-[15rem] rounded-2xl border border-white/15",
            "bg-lab-canvas/75 px-3 py-2 text-[13px] leading-relaxed text-lab-ink backdrop-blur-md",
            align === "right" ? "right-0" : "left-0",
            placement === "up" ? "bottom-full mb-2" : "top-full mt-2",
          )}
        >
          {speech.text}
          {speech.delta ? (
            <span className="mt-1 block text-[11px] tabular-nums text-lab-ink-subtle">{speech.delta}</span>
          ) : null}
          <span
            aria-hidden
            className={cn(
              "absolute size-2.5 rotate-45 border-white/15 bg-lab-canvas/80",
              placement === "up" ? "-bottom-1 border-b border-r" : "-top-1 border-l border-t",
              align === "right" ? "right-4" : "left-4",
            )}
          />
        </div>
      ) : null}

      {showHint ? (
        <p
          className={cn(
            "pointer-events-none absolute z-10 w-max rounded-full border border-white/15 bg-lab-canvas/80 px-3 py-1.5 text-xs text-lab-ink backdrop-blur-md",
            align === "right" ? "right-0" : "left-0",
            placement === "up" ? "bottom-full mb-2" : "top-full mt-2",
          )}
        >
          {XIAOMEI_HOLD_HINT}
        </p>
      ) : null}

      <button
        ref={spriteRef}
        type="button"
        aria-label={`${XIAOMEI_NAME}。点一下听她说，长按打开菜单`}
        aria-expanded={chatOpen || menuOpen}
        aria-haspopup="menu"
        aria-controls={chatOpen ? "xiaomei-chat" : undefined}
        className="absolute inset-0 cursor-grab touch-none bg-transparent p-0 select-none active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40"
        {...place.spriteHandlers}
        onContextMenu={(event) => {
          event.preventDefault();
          openMenu();
        }}
      >
        <Image
          src={XIAOMEI_SPRITE[face]}
          alt=""
          width={256}
          height={351}
          unoptimized
          draggable={false}
          className={cn(
            "pointer-events-none h-full w-full object-contain [filter:drop-shadow(0_0_1px_rgba(255,255,255,0.55))_drop-shadow(0_2px_5px_rgba(0,0,0,0.45))]",
            gesture === "glance" && !place.dragging ? "xiaomei-glance" : !place.dragging && "xiaomei-float",
          )}
        />
      </button>
    </div>
  );
}

function faceFor(input: {
  chatOpen: boolean;
  status: "idle" | "thinking" | "done" | "error";
  replyMood: "happy" | "annoyed";
  speech: Speech | null;
  moodPin: XiaomeiMood | null;
  hover: boolean;
  gesture: Gesture | null;
}): XiaomeiMood {
  if (input.chatOpen && input.status !== "idle") return moodForChatStatus(input.status, input.replyMood);
  if (input.chatOpen) return "content";
  if (input.speech) return input.speech.mood;
  if (input.moodPin) return input.moodPin;
  if (input.gesture === "glance") return "blank";
  if (input.gesture === "smile") return "happy";
  if (input.hover && !input.chatOpen) return "annoyed";
  return "content";
}
