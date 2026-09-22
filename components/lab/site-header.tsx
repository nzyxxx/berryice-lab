"use client";

import { MobileNav } from "@/components/lab/mobile-nav";
import { ThemeToggle } from "@/components/lab/theme-toggle";
import { Button } from "@/components/ui/button";
import { moduleLinks } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader({
  backHref,
  backLabel = "返回",
  minimal = false,
}: {
  backHref?: string;
  backLabel?: string;
  minimal?: boolean;
}) {
  const pathname = usePathname();
  const inDelta = pathname.startsWith("/delta-gun");
  const inModule = moduleLinks.some((m) => m.href !== "/delta-gun" && pathname.startsWith(m.href));
  const isHome = pathname === "/";
  const showBack = backHref || (!isHome && !minimal);
  const resolvedBackHref = backHref || "/";
  const resolvedLabel = backHref ? backLabel : "门户";

  // 吸顶条的 backdrop-filter 每一个滚动帧都要重算一次背后的内容，
  // 是全站最贵的一处模糊。iOS 27 的导航条本来就是薄玻璃：
  // 半径减半、saturate 补色、底缘一道暗边把它跟内容切开。
  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-white/[0.08] bg-lab-canvas/55",
        "backdrop-blur-lg backdrop-saturate-150",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_1px_0_rgba(0,0,0,0.45)]"
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          {showBack ? (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-11 px-2.5 text-lab-ink-subtle hover:bg-lab-surface-1 hover:text-lab-ink"
            >
              <Link href={resolvedBackHref}>
                <ArrowLeft className="mr-1.5 size-4" />
                {resolvedLabel}
              </Link>
            </Button>
          ) : (
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-full border border-white/15 bg-lab-primary/15 text-[11px] font-bold text-lab-primary">
                B
              </span>
              <span className="text-sm font-medium tracking-tight text-lab-ink">
                BerryIce<span className="text-lab-primary">.</span>Lab
              </span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] tracking-[0.12em] text-lab-ink-subtle uppercase sm:inline-flex">
            <Sparkles className="size-3 text-lab-primary" />
            宙斯之雨
          </span>
          {!minimal && (
            <nav className="hidden items-center gap-5 text-sm text-lab-ink-subtle md:flex">
              <Link
                href="/"
                className={cn(
                  "transition-colors hover:text-lab-ink",
                  pathname === "/" && "text-lab-primary"
                )}
              >
                门户
              </Link>
              <Link
                href="/delta-gun"
                className={cn(
                  "transition-colors hover:text-lab-ink",
                  (inDelta || pathname === "/delta-gun") && "text-lab-primary"
                )}
              >
                三角洲
              </Link>
              {moduleLinks
                .filter((m) => m.id !== "delta")
                .map((m) => (
                  <Link
                    key={m.id}
                    href={m.href}
                    className={cn(
                      "transition-colors hover:text-lab-ink",
                      pathname.startsWith(m.href) && "text-lab-primary"
                    )}
                  >
                    {m.title}
                  </Link>
                ))}
            </nav>
          )}
          <ThemeToggle />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
