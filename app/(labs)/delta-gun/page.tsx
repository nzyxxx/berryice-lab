import { CommunityCodesPreview } from "@/components/delta-gun/community-codes-preview";
import { Eyebrow } from "@/components/lab/eyebrow";
import {
  MotionGlowOrb,
  MotionHoverLift,
  MotionReveal,
  MotionStagger,
  MotionStaggerItem,
} from "@/components/lab/motion-reveal";
import { ModuleCard } from "@/components/lab/module-card";
import { PageContainer } from "@/components/lab/page-container";
import { DELTA_NAV } from "@/lib/delta-gun/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DeltaGunLabPage() {
  const quickLinks = DELTA_NAV.filter((item) => item.href !== "/delta-gun");

  return (
    <PageContainer>
      <section className="relative mb-16 overflow-hidden">
        <MotionGlowOrb className="right-0 top-0 size-72 bg-lab-primary/20" />
        <MotionGlowOrb className="-left-20 top-32 size-56 bg-lab-accent-glow/15" />

        <MotionReveal>
          <Eyebrow>三角洲改枪</Eyebrow>
          <h1 className="text-display-hero mt-4 max-w-3xl text-lab-ink">
            改枪<span className="text-gradient-hero">实验室</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-lab-ink-subtle">
            挑枪、配配件、抄社区枪码、保存自己的方案。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              className="rounded-md bg-lab-primary text-lab-canvas hover:bg-lab-primary-hover btn-glow"
            >
              <Link href="/delta-gun/community">
                社区改枪码
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-md border-lab-hairline bg-lab-surface-1"
            >
              <Link href="/delta-gun/guns">枪械库</Link>
            </Button>
          </div>
        </MotionReveal>
      </section>

      <MotionStagger className="mb-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((item) => (
          <MotionStaggerItem key={item.href}>
            <MotionHoverLift>
              <ModuleCard
                href={item.href}
                title={item.label}
                description={item.description}
                icon={<item.icon className="size-5 text-lab-primary" />}
              />
            </MotionHoverLift>
          </MotionStaggerItem>
        ))}
      </MotionStagger>

      <section className="border-t border-lab-hairline pt-12">
        <MotionReveal>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-lab-ink">热门改枪码</h2>
              <p className="mt-1 text-sm text-lab-ink-subtle">大战场 / 烽火地带分区展示，更多去社区页</p>
            </div>
            <Link
              href="/delta-gun/community"
              className="shrink-0 text-sm text-lab-primary hover:underline"
            >
              查看全部 →
            </Link>
          </div>
        </MotionReveal>
        <CommunityCodesPreview limit={6} />
      </section>
    </PageContainer>
  );
}
