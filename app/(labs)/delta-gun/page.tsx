import { DashBoard } from "@/components/delta-gun/dash-board";
import { loadDashboard } from "@/lib/delta-gun/load-dashboard";

export const dynamic = "force-dynamic";

export default async function DeltaGunLabPage() {
  const data = await loadDashboard();
  return <DashBoard data={data} title="总览" subtitle="本季的枪、码和主播。过季方案默认不出现。" />;
}
