import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Aura.build 视觉语言：玻璃面板 + 背后光晕层次 */
export function GlowPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative isolate", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-6 h-40 w-56 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.28),rgba(167,139,250,0.12)_45%,transparent_70%)] blur-2xl dark:bg-[radial-gradient(circle,rgba(56,189,248,0.22),rgba(167,139,250,0.16)_45%,transparent_70%)]"
      />
      <div className="relative">{children}</div>
    </div>
  );
}
