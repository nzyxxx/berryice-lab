import { SectionZone } from "@/components/gallery/section-zone";
import { PageContainer } from "@/components/lab/page-container";
import { PageShell } from "@/components/lab/page-shell";
import { StickerStudio } from "@/components/stickers/sticker-studio";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "表情工坊",
  description: "小莓流冰的表情工坊。做成微信版，收进保险箱，挑几张上橱窗。",
};

export default function StickersPage() {
  return (
    <PageShell>
      <PageContainer>
        <SectionZone
          index="01"
          label="Kitchen"
          title="表情工坊"
          headingLevel="h1"
          description="方形、≤300KB，才能从文件传输助手加进微信表情栏。做完先进保险箱，对外只陈列橱窗里的那几张。"
        />
        <StickerStudio />
      </PageContainer>
    </PageShell>
  );
}
