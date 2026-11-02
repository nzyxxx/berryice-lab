"use client";

import { dafeiyuHelperSrc, dafeiyuWorkArea, DAFEIYU_GEOMETRY_MESSAGE } from "@/lib/dafeiyu/pet-size";
import { useEffect, useRef, useState } from "react";

function postGeometry(frame: HTMLIFrameElement | null, width: number, height: number) {
  if (!frame?.contentWindow || width < 64 || height < 64) return;
  frame.contentWindow.postMessage(
    { type: DAFEIYU_GEOMETRY_MESSAGE, geo: dafeiyuWorkArea(width, height) },
    window.location.origin,
  );
}

export function DafeiyuStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const measure = () => {
      const width = Math.round(node.clientWidth);
      const height = Math.round(node.clientHeight);
      if (width < 64 || height < 64) return;
      setSrc((current) => current ?? dafeiyuHelperSrc(window.location.origin, width, height));
      postGeometry(frameRef.current, width, height);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={stageRef} className="relative min-h-[28rem] flex-1">
      {booted ? null : (
        <p className="pointer-events-none absolute left-4 top-4 text-sm text-lab-ink-subtle">大肥鱼正在进来。</p>
      )}
      {src ? (
        <iframe
          ref={frameRef}
          title="大肥鱼，可以拖拽"
          src={src}
          className="absolute inset-0 h-full w-full border-0 bg-transparent"
          style={{ background: "transparent" }}
          allow="autoplay"
          onLoad={() => {
            setBooted(true);
            const node = stageRef.current;
            if (!node) return;
            postGeometry(frameRef.current, Math.round(node.clientWidth), Math.round(node.clientHeight));
          }}
        />
      ) : null}
    </div>
  );
}
