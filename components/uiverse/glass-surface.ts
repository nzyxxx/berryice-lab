import { cn } from "@/lib/utils";

/**
 * Liquid Glass（iOS 27 口径）。
 *
 * iOS 26 那版玻璃是「厚磨砂」：大半径模糊 + 高亮描边。27 改了三件事，这里照抄：
 *
 * 1. 更通透 —— 模糊半径砍掉一半，靠 saturate 把通透后丢失的色彩补回来。
 *    顺带一提这是白拿的性能：backdrop-filter 的开销随模糊半径线性涨。
 * 2. 暗化边缘 —— 玻璃外圈加一道暗环。27 之前靠亮描边跟背景分离，
 *    背景一复杂就糊成一片；暗环是把玻璃从背景里「切」出来的那一刀。
 * 3. 镜面高光调亮 —— 顶缘那道亮线是「这是玻璃不是灰卡片」的主要线索，
 *    通透度提上去之后必须同步加亮，否则玻璃会读成一块脏塑料。
 */
export function glassSurfaceClass(className?: string) {
  return cn(
    "relative overflow-hidden backdrop-blur-md backdrop-saturate-150",
    "border border-white/30 bg-gradient-to-b from-white/[0.18] to-white/[0.06]",
    // 四层阴影，从外到内：暗边 → 顶部镜面高光 → 底部弱反光（给厚度）→ 落影
    "shadow-[0_0_0_1px_rgba(15,18,24,0.10),inset_0_1px_0_rgba(255,255,255,0.65),inset_0_-1px_0_rgba(255,255,255,0.22),0_12px_32px_-14px_rgba(15,18,24,0.30)]",
    "dark:border-white/[0.14] dark:from-white/[0.10] dark:to-white/[0.02]",
    "dark:shadow-[0_0_0_1px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.30),inset_0_-1px_0_rgba(255,255,255,0.07),0_12px_32px_-14px_rgba(0,0,0,0.65)]",
    "before:pointer-events-none before:absolute before:inset-x-5 before:top-0 before:h-px",
    "before:bg-gradient-to-r before:from-transparent before:via-white/80 before:to-transparent",
    "dark:before:via-white/55",
    className
  );
}
