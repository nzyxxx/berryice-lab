"use client";

import { useTheme } from "@/components/lab/theme-provider";
import {
  dafeiyuHelperSrc,
  dafeiyuRestMargin,
  dafeiyuWorkArea,
  DAFEIYU_GEOMETRY_MESSAGE,
  DAFEIYU_SCHEME_MESSAGE,
  petSizeForStage,
} from "@/lib/dafeiyu/pet-size";
import { useEffect, useRef, useState } from "react";

/** 鱼脚下的一盏冷光和一道接触影。不是卡片，雨还能从透明处透出来。 */
const STAGE_WASH = [
  "radial-gradient(ellipse 42% 36% at 50% 74%, color-mix(in oklab, var(--lab-primary) 20%, transparent), transparent 70%)",
  "radial-gradient(ellipse 14% 4% at 50% 86%, color-mix(in oklab, black 28%, transparent), transparent 74%)",
].join(", ");

function postToFrame(frame: HTMLIFrameElement | null, data: unknown) {
  if (!frame?.contentWindow) return;
  frame.contentWindow.postMessage(data, window.location.origin);
}

export function DafeiyuStage() {
  const { theme } = useTheme();
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const petSizeRef = useRef<number | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const measure = () => {
      const width = Math.round(node.clientWidth);
      const height = Math.round(node.clientHeight);
      if (width < 64 || height < 64) return;
      const ratio = window.devicePixelRatio || 1;
      const scheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
      if (petSizeRef.current == null) petSizeRef.current = petSizeForStage(width, ratio);
      setSrc((current) => current ?? dafeiyuHelperSrc(window.location.origin, width, height, ratio, scheme));
      const rest = dafeiyuRestMargin(width, height, petSizeRef.current);
      postToFrame(frameRef.current, {
        type: DAFEIYU_GEOMETRY_MESSAGE,
        geo: dafeiyuWorkArea(width, height),
        rest,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    postToFrame(frameRef.current, { type: DAFEIYU_SCHEME_MESSAGE, scheme: theme });
  }, [theme, src]);

  return (
    <div ref={stageRef} className="relative min-h-[28rem] flex-1">
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: STAGE_WASH }} />
      {booted ? null : (
        <p className="pointer-events-none absolute left-6 top-6 z-20 text-sm text-lab-ink-subtle">大肥鱼正在进来。</p>
      )}
      {src ? (
        <iframe
          ref={frameRef}
          title="大肥鱼，可以拖拽"
          src={src}
          className="absolute inset-0 z-10 h-full w-full border-0 bg-transparent"
          style={{ background: "transparent", colorScheme: theme }}
          allow="autoplay"
          onLoad={() => {
            setBooted(true);
            const node = stageRef.current;
            if (!node) return;
            const width = Math.round(node.clientWidth);
            const height = Math.round(node.clientHeight);
            const size = petSizeRef.current ?? petSizeForStage(width, window.devicePixelRatio || 1);
            postToFrame(frameRef.current, {
              type: DAFEIYU_GEOMETRY_MESSAGE,
              geo: dafeiyuWorkArea(width, height),
              rest: dafeiyuRestMargin(width, height, size),
            });
            postToFrame(frameRef.current, {
              type: DAFEIYU_SCHEME_MESSAGE,
              scheme: document.documentElement.classList.contains("dark") ? "dark" : "light",
            });
          }}
        />
      ) : null}
    </div>
  );
}
