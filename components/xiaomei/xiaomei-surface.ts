import { cn } from "@/lib/utils";

/**
 * 立绘旁边的字和菜单。
 * 比全站玻璃瓦片轻：低对比边，没有镜面高光，免得她变成一张白卡片。
 */
export function xiaomeiWhisperClass(className?: string) {
  return cn(
    "border border-white/[0.08] bg-lab-canvas/50 text-lab-ink backdrop-blur-md",
    "shadow-[0_16px_32px_-20px_rgba(0,0,0,0.72)]",
    className,
  );
}
