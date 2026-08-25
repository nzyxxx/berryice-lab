"use client";

import { prefersReducedMotion, registerGlassSurface } from "@/lib/atmosphere/glass-rain-engine";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

/**
 * 贴在玻璃卡片上的水珠层。必须放在卡片的第一个子节点位置：
 * 后面那些 relative 的图标和文字会按 DOM 顺序盖在它上面，文字才不会被水珠糊住。
 * 宿主元素需要是 relative + overflow-hidden，圆角裁切交给宿主。
 */
export function GlassRainSurface({
  intensity = 1,
  className,
}: {
  intensity?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    if (prefersReducedMotion()) return;

    return registerGlassSurface(canvas, host, intensity);
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
    />
  );
}
