import { WeaponPortrait } from "@/components/delta-gun/weapon-portrait";
import { WeaponStatsPanel } from "@/components/delta-gun/weapon-stats-panel";
import { Eyebrow } from "@/components/lab/eyebrow";
import { MotionReveal } from "@/components/lab/motion-reveal";
import { Panel } from "@/components/lab/module-card";
import { PageContainer } from "@/components/lab/page-container";
import { Button } from "@/components/ui/button";
import { getGunById, getGuns } from "@/lib/data/guns";
import { weaponTypeLabel } from "@/lib/delta-gun/weapon-utils";
import { ArrowLeft, Wrench } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  const guns = await getGuns();
  return guns.map((g) => ({ id: g.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const gun = await getGunById(id);
  if (!gun) return { title: "枪械不存在" };
  return {
    title: `${gun.name} · 枪械数据`,
    description: gun.description,
  };
}

export default async function GunDetailPage({ params }: PageProps) {
  const { id } = await params;
  const gun = await getGunById(id);
  if (!gun) notFound();

  return (
    <PageContainer>
      <MotionReveal>
        <Link
          href="/delta-gun/guns"
          className="mb-6 inline-flex items-center text-sm text-lab-ink-subtle hover:text-lab-primary"
        >
          <ArrowLeft className="mr-1.5 size-4" />
          返回枪械库
        </Link>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="flex shrink-0 flex-col items-center gap-4 lg:w-72">
            <div className="relative flex w-full max-w-xs items-center justify-center rounded-xl border border-lab-hairline bg-lab-canvas/60 p-8">
              {gun.imageUrl ? (
                <Image
                  src={gun.imageUrl}
                  alt={gun.name}
                  width={280}
                  height={120}
                  className="h-auto max-h-32 w-full object-contain"
                  unoptimized
                  priority
                />
              ) : (
                <WeaponPortrait
                  name={gun.name}
                  type={gun.type}
                  size="lg"
                  className="!size-28"
                />
              )}
            </div>
            <WeaponPortrait
              name={gun.name}
              type={gun.type}
              imageUrl={gun.thumbUrl}
              size="md"
              className="lg:hidden"
            />
          </div>

          <div className="min-w-0 flex-1">
            <Eyebrow>{weaponTypeLabel(gun.type)}</Eyebrow>
            <h1 className="text-display-section mt-2 text-lab-ink">{gun.name}</h1>
            <p className="mt-3 text-base leading-relaxed text-lab-ink-subtle">
              {gun.description}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="rounded-md bg-lab-primary text-lab-canvas hover:bg-lab-primary-hover">
                <Link href={`/delta-gun/guns/${gun.id}/loadout`}>
                  <Wrench className="mr-2 size-4" />
                  进入改枪台
                </Link>
              </Button>
              {gun.sourceUrl && (
                <Button asChild variant="outline" className="rounded-md border-lab-hairline">
                  <a href={gun.sourceUrl} target="_blank" rel="noopener noreferrer">
                    社区改枪码
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </MotionReveal>

      <Panel className="mt-10">
        <h2 className="text-lg font-medium text-lab-ink">基础数值</h2>
        <p className="mt-1 text-sm text-lab-ink-subtle">
          游戏内面板属性（伤害、操控、射程等），数值越高通常代表该项越强。
        </p>
        <div className="mt-6">
          {gun.stats ? (
            <WeaponStatsPanel stats={gun.stats} />
          ) : (
            <p className="text-sm text-lab-ink-tertiary">
              暂无该武器的详细数值，可点击「同步枪械数据」后重试。
            </p>
          )}
        </div>
      </Panel>
    </PageContainer>
  );
}
