"use client";

import { DELTA_NAV, isDeltaNavActive } from "@/lib/delta-gun/navigation";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function DeltaSubNav() {
  const pathname = usePathname();

  return (
    <div className="sticky top-14 z-40 border-b border-lab-hairline bg-lab-canvas/90 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <nav
          className="flex gap-1 overflow-x-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="改枪实验室导航"
        >
          {DELTA_NAV.map((item) => {
            const active = isDeltaNavActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-lab-ink"
                    : "text-lab-ink-subtle hover:bg-lab-surface-1 hover:text-lab-ink"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="delta-subnav-pill"
                    className="absolute inset-0 rounded-md border border-lab-primary/30 bg-lab-surface-2"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon className={cn("relative z-10 size-4", active && "text-lab-primary")} />
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
