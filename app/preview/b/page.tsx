import { EditorialDirection } from "@/components/preview/editorial-direction";
import { SiteShell } from "@/components/lab/site-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "方向 B · 编辑",
  robots: { index: false, follow: false },
};

export default function PreviewBPage() {
  return (
    <SiteShell hideFooter>
      <EditorialDirection />
    </SiteShell>
  );
}
