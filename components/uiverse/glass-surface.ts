import { cn } from "@/lib/utils";

/** Uiverse.io 玻璃拟态：内高光 + 毛玻璃 + 细描边 */
export function glassSurfaceClass(className?: string) {
  return cn(
    "relative overflow-hidden backdrop-blur-xl",
    "border border-white/25 bg-gradient-to-br from-white/20 to-white/5",
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_10px_28px_-12px_rgba(15,18,24,0.28)]",
    "dark:border-white/10 dark:from-white/10 dark:to-white/[0.03]",
    "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_10px_28px_-12px_rgba(0,0,0,0.55)]",
    "before:pointer-events-none before:absolute before:inset-x-4 before:top-0 before:h-px",
    "before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent",
    className
  );
}
