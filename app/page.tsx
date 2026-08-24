import { HomeHero } from "@/components/lab/home-hero";
import {
  MotionHoverLift,
  MotionReveal,
  MotionStagger,
  MotionStaggerItem,
} from "@/components/lab/motion-reveal";
import { ModuleCard } from "@/components/lab/module-card";
import { PageContainer } from "@/components/lab/page-container";
import { SiteHeader } from "@/components/lab/site-header";
import { SiteShell } from "@/components/lab/site-shell";
import { Eyebrow } from "@/components/lab/eyebrow";
import { Gamepad2 } from "lucide-react";

export default function HomePage() {
  return (
    <SiteShell variant="hub">
      <SiteHeader />

      <HomeHero />

      <PageContainer className="!pt-0 !pb-16">
        <section className="relative">
          <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-lab-primary/50 to-transparent" />

          <MotionReveal>
            <Eyebrow>实验室</Eyebrow>
            <h2 className="text-display-section mt-4 text-lab-ink">模块</h2>
            <p className="mt-3 max-w-lg text-base text-lab-ink-subtle">
              目前已开放三角洲改枪实验室，后续会在这里继续加新玩法。
            </p>
          </MotionReveal>

          <MotionStagger className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            <MotionStaggerItem>
              <MotionHoverLift>
                <ModuleCard
                  href="/delta-gun"
                  title="三角洲改枪实验室"
                  description="枪械库、社区改枪码、我的枪码"
                  icon={<Gamepad2 className="size-5 text-lab-primary" />}
                />
              </MotionHoverLift>
            </MotionStaggerItem>
          </MotionStagger>
        </section>
      </PageContainer>
    </SiteShell>
  );
}
