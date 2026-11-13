"use client";

import { CharacterSwitch } from "@/components/dafeiyu/character-switch";
import { useTheme } from "@/components/lab/theme-provider";
import { parseLabCharacterId, parseLabCharacterSearch, type LabCharacterId } from "@/lib/dafeiyu/characters";
import {
  dafeiyuHelperSrc,
  dafeiyuRestMargin,
  dafeiyuWorkArea,
  DAFEIYU_GEOMETRY_MESSAGE,
  DAFEIYU_SCHEME_MESSAGE,
  petSizeForStage,
} from "@/lib/dafeiyu/pet-size";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/** 角色脚下的一盏冷光和一道接触影。不是卡片，雨还能从透明处透出来。 */
const STAGE_WASH = [
  "radial-gradient(ellipse 42% 36% at 50% 74%, color-mix(in oklab, var(--lab-primary) 20%, transparent), transparent 70%)",
  "radial-gradient(ellipse 14% 4% at 50% 86%, color-mix(in oklab, black 28%, transparent), transparent 74%)",
].join(", ");

const SWITCH_HOLD_MS = 8000;

function postToFrame(frame: HTMLIFrameElement | null, data: unknown) {
  if (!frame?.contentWindow) return;
  frame.contentWindow.postMessage(data, window.location.origin);
}

function writeCharacterSearch(id: LabCharacterId) {
  const url = new URL(window.location.href);
  if (id === "dafeiyu") url.searchParams.delete("character");
  else url.searchParams.set("character", id);
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

const characterListeners = new Set<() => void>();

function subscribeCharacter(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  characterListeners.add(onStoreChange);
  window.addEventListener("popstate", onStoreChange);
  return () => {
    characterListeners.delete(onStoreChange);
    window.removeEventListener("popstate", onStoreChange);
  };
}

function notifyCharacter() {
  characterListeners.forEach((listener) => listener());
}

function characterSnapshot(): LabCharacterId | null {
  return parseLabCharacterSearch(window.location.search);
}

function characterServerSnapshot(): LabCharacterId | null {
  return null;
}

export function DafeiyuStage({ xiaomeiReady }: { xiaomeiReady: boolean }) {
  const { theme } = useTheme();
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const petSizeRef = useRef<number | null>(null);
  const resolvedCharacter = useSyncExternalStore(subscribeCharacter, characterSnapshot, characterServerSnapshot);
  const characterId: LabCharacterId = resolvedCharacter ?? "dafeiyu";
  const ready = resolvedCharacter !== null;
  const characterRef = useRef<LabCharacterId>(characterId);
  const [src, setSrc] = useState<string | null>(null);
  const [booted, setBooted] = useState(false);
  const locked = !ready || !src || !booted;

  useEffect(() => {
    characterRef.current = characterId;
  }, [characterId]);

  useEffect(() => {
    if (!ready) return;
    const raw = new URLSearchParams(window.location.search).get("character");
    if (raw && raw !== parseLabCharacterId(raw)) writeCharacterSearch("dafeiyu");
  }, [ready]);

  useEffect(() => {
    if (booted) return;
    const timer = window.setTimeout(() => setBooted(true), SWITCH_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [booted, characterId]);

  useEffect(() => {
    if (!ready) return;
    const node = stageRef.current;
    if (!node) return;
    const measure = (): {
      width: number;
      height: number;
      ratio: number;
      scheme: "dark" | "light";
    } | null => {
      const width = Math.round(node.clientWidth);
      const height = Math.round(node.clientHeight);
      if (width < 64 || height < 64) return null;
      const ratio = window.devicePixelRatio || 1;
      const scheme = (
        document.documentElement.classList.contains("dark") ? "dark" : "light"
      ) satisfies "dark" | "light";
      if (petSizeRef.current == null) petSizeRef.current = petSizeForStage(width, ratio);
      return { width, height, ratio, scheme };
    };
    const box = measure();
    if (box) {
      setSrc(dafeiyuHelperSrc(window.location.origin, box.width, box.height, box.ratio, box.scheme, characterId));
    } else {
      setSrc((current) => {
        if (!current) return current;
        const url = new URL(current, window.location.origin);
        url.searchParams.set("character", characterId);
        const next = `${url.pathname}?${url.searchParams.toString()}`;
        return next === current ? current : next;
      });
    }
    const observer = new ResizeObserver(() => {
      const next = measure();
      if (!next) return;
      const size = petSizeRef.current ?? petSizeForStage(next.width, next.ratio);
      postToFrame(frameRef.current, {
        type: DAFEIYU_GEOMETRY_MESSAGE,
        geo: dafeiyuWorkArea(next.width, next.height),
        rest: dafeiyuRestMargin(next.width, next.height, size),
      });
      setSrc((current) => current ?? dafeiyuHelperSrc(window.location.origin, next.width, next.height, next.ratio, next.scheme, characterId));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ready, characterId]);

  useEffect(() => {
    postToFrame(frameRef.current, { type: DAFEIYU_SCHEME_MESSAGE, scheme: theme });
  }, [theme, src]);

  function select(next: LabCharacterId) {
    if (locked || next === characterId) return;
    characterRef.current = next;
    writeCharacterSearch(next);
    setBooted(false);
    notifyCharacter();
  }

  function publishFrame(frame: HTMLIFrameElement) {
    const loaded = new URL(frame.src, window.location.origin).searchParams.get("character");
    if (loaded !== characterRef.current) return;
    setBooted(true);
    const node = stageRef.current;
    if (!node) return;
    const width = Math.round(node.clientWidth);
    const height = Math.round(node.clientHeight);
    const size = petSizeRef.current ?? petSizeForStage(width, window.devicePixelRatio || 1);
    postToFrame(frame, {
      type: DAFEIYU_GEOMETRY_MESSAGE,
      geo: dafeiyuWorkArea(width, height),
      rest: dafeiyuRestMargin(width, height, size),
    });
    postToFrame(frame, {
      type: DAFEIYU_SCHEME_MESSAGE,
      scheme: document.documentElement.classList.contains("dark") ? "dark" : "light",
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div data-character={characterId} className="mx-auto flex w-full max-w-6xl px-4 pb-2 sm:px-6">
        <CharacterSwitch characterId={characterId} locked={locked} xiaomeiReady={xiaomeiReady} onSelect={select} />
      </div>
      <div ref={stageRef} className="relative min-h-[28rem] flex-1">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: STAGE_WASH }} />
        {ready && !booted ? (
          <p className="pointer-events-none absolute left-6 top-6 z-20 text-sm text-lab-ink-subtle">
            {characterId === "xiaomei" ? (xiaomeiReady ? "小莓正在进来。" : "小莓的空槽正在打开。") : "大肥鱼正在进来。"}
          </p>
        ) : null}
        {src ? (
          <iframe
            key={characterId}
            ref={frameRef}
            title={characterId === "xiaomei" ? (xiaomeiReady ? "小莓，可以拖拽" : "小莓，空包占位") : "大肥鱼，可以拖拽"}
            src={src}
            className="absolute inset-0 z-10 h-full w-full border-0 bg-transparent"
            style={{ background: "transparent", colorScheme: theme }}
            allow="autoplay"
            onLoad={(event) => publishFrame(event.currentTarget)}
          />
        ) : null}
      </div>
    </div>
  );
}
