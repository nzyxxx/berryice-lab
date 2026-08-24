import { GunsLibrary } from "@/components/delta-gun/guns-library";
import { Eyebrow } from "@/components/lab/eyebrow";
import { MotionReveal } from "@/components/lab/motion-reveal";
import { PageContainer } from "@/components/lab/page-container";
import { getGuns } from "@/lib/data/guns";

export default async function GunsPage() {
  const guns = await getGuns();

  return (
    <PageContainer>
      <MotionReveal>
        <Eyebrow>枪械库</Eyebrow>
        <h1 className="text-display-section mt-3 text-lab-ink">枪械库</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-lab-ink-subtle">
          收录三角洲行动 {guns.length} 把武器的基础数值与官方配图。点击卡片查看详细属性，或进入改枪台搭配配件与保存方案。
        </p>
      </MotionReveal>
      <GunsLibrary guns={guns} />
    </PageContainer>
  );
}
