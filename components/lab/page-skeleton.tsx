import { cn } from "@/lib/utils";

/** 骨架屏：用玻璃瓦片的轮廓占位，避免加载时页面高度塌陷再弹回 */
export function PageSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-24 pt-10 md:pt-14" aria-busy="true" aria-live="polite">
      <span className="sr-only">正在加载</span>

      <div className="h-3 w-24 animate-pulse rounded-full bg-white/8" />
      <div className="mt-3 h-7 w-56 animate-pulse rounded-lg bg-white/8" />
      <div className="mt-3 h-4 w-full max-w-md animate-pulse rounded-full bg-white/5" />

      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-32 animate-pulse rounded-2xl border border-white/8 bg-white/[0.03]",
              // 错开节奏，整片同步呼吸看起来很假
              index % 3 === 1 && "[animation-delay:120ms]",
              index % 3 === 2 && "[animation-delay:240ms]"
            )}
          />
        ))}
      </div>
    </div>
  );
}
