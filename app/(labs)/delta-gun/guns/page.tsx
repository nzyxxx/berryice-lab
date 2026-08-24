import { GunsLibrary } from "@/components/delta-gun/guns-library";
import { SectionZone } from "@/components/gallery/section-zone";
import { PageContainer } from "@/components/lab/page-container";
import { getGuns } from "@/lib/data/guns";

export default async function GunsPage() {
  const guns = await getGuns();

  return (
    <PageContainer>
      <SectionZone
        index="01"
        label="Armory"
        title="枪械库"
        description={`收录三角洲行动 ${guns.length} 把武器。点卡片看属性，进改枪台配配件。`}
      >
        <GunsLibrary guns={guns} />
      </SectionZone>
    </PageContainer>
  );
}
