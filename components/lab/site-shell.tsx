import { SiteFooter } from "@/components/lab/site-footer";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * 只负责页面骨架。雨幕、闪电、点击脉冲、滚动辅助已上提到根布局，
 * 挂在这里会跟着页面一起卸载重建。
 */
export function SiteShell({
  children,
  className,
  hideFooter,
}: {
  children: ReactNode;
  className?: string;
  hideFooter?: boolean;
}) {
  return (
    <div
      className={cn(
        // 这里不能再铺 bg-lab-canvas：气候层在 DOM 里排在前面，
        // 一层不透明底色会把雨整个盖掉。底色由 body 提供。
        "relative flex min-h-screen flex-col overflow-x-hidden text-lab-ink",
        className
      )}
    >
      <a
        href="#main"
        className={cn(
          "sr-only z-[80] focus:not-sr-only focus:fixed focus:left-4 focus:top-4",
          "focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-full",
          "focus:border focus:border-lab-primary/35 focus:bg-lab-canvas focus:px-5",
          "focus:text-sm focus:text-lab-primary focus:outline-none"
        )}
      >
        跳到主内容
      </a>
      <div className="relative z-10 flex flex-1 flex-col">{children}</div>
      {!hideFooter && <SiteFooter />}
    </div>
  );
}
