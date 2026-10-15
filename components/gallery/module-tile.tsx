"use client";

import SpotlightCard from "@/components/SpotlightCard";
import { glassSurfaceClass } from "@/components/uiverse/glass-surface";
import { type ModuleId, moduleLinks } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Gamepad2, PenLine, UserRound, type LucideIcon } from "lucide-react";
import Link from "next/link";

const ICONS: Record<ModuleId, LucideIcon> = {
  delta: Gamepad2,
  writing: PenLine,
  about: UserRound,
};

export function ModuleTile({
  id,
  delay = 0,
  className,
}: {
  id: ModuleId;
  delay?: number;
  className?: string;
}) {
  const entry = moduleLinks.find((m) => m.id === id);
  if (!entry) return null;

  const Icon = ICONS[id];

  return (
    <div
      className={cn("h-full animate-tile-in", className)}
      style={{ animationDelay: `${delay}s` }}
    >
      <SpotlightCard
        className="!h-full !rounded-2xl !border-0 !bg-transparent !p-0"
        spotlightColor="rgba(184, 212, 232, 0.18)"
      >
        <Link
          href={entry.href}
          className={cn(
            glassSurfaceClass(),
            "group relative flex h-full min-h-[7.5rem] flex-col justify-between overflow-hidden rounded-2xl p-5",
            "transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-lab-primary/35",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40"
          )}
        >
          <span
            className="absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-30"
            style={{ backgroundColor: entry.accent }}
            aria-hidden
          />

          <span className="relative flex items-start justify-between gap-3">
            <span
              className="flex size-10 items-center justify-center rounded-xl border border-lab-hairline"
              style={{ backgroundColor: `${entry.accent}18`, color: entry.accent }}
            >
              <Icon className="size-5" />
            </span>
            <ArrowUpRight className="size-4 text-lab-ink-tertiary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-lab-ink" />
          </span>

          <span className="relative mt-5 block">
            <span className="block text-[15px] font-medium tracking-tight text-lab-ink">
              {entry.title}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-lab-ink-subtle">
              {entry.description}
            </span>
          </span>
        </Link>
      </SpotlightCard>
    </div>
  );
}
