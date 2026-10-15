import { ModuleTile } from "@/components/gallery/module-tile";
import { SectionZone } from "@/components/gallery/section-zone";
import { glassSurfaceClass } from "@/components/uiverse/glass-surface";
import { profileConfig, socialLinks } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Crosshair, Mic2, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";

/**
 * 首页上的三件工具。实验室导航里主播页叫「主播改枪」，
 * 这里用站主自己的叫法「主播配装」，链到同一条路由。
 * 橙色不进首页：DESIGN 里战术橙一出现，这个专栏就会变成整站。
 */
const LAB_LINKS: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    href: "/delta-gun/guns",
    title: "枪械库",
    description: "查武器、看属性，再进改枪台。",
    icon: Crosshair,
  },
  {
    href: "/delta-gun/community",
    title: "社区改枪码",
    description: "热门方案，搜索后可以导入。",
    icon: Users,
  },
  {
    href: "/delta-gun/streamers",
    title: "主播配装",
    description: "职业选手和主播的实战方案。",
    icon: Mic2,
  },
];

export function HomeFront() {
  const { displayName, latinName, handle, tags, bio } = profileConfig;
  const github = socialLinks.find((item) => item.id === "github");

  return (
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-6 md:py-16">
      <SectionZone
        index="01"
        label="Person"
        title={displayName}
        headingLevel="h1"
        titleClassName="text-display-hero"
      >
        <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-sm text-lab-ink-subtle">
          <span className="text-lab-ink-muted">{latinName}</span>
          <span aria-hidden className="text-lab-ink-tertiary">
            /
          </span>
          {github ? (
            <a
              href={github.href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-lab-hairline-strong underline-offset-4 transition-colors hover:text-lab-primary hover:decoration-lab-primary focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40"
            >
              @{handle}
              <span className="sr-only">（GitHub，新窗口）</span>
            </a>
          ) : (
            <span>@{handle}</span>
          )}
        </p>

        <p className="mt-5 max-w-xl text-lg leading-relaxed text-lab-ink">{bio}</p>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-lab-ink-muted">
          这里有写完的东西、还在记的笔记，以及我做的工具。
        </p>

        <ul className="mt-5 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-lab-hairline bg-lab-surface-1/80 px-2.5 py-1 text-[11px] text-lab-ink-subtle"
            >
              {tag}
            </li>
          ))}
        </ul>
      </SectionZone>

      <SectionZone index="02" label="Work" title="在写、在学" className="mt-14 md:mt-16">
        <div className="grid grid-cols-1 gap-3 [perspective:900px] sm:grid-cols-2">
          <ModuleTile id="writing" delay={0.04} />
          <ModuleTile id="about" delay={0.1} />
        </div>
      </SectionZone>

      <SectionZone
        index="03"
        label="Tools"
        title="三角洲工具"
        description="查枪、看社区码、看主播配装。"
        className="mt-14 md:mt-16"
      >
        <div
          className={cn(
            glassSurfaceClass(),
            "animate-tile-in divide-y divide-lab-hairline rounded-2xl"
          )}
          style={{ animationDelay: "0.14s" }}
        >
          {LAB_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex min-h-14 items-center gap-4 px-4 py-3.5 sm:px-5",
                  "transition-colors hover:bg-lab-primary/5",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-lab-primary/40"
                )}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-lab-hairline bg-lab-surface-2/80 text-lab-ink-subtle transition-colors group-hover:text-lab-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium tracking-tight text-lab-ink">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-lab-ink-subtle">
                    {item.description}
                  </span>
                </span>
                <ArrowUpRight className="size-4 shrink-0 text-lab-ink-tertiary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-lab-primary" />
              </Link>
            );
          })}
        </div>
      </SectionZone>

      <SectionZone index="04" label="Elsewhere" title="别处" className="mt-14 md:mt-16">
        <ul className="flex flex-wrap gap-2">
          {socialLinks.map((link) => {
            const external = link.href.startsWith("http");
            return (
              <li key={link.id}>
                <a
                  href={link.href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className={cn(
                    "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-lab-hairline bg-lab-surface-1/75 px-4 text-sm text-lab-ink",
                    "transition-[transform,border-color,color] duration-200 hover:-translate-y-0.5 hover:border-lab-primary/35 hover:text-lab-primary",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40"
                  )}
                >
                  {link.label}
                  {external ? <ArrowUpRight className="size-3.5" aria-hidden /> : null}
                  {external ? <span className="sr-only">（新窗口）</span> : null}
                </a>
              </li>
            );
          })}
        </ul>
      </SectionZone>
    </main>
  );
}
