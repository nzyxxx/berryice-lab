"use client";

import SpotlightCard from "@/components/SpotlightCard";
import { glassSurfaceClass } from "@/components/uiverse/glass-surface";
import { type ModuleId, moduleLinks } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { BookText, Gamepad2, Headphones, MessageCircle, Pencil, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

const ICONS: Record<ModuleId, LucideIcon> = {
  delta: Gamepad2,
  music: Headphones,
  articles: BookText,
  notes: Pencil,
  contact: MessageCircle,
};

export function ModuleTile({ id, delay = 0 }: { id: ModuleId; delay?: number }) {
  const module = moduleLinks.find((m) => m.id === id);
  if (!module) return null;

  const Icon = ICONS[id];

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, rotateX: 6 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "-48px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <SpotlightCard
        className="!h-full !rounded-2xl !border-0 !bg-transparent !p-0"
        spotlightColor="rgba(184, 212, 232, 0.18)"
      >
        <Link
          href={module.href}
          className={cn(
            glassSurfaceClass(),
            "group relative flex h-full min-h-[7rem] flex-col justify-between overflow-hidden rounded-2xl p-5",
            "transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-white/20",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/30"
          )}
          style={{ borderColor: `${module.accent}30` }}
        >
          <span
            className="absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-30"
            style={{ backgroundColor: module.accent }}
            aria-hidden
          />
          <span
            className="relative flex size-10 items-center justify-center rounded-xl border border-white/15"
            style={{ backgroundColor: `${module.accent}18`, color: module.accent }}
          >
            <Icon className="size-5" />
          </span>
          <span className="relative mt-5 block">
            <span className="block text-[15px] font-medium tracking-tight text-lab-ink">
              {module.title}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-lab-ink-subtle">
              {module.description}
            </span>
          </span>
        </Link>
      </SpotlightCard>
    </motion.div>
  );
}
