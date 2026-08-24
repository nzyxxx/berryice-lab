import { SectionZone } from "@/components/gallery/section-zone";
import { GlassTile } from "@/components/gallery/glass-tile";
import { PageContainer } from "@/components/lab/page-container";
import { SocialIconRow } from "@/components/lab/social-icon-row";
import { socialLinks } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { Mail, MessageCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  const kook = socialLinks.find((s) => s.id === "kook");
  const email = socialLinks.find((s) => s.id === "mail");

  return (
    <PageContainer>
      <SectionZone
        index="01"
        label="Brief"
        title="联系"
        description="Kook 最常用。邮件回复慢。"
      />

      <SectionZone index="02" label="Channels" className="mt-12">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {kook && (
            <Link
              href={kook.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "group flex flex-col justify-between rounded-2xl border border-[#fb7185]/25 bg-[#fb7185]/10 p-5 backdrop-blur-md",
                "min-h-[8rem] transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-[#fb7185]/15"
              )}
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#fb7185]/20 text-[#fb7185]">
                <MessageCircle className="size-5" />
              </span>
              <span className="mt-4 block">
                <span className="flex items-center gap-2 text-lg font-medium tracking-tight text-lab-ink">
                  {kook.label}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </span>
            </Link>
          )}

          {email && (
            <Link
              href={email.href}
              className={cn(
                "group flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md",
                "min-h-[8rem] transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
              )}
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-lab-primary/10 text-lab-primary">
                <Mail className="size-5" />
              </span>
              <span className="mt-4 block">
                <span className="flex items-center gap-2 text-lg font-medium tracking-tight text-lab-ink">
                  {email.label}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </span>
            </Link>
          )}
        </div>
      </SectionZone>

      <SectionZone index="03" label="Elsewhere" className="mt-12">
        <SocialIconRow links={socialLinks.filter((s) => s.id !== "kook" && s.id !== "mail")} />
      </SectionZone>
    </PageContainer>
  );
}
