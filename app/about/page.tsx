import { SectionZone } from "@/components/gallery/section-zone";
import { PageContainer } from "@/components/lab/page-container";
import { PageShell } from "@/components/lab/page-shell";
import { SocialIconRow } from "@/components/lab/social-icon-row";
import { glassSurfaceClass } from "@/components/uiverse/glass-surface";
import { now, nowUpdatedAt } from "@/lib/content/now";
import { profileConfig, socialLinks } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Mail, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "关于",
  description: "BerryIce 在做什么，以及怎么找到他。",
};

export default function AboutPage() {
  const { displayName, latinName, handle, tags, bio } = profileConfig;
  const kook = socialLinks.find((s) => s.id === "kook");
  const email = socialLinks.find((s) => s.id === "mail");
  const elsewhere = socialLinks.filter((s) => s.id !== "kook" && s.id !== "mail");

  // 渠道按环境变量配置，可能只有一个。只有一个时不开两列，
  // 否则卡片会孤零零挂在左半边，右边空一大块
  const channelCount = (kook ? 1 : 0) + (email ? 1 : 0);

  return (
    <PageShell>
      <PageContainer>
        <SectionZone index="01" label="Brief" title="关于" headingLevel="h1">
          <p className="max-w-xl text-lg leading-relaxed text-lab-ink">{bio}</p>
          <p className="mt-3 text-sm text-lab-ink-subtle">
            {displayName} · {latinName} · @{handle}
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-lab-ink-subtle"
              >
                {tag}
              </li>
            ))}
          </ul>
        </SectionZone>

        <SectionZone
          index="02"
          label="Now"
          title="现在"
          description={`最近更新 ${nowUpdatedAt}。`}
          className="mt-12"
        >
          <div className={cn(glassSurfaceClass(), "divide-y divide-white/[0.06] rounded-2xl")}>
            {now.map((entry) => {
              const body = (
                <>
                  <span className="w-20 shrink-0 text-xs text-lab-ink-tertiary">{entry.label}</span>
                  <span className="flex-1 text-[15px] text-lab-ink">{entry.value}</span>
                  {entry.href && (
                    <ArrowUpRight className="size-4 shrink-0 text-lab-ink-tertiary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-lab-primary" />
                  )}
                </>
              );

              const rowClass = "relative flex min-h-[3.25rem] items-center gap-4 px-5 py-3";

              return entry.href ? (
                <Link
                  key={entry.label + entry.value}
                  href={entry.href}
                  className={cn(
                    rowClass,
                    "group transition-colors hover:bg-white/[0.04]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-lab-primary/40"
                  )}
                >
                  {body}
                </Link>
              ) : (
                <div key={entry.label + entry.value} className={rowClass}>
                  {body}
                </div>
              );
            })}
          </div>
        </SectionZone>

        <SectionZone
          index="03"
          label="Contact"
          title="联系"
          // 邮箱走环境变量，没配就不会渲染卡片。文案跟着实际渠道走，
          // 别让说明里提到一个页面上根本不存在的入口
          description={email ? "Kook 最常用，邮件回复慢。" : "Kook 最常用。"}
          className="mt-12"
        >
          <div className={cn("grid grid-cols-1 gap-3", channelCount > 1 && "sm:grid-cols-2")}>
            {kook && (
              <Link
                href={kook.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "group flex min-h-[8rem] flex-col justify-between rounded-2xl p-5 backdrop-blur-md",
                  "border border-[#fb7185]/25 bg-[#fb7185]/10",
                  "transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-[#fb7185]/15",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/30"
                )}
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-[#fb7185]/20 text-[#fb7185]">
                  <MessageCircle className="size-5" />
                </span>
                <span className="mt-4 flex items-center gap-2 text-lg font-medium tracking-tight text-lab-ink">
                  {kook.label}
                  <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </Link>
            )}

            {email && (
              <Link
                href={email.href}
                className={cn(
                  glassSurfaceClass(),
                  "group flex min-h-[8rem] flex-col justify-between rounded-2xl p-5",
                  "transition-transform duration-200 hover:-translate-y-0.5",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/30"
                )}
              >
                <span className="relative flex size-10 items-center justify-center rounded-xl bg-lab-primary/10 text-lab-primary">
                  <Mail className="size-5" />
                </span>
                <span className="relative mt-4 flex items-center gap-2 text-lg font-medium tracking-tight text-lab-ink">
                  {email.label}
                  <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </Link>
            )}
          </div>
        </SectionZone>

        {elsewhere.length > 0 && (
          <SectionZone index="04" label="Elsewhere" className="mt-12">
            <SocialIconRow links={elsewhere} />
          </SectionZone>
        )}
      </PageContainer>
    </PageShell>
  );
}
