import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** 原型里哪些是真跑、哪些是示意，就近说清楚。 */
export function PrototypeNote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-start gap-2 text-xs leading-relaxed text-lab-ink-subtle", className)}>
      <span className="mt-px shrink-0 rounded-full border border-lab-accent-glow/35 bg-lab-accent-glow/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-lab-accent-glow">
        原型
      </span>
      <span>{children}</span>
    </p>
  );
}
