import { CommunityCodesPreview } from "@/components/delta-gun/community-codes-preview";
import { GlassTile } from "@/components/gallery/glass-tile";
import { SectionZone } from "@/components/gallery/section-zone";
import { MotionReveal } from "@/components/lab/motion-reveal";
import { PageContainer } from "@/components/lab/page-container";
import { DELTA_NAV } from "@/lib/delta-gun/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DeltaGunLabPage() {
  const missions = DELTA_NAV.filter((item) => item.href !== "/delta-gun");

  return (
    <PageContainer>
      <SectionZone index="01" label="Brief">
        <MotionReveal>
          <h1 className="text-display-hero mt-2 max-w-3xl text-lab-ink">
            改枪<span className="text-gradient-hero">实验室</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-lab-ink-subtle">
            夜雨下的工作台：挑枪、配配件、抄社区枪码、保存自己的方案。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              className="rounded-md bg-lab-primary text-lab-canvas hover:bg-lab-primary-hover btn-glow"
            >
              <Link href="/delta-gun/community">
                进入社区改枪码
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </MotionReveal>
      </SectionZone>

      <SectionZone
        index="02"
        label="Missions"
        title="任务"
        description="四块玻璃瓦片，对应四条主路径。"
        className="mt-16"
      >
        <div className="grid grid-cols-1 gap-3 [perspective:900px] sm:grid-cols-2 lg:grid-cols-4">
          {missions.map((item, index) => (
            <GlassTile
              key={item.href}
              href={item.href}
              title={item.label}
              description={item.description}
              icon={<item.icon className="size-5" />}
              delay={index * 0.08}
            />
          ))}
        </div>
      </SectionZone>

      <SectionZone
        index="03"
        label="Feed"
        title="热门改枪码"
        description="大战场 / 烽火地带分区，完整列表在社区页。"
        className="mt-16"
      >
        <div className="mb-4 flex justify-end">
          <Link href="/delta-gun/community" className="text-sm text-lab-primary hover:underline">
            查看全部 →
          </Link>
        </div>
        <CommunityCodesPreview limit={6} />
      </SectionZone>
    </PageContainer>
  );
}
