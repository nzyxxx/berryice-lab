import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function SectionZone({
  index,
  label,
  title,
  description,
  children,
  className,
  headingLevel = "h2",
  titleClassName,
  descriptionClassName,
  hideKicker = false,
}: {
  index: string;
  label: string;
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  /** 每页的首个区块传 h1，其余保持 h2，保证标题层级只有一个顶点 */
  headingLevel?: "h1" | "h2";
  /** 覆盖标题字号。首页人名用 text-display-hero，其它页不要传 */
  titleClassName?: string;
  descriptionClassName?: string;
  hideKicker?: boolean;
}) {
  const Heading = headingLevel;

  return (
    <section className={cn("relative", className)}>
      {hideKicker ? null : (
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-lab-primary">
          {index} / {label}
        </p>
      )}
      {title ? (
        <Heading
          className={cn(
            "mt-2 font-semibold tracking-tight text-lab-ink",
            titleClassName ??
              (headingLevel === "h1" ? "text-2xl md:text-3xl" : "text-xl md:text-2xl")
          )}
        >
          {title}
        </Heading>
      ) : null}
      {description ? (
        <p className={descriptionClassName ?? "mt-1 max-w-xl text-sm leading-relaxed text-lab-ink-subtle"}>{description}</p>
      ) : null}
      {children ? <div className={cn(title || description ? "mt-5" : "mt-4")}>{children}</div> : null}
    </section>
  );
}
