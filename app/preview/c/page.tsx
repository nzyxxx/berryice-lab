import { GalleryDirection } from "@/components/preview/gallery-direction";
import { SiteShell } from "@/components/lab/site-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "方向 C · 画廊",
  robots: { index: false, follow: false },
};

export default function PreviewCPage() {
  return (
    <SiteShell hideFooter>
      <GalleryDirection />
    </SiteShell>
  );
}
