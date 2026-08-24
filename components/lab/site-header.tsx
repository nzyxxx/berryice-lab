"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader({
  backHref,
  backLabel = "返回",
}: {
  backHref?: string;
  backLabel?: string;
}) {
  const pathname = usePathname();
  const inDelta = pathname.startsWith("/delta-gun");

  return (
    <header className="sticky top-0 z-50 border-b border-lab-hairline/80 bg-lab-canvas/70 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-4">
          {backHref ? (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 px-2 text-lab-ink-subtle hover:bg-lab-surface-1 hover:text-lab-ink"
            >
              <Link href={backHref}>
                <ArrowLeft className="mr-1.5 size-4" />
                {backLabel}
              </Link>
            </Button>
          ) : (
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-md bg-lab-primary/15 text-xs font-bold text-lab-primary shadow-[0_0_20px_-4px_rgba(56,189,248,0.45)]">
                B
              </span>
              <span className="text-sm font-medium tracking-tight text-lab-ink">
                BerryIce<span className="text-lab-primary">.</span>Lab
              </span>
            </Link>
          )}
        </div>

        <nav className="hidden items-center gap-6 text-sm text-lab-ink-subtle sm:flex">
          <Link
            href="/"
            className={cn(
              "transition-colors hover:text-lab-ink",
              pathname === "/" && "text-lab-primary"
            )}
          >
            首页
          </Link>
          <Link
            href="/delta-gun"
            className={cn(
              "transition-colors hover:text-lab-ink",
              inDelta && "text-lab-primary"
            )}
          >
            改枪实验室
          </Link>
          <Link
            href="/delta-gun/community"
            className={cn(
              "transition-colors hover:text-lab-ink",
              pathname.startsWith("/delta-gun/community") && "text-lab-primary"
            )}
          >
            社区改枪码
          </Link>
        </nav>
      </div>
    </header>
  );
}
