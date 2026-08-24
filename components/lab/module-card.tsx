import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function ModuleCard({
  href,
  title,
  description,
  icon,
  badge,
  disabled,
}: {
  href?: string;
  title: string;
  description: string;
  icon: ReactNode;
  badge?: string;
  disabled?: boolean;
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg border border-lab-hairline bg-lab-primary/10 text-lg">
          {icon}
        </div>
        {!disabled && (
          <ArrowUpRight className="size-4 text-lab-ink-tertiary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-lab-primary" />
        )}
      </div>
      <div className="mt-5">
        <div className="flex items-center gap-2">
          <h3 className="text-[22px] font-medium tracking-tight text-lab-ink">{title}</h3>
          {badge && (
            <span className="rounded-md border border-lab-hairline bg-lab-surface-2 px-2 py-0.5 text-[11px] text-lab-ink-subtle">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-lab-ink-subtle">{description}</p>
      </div>
    </>
  );

  const className = cn(
    "group relative flex flex-col rounded-lg border border-lab-hairline bg-lab-surface-1/90 p-6 backdrop-blur-sm transition-colors card-glow-hover",
    disabled
      ? "cursor-not-allowed opacity-50"
      : "hover:border-lab-primary/30 hover:bg-lab-surface-2"
  );

  if (disabled || !href) {
    return <article className={className}>{inner}</article>;
  }

  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}

export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-lab-hairline bg-lab-surface-1 p-6 md:p-8",
        className
      )}
    >
      {children}
    </div>
  );
}
