import { DashBoard } from "@/components/delta-gun/dash-board";
import { loadDashboard } from "@/lib/delta-gun/load-dashboard";

export const dynamic = "force-dynamic";

export default async function GunsPage() {
  const data = await loadDashboard();
  return <DashBoard data={data} title="枪械库" subtitle="点一张卡，右边是这把枪的属性和提示。" />;
}