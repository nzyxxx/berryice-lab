"use client";

import { trapTab } from "@/components/xiaomei/trap-tab";
import { xiaomeiWhisperClass } from "@/components/xiaomei/xiaomei-surface";
import { XIAOMEI_NAME } from "@/lib/xiaomei-lines";
import { xiaomeiPopoverOffsetStyle } from "@/lib/xiaomei-place";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

const ITEM =
  "flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm text-lab-ink hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40";

/** 小莓菜单。长按立绘或右键打开。只抛动作，不自己改位置、不写存储、不去请求。 */
export function XiaomeiMenu({
  muted,
  align,
  placement,
  shiftX = 0,
  shiftY = 0,
  maxHeight,
  onTalk,
  onMutter,
  onFeed,
  onMute,
  onCorner,
  onAbout,
  onMemory,
  onHide,
}: {
  muted: boolean;
  align: "left" | "right";
  placement: "up" | "down";
  shiftX?: number;
  shiftY?: number;
  maxHeight?: number;
  onTalk: () => void;
  onMutter: () => void;
  onFeed: () => void;
  onMute: () => void;
  onCorner: () => void;
  onAbout: () => void;
  onMemory: () => void;
  onHide: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.querySelector<HTMLElement>("[role='menuitem']")?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => trapTab(event, root);
    root.addEventListener("keydown", onKey);
    return () => root.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      ref={rootRef}
      role="menu"
      aria-label={XIAOMEI_NAME}
      className={cn(
        xiaomeiWhisperClass("overflow-y-auto backdrop-blur-md"),
        "absolute z-20 w-52 rounded-2xl p-1.5",
        "max-h-[min(24rem,calc(100dvh-5rem))]",
        align === "right" ? "right-0" : "left-0",
        placement === "up" ? "bottom-full mb-2" : "top-full mt-2",
      )}
      style={xiaomeiPopoverOffsetStyle(shiftX, shiftY, maxHeight)}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <button type="button" role="menuitem" className={ITEM} onClick={onTalk}>
        <span className="flex flex-col items-start py-1">
          <span>跟她说话</span>
          <span className="text-[11px] leading-4 text-lab-ink-subtle">会真的回你</span>
        </span>
      </button>
      <button type="button" role="menuitem" className={ITEM} onClick={onMutter}>
        让{XIAOMEI_NAME}说点什么
      </button>
      <button type="button" role="menuitem" className={ITEM} onClick={onFeed}>
        喂食
      </button>
      <button type="button" role="menuitem" className={ITEM} onClick={onMute}>
        {muted ? "取消静音" : "静音"}
      </button>
      <button type="button" role="menuitem" className={ITEM} onClick={onCorner}>
        回到角落
      </button>
      <button type="button" role="menuitem" className={ITEM} onClick={onAbout}>
        关于{XIAOMEI_NAME}
      </button>
      <button type="button" role="menuitem" className={ITEM} onClick={onMemory}>
        她记住了什么
      </button>
      <button type="button" role="menuitem" className={ITEM} onClick={onHide}>
        收起
      </button>
    </div>
  );
}
