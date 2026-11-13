"use client";

import { MobileNav } from "@/components/lab/mobile-nav";
import { SupportButton } from "@/components/lab/support-button";
import { ThemeToggle } from "@/components/lab/theme-toggle";
import { headerNav, navIsCurrent, profileConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
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
  const showBack = Boolean(backHref && backHref !== "/" && backHref !== pathname);

  return (
    <header className="sticky top-0 z-50 border-b border-lab-hairline bg-lab-canvas/80 backdrop-blur-lg backdrop-saturate-150">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex min-h-11 items-baseline gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-lab-primary"
        >
          <span className="text-[15px] font-medium tracking-tight text-lab-ink">{profileConfig.displayName}</span>
          <span className="hidden text-xs text-lab-ink-subtle sm:inline">{profileConfig.latinName}</span>
        </Link>
        {showBack ? (
          <Link
            href={backHref!}
            className="inline-flex min-h-11 items-center text-sm text-lab-ink-subtle outline-none hover:text-lab-ink focus-visible:ring-2 focus-visible:ring-lab-primary"
          >
            {backLabel}
          </Link>
        ) : null}
        <div className="ml-auto flex items-center gap-1">
        {!minimal ? (
          <nav className="hidden items-center gap-1 lg:flex" aria-label="站点">
            {headerNav.map((item) => {
              const active = navIsCurrent(item.href, pathname);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center rounded-md px-2.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-lab-primary",
                    active ? "text-lab-primary" : "text-lab-ink-subtle hover:text-lab-ink"
                  )}
                >
                  {item.navLabel ?? item.title}
                </Link>
              );
            })}
          </nav>
        ) : null}
        <div className="flex items-center gap-1">
          <SupportButton />
          <ThemeToggle />
          {!minimal ? <MobileNav /> : null}
        </div>
        </div>
      </div>
    </header>
  );
}
