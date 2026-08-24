"use client";

import { MotionReveal } from "@/components/lab/motion-reveal";
import { siteConfig } from "@/lib/site-config";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { ArrowRight, ChevronDown, Sparkles } from "lucide-react";
import Link from "next/link";

export function HomeHero() {
  return (
    <section className="relative flex min-h-[88vh] flex-col justify-center pb-16 pt-8 md:min-h-[92vh]">
      <motion.div
        className="pointer-events-none absolute right-[8%] top-[18%] hidden h-28 w-44 rounded-lg border border-lab-hairline bg-lab-surface-1/80 p-4 backdrop-blur-xl lg:block"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <p className="text-[10px] uppercase tracking-wider text-lab-primary">社区</p>
        <p className="mt-2 text-sm font-medium text-lab-ink">改枪码同步</p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-lab-surface-3">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-lab-primary to-lab-accent-glow"
            animate={{ width: ["30%", "85%", "50%"] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        </div>
      </motion.div>

      <div className="relative mx-auto max-w-4xl text-center">
        <MotionReveal>
          <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-lab-primary/25 bg-lab-surface-1/80 px-4 py-2 text-sm text-lab-ink-muted backdrop-blur-md">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-lab-primary opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-lab-primary" />
            </span>
            <Sparkles className="size-4 text-lab-primary" />
            {siteConfig.tagline}
          </div>
        </MotionReveal>

        <MotionReveal delay={0.08}>
          <h1 className="text-display-hero">
            <span className="text-gradient-hero">{siteConfig.name}</span>
          </h1>
        </MotionReveal>

        <MotionReveal delay={0.14}>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-lab-ink-subtle md:text-xl">
            我的学习与实验空间，目前主打三角洲改枪：查枪械、抄社区枪码、保存自己的配置。
          </p>
        </MotionReveal>

        <MotionReveal delay={0.2}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className={cn(
                "h-12 rounded-lg bg-lab-primary px-8 text-base font-medium text-lab-canvas",
                "hover:bg-lab-primary-hover btn-glow"
              )}
            >
              <Link href="/delta-gun">
                进入改枪实验室
                <ArrowRight className="ml-2 size-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-lg border-lab-hairline bg-lab-surface-1/60 px-8 text-base backdrop-blur-sm hover:bg-lab-surface-2"
            >
              <Link href="/delta-gun/community">社区改枪码</Link>
            </Button>
          </div>
        </MotionReveal>

        <motion.div
          className="mt-16 flex justify-center"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        >
          <ChevronDown className="size-6 text-lab-ink-tertiary" aria-hidden />
        </motion.div>
      </div>
    </section>
  );
}
