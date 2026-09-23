import { glassSurfaceClass } from "@/components/uiverse/glass-surface";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * 内容还没有时的状态。
 *
 * 宁可空着也不要摆假数据：点不动的列表比空列表更伤 ——
 * 空列表只是「还没有」，假列表是「这站是坏的」。
 */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(glassSurfaceClass(), "rounded-2xl px-6 py-14 text-center", className)}>
      <p className="text-[15px] font-medium tracking-tight text-lab-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-lab-ink-subtle">
        {description}
      </p>
      {action ? <div className="mt-7 flex justify-center">{action}</div> : null}
    </div>
  );
}
