import { OceanDive } from "@/components/preview/ocean-dive";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "流冰入海",
  robots: { index: false, follow: false },
};

export default function OceanPreviewPage() {
  return <OceanDive />;
}
