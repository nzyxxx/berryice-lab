"use client";

import SpotlightCard from "@/components/SpotlightCard";
import { glassSurfaceClass } from "@/components/uiverse/glass-surface";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import Link from "next/link";
import type { ReactNode } from "react";

export function GlassTile({
  href,
  title,
  description,
  icon,
  featured = false,
  delay = 0,
}: {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  featured?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 36, rotateX: 8 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "-48px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(featured && "sm:col-span-2")}
    >
      <SpotlightCard
        className="!h-full !rounded-2xl !border-0 !bg-transparent !p-0"
        spotlightColor="rgba(184, 212, 232, 0.22)"
      >
        <Link
          href={href}
          className={cn(
            glassSurfaceClass(),
            "group flex h-full min-h-[7.5rem] flex-col justify-between rounded-2xl p-5",
            featured && "min-h-[9.5rem] sm:p-6",
            "transition-transform duration-200 hover:-translate-y-0.5",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/30"
          )}
        >
          <span className="flex size-10 items-center justify-center rounded-xl border border-white/15 bg-lab-primary/10 text-lab-primary">
            {icon}
          </span>
          <span className="mt-6 block">
            <span
              className={cn(
                "block font-medium tracking-tight text-lab-ink",
                featured ? "text-xl md:text-2xl" : "text-[15px]"
              )}
            >
              {title}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-lab-ink-subtle md:text-sm">
              {description}
            </span>
          </span>
        </Link>
      </SpotlightCard>
    </motion.div>
  );
}
