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
                    "relative inline-flex min-h-11 items-center rounded-md px-2.5 text-sm outline-none transition-transform duration-200 active:translate-y-px motion-reduce:transition-none motion-reduce:active:translate-y-0 focus-visible:ring-2 focus-visible:ring-lab-primary",
                    "after:absolute after:inset-x-2.5 after:bottom-1.5 after:h-px after:origin-left after:bg-lab-primary after:transition-transform after:duration-200 motion-reduce:after:transition-none",
                    active
                      ? "text-lab-primary after:scale-x-100"
                      : "text-lab-ink-subtle after:scale-x-0 visited:text-lab-ink-subtle hover:text-lab-ink hover:after:scale-x-100 focus-visible:text-lab-ink focus-visible:after:scale-x-100"
                  )}
                >
                  {item.title}
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
