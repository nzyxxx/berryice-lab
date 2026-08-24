import { AuroraBackground } from "@/components/lab/aurora-background";
import { SiteFooter } from "@/components/lab/site-footer";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type ShellVariant = "hub" | "delta";

export function SiteShell({
  children,
  variant = "hub",
  className,
  hideFooter,
}: {
  children: ReactNode;
  variant?: ShellVariant;
  className?: string;
  hideFooter?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-col overflow-x-hidden bg-lab-canvas text-lab-ink",
        className
      )}
    >
      <AuroraBackground variant={variant} />
      <div className="relative z-10 flex flex-1 flex-col">{children}</div>
      {!hideFooter && <SiteFooter />}
    </div>
  );
}
