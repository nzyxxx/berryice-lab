"use client";

import { XiaomeiChatSheet } from "@/components/xiaomei/xiaomei-chat-sheet";
import { XiaomeiMenu } from "@/components/xiaomei/xiaomei-menu";
import { useXiaomeiChat } from "@/components/xiaomei/use-xiaomei-chat";
import { useXiaomeiPlace } from "@/components/xiaomei/use-xiaomei-place";
import {
  XIAOMEI_ABOUT,
  XIAOMEI_CATCHPHRASE,
  XIAOMEI_HOVER_LINES,
  XIAOMEI_LINES,
  XIAOMEI_SAY_EVENT,
  XIAOMEI_SPAM_LINES,
  XIAOMEI_SPRITE,
  isXiaomeiMood,
  pickXiaomeiLine,
  type XiaomeiMood,
  type XiaomeiSayDetail,
} from "@/lib/xiaomei-lines";
import { peekTransform } from "@/lib/xiaomei-place";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

type Speech = { text: string; mood: XiaomeiMood; source: "greet" | "hover" | "click" | "event" | "about" | "spam" };
type Gesture = "glance" | "smile";

const MUTE_KEY = "berryice.xiaomei.muted";
const MUTE_EVENT = "xiaomei-mute";
const SPAM_WINDOW_MS = 2400;
const CLICK_MOODS: XiaomeiMood[] = ["annoyed", "content", "happy"];

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

/**
 * 全站右下角的小莓。拖拽用指针事件，待机和左右看只用 CSS，不留 rAF。
 * z-40：低于弹层（门户 z-50）、回到顶部（z-60）和移动抽屉（z-70）。
 * 点击只回一句本地台词；和模型说话从菜单「对话」进。
 */
export function XiaomeiCompanion() {
  const chat = useXiaomeiChat();
  const [chatOpen, setChatOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const muted = useSyncExternalStore(subscribeMute, readMuted, () => false);
  const [speech, setSpeech] = useState<Speech | null>(null);
  const [moodPin, setMoodPin] = useState<XiaomeiMood | null>(null);
  const [hover, setHover] = useState(false);
  const [gesture, setGesture] = useState<Gesture | null>(null);

  const chatOpenRef = useRef(false);
  const menuOpenRef = useRef(false);
  const mutedRef = useRef(false);
  const speechRef = useRef<Speech | null>(null);
  const taps = useRef<number[]>([]);
  const clickCursor = useRef(0);
  const pinSource = useRef<Speech["source"] | null>(null);

  useEffect(() => {
    chatOpenRef.current = chatOpen;
    menuOpenRef.current = menuOpen;
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
    const now = Date.now();
    taps.current = taps.current.filter((stamp) => now - stamp < SPAM_WINDOW_MS);
    taps.current.push(now);
    if (taps.current.length >= 4) {
      speak("annoyed", pickXiaomeiLine(XIAOMEI_SPAM_LINES, speechRef.current?.text), "spam");
      return;
    }
    const mood = CLICK_MOODS[clickCursor.current % CLICK_MOODS.length] ?? "annoyed";
    clickCursor.current += 1;
    const pool = mood === "annoyed" ? XIAOMEI_HOVER_LINES : XIAOMEI_LINES[mood];
    speak(mood, pickXiaomeiLine(pool, speechRef.current?.text), "click");
  }, [speak]);

  const openMenu = useCallback(() => {
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
  }, [chat]);

  const openChat = useCallback(() => {
    setMenuOpen(false);
    setSpeech(null);
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
        aria-label="请小莓回来"
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
  const maxHeight = Math.max(160, Math.min(260, placement === "up" ? roomAbove : roomBelow));

  return (
    <div
      className="fixed z-40"
      style={{
        left: place.pos.x,
        top: place.pos.y,
        width: place.box.width,
        height: place.box.height,
        transform: chatOpen || menuOpen ? "translate3d(0, 0, 0)" : peekTransform(place.peek),
        transition: place.dragging ? "none" : "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
      onPointerEnter={() => {
        setHover(true);
        place.onEnter();
        if (!chatOpenRef.current && !menuOpenRef.current && !speechRef.current) {
          speak("annoyed", pickXiaomeiLine(XIAOMEI_HOVER_LINES), "hover");
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
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[18%] -z-10 size-16 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_40%_35%,rgba(166,186,255,0.55),rgba(63,84,196,0.22)_42%,rgba(28,36,88,0)_72%)]"
      />

      {menuOpen ? (
        <XiaomeiMenu
          muted={muted}
          align={align}
          placement={placement}
          onTalk={openChat}
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
          align={align}
          placement={placement}
          maxHeight={maxHeight}
          onSend={chat.send}
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

      <button
        type="button"
        aria-label="小莓"
        aria-expanded={chatOpen || menuOpen}
        aria-haspopup="menu"
        aria-controls={chatOpen ? "xiaomei-chat" : undefined}
        className="absolute inset-0 cursor-grab touch-none bg-transparent p-0 select-none active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40"
        {...place.spriteHandlers}
        onContextMenu={(event) => {
          event.preventDefault();
          setMenuOpen(true);
        }}
      >
        <Image
          src={XIAOMEI_SPRITE[face]}
          alt=""
          width={256}
          height={351}
          draggable={false}
          className={cn(
            "pointer-events-none h-full w-full object-contain",
            gesture === "glance" && !place.dragging ? "xiaomei-glance" : !place.dragging && "xiaomei-float",
          )}
        />
      </button>

      <button
        type="button"
        aria-label="收起小莓"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => {
          setChatOpen(false);
          chat.stop();
          place.hide();
        }}
        className="absolute -right-3 -top-3 z-10 flex size-11 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40"
      >
        <span className="flex size-5 items-center justify-center rounded-full border border-white/20 bg-lab-canvas/80 text-lab-ink-subtle backdrop-blur-md">
          <X className="size-3" />
        </span>
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
  if (input.chatOpen && input.status === "thinking") return "blank";
  if (input.chatOpen && input.status === "error") return "annoyed";
  if (input.chatOpen && input.status === "done") return input.replyMood;
  if (input.speech) return input.speech.mood;
  if (input.moodPin) return input.moodPin;
  if (input.gesture === "glance") return "blank";
  if (input.gesture === "smile") return "happy";
  if (input.hover && !input.chatOpen) return "annoyed";
  return "content";
}
