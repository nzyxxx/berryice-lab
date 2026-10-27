import { BentoDirection } from "@/components/preview/bento-direction";
import { SiteShell } from "@/components/lab/site-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "方向 A · 便当格",
  robots: { index: false, follow: false },
};

export default function PreviewAPage() {
  return (
    <SiteShell hideFooter>
      <BentoDirection />
    </SiteShell>
  );
}
