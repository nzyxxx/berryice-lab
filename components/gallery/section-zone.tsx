import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function SectionZone({
  index,
  label,
  title,
  description,
  children,
  className,
}: {
  index: string;
  label: string;
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative", className)}>
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-lab-primary">
        {index} / {label}
      </p>
      {title ? (
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-lab-ink md:text-2xl">
          {title}
        </h2>
      ) : null}
      {description ? (
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-lab-ink-subtle">{description}</p>
      ) : null}
      {children ? <div className={cn(title || description ? "mt-5" : "mt-4")}>{children}</div> : null}
    </section>
  );
}
