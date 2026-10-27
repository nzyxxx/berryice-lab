import { OwnerLoadouts } from "@/components/delta-gun/owner-loadouts";
import { PageContainer } from "@/components/lab/page-container";
import { getGuns } from "@/lib/data/guns";

export default async function MyLoadoutsPage() {
  const guns = await getGuns();
  const weapons = guns
    .map((gun) => ({ id: gun.id, name: gun.name }))
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));

  return (
    <PageContainer className="!pt-8">
      <OwnerLoadouts weapons={weapons} />
    </PageContainer>
  );
}
