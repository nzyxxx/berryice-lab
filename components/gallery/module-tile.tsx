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
  const featured = entry.featured === true;

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
            "group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl",
            featured ? "min-h-[10rem] p-6" : "min-h-[7rem] p-5",
            "transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-white/20",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/30"
          )}
          style={{ borderColor: `${entry.accent}30` }}
        >
          <span
            className={cn(
              "absolute right-0 top-0 rounded-full blur-2xl transition-opacity",
              featured ? "h-40 w-40 opacity-25 group-hover:opacity-35" : "h-24 w-24 opacity-20 group-hover:opacity-30",
              "-translate-y-1/2 translate-x-1/2"
            )}
            style={{ backgroundColor: entry.accent }}
            aria-hidden
          />

          <span className="relative flex items-start justify-between gap-3">
            <span
              className={cn(
                "flex items-center justify-center rounded-xl border border-white/15",
                featured ? "size-12" : "size-10"
              )}
              style={{ backgroundColor: `${entry.accent}18`, color: entry.accent }}
            >
              <Icon className={featured ? "size-6" : "size-5"} />
            </span>
            {featured && (
              <ArrowUpRight className="size-5 text-lab-ink-tertiary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-lab-ink" />
            )}
          </span>

          <span className="relative mt-5 block">
            <span
              className={cn(
                "block font-medium tracking-tight text-lab-ink",
                featured ? "text-xl md:text-2xl" : "text-[15px]"
              )}
            >
              {entry.title}
            </span>
            <span
              className={cn(
                "mt-1 block leading-relaxed text-lab-ink-subtle",
                featured ? "max-w-md text-sm" : "text-xs"
              )}
            >
              {entry.description}
            </span>
          </span>
        </Link>
      </SpotlightCard>
    </div>
  );
}
