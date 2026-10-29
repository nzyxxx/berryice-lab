import { cn } from "@/lib/utils";

/**
 * 立绘旁边的字和菜单。
 * 全站玻璃瓦片有白边和镜面，贴在她身上会变成一张卡片。这里只留一层能读的暗底。
 */
export function xiaomeiWhisperClass(className?: string) {
  return cn(
    "bg-lab-canvas/58 text-lab-ink shadow-[0_16px_28px_-22px_rgba(0,0,0,0.8)] backdrop-blur-md",
    className,
  );
}
