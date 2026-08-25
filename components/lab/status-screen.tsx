import { GlassRainSurface } from "@/components/atmosphere/glass-rain-surface";
import { SiteHeader } from "@/components/lab/site-header";
import { SiteShell } from "@/components/lab/site-shell";
import { glassSurfaceClass } from "@/components/uiverse/glass-surface";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** 404 与运行时报错共用的落地页，保持和站内一致的夜雨玻璃语言 */
export function StatusScreen({
  code,
  title,
  description,
  children,
}: {
  code: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <SiteShell>
      <SiteHeader minimal />
      <main
        id="main"
        className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 py-20 sm:px-6"
      >
        <div className={cn(glassSurfaceClass(), "relative rounded-3xl p-8 sm:p-12")}>
          <GlassRainSurface intensity={0.7} />

          <p className="relative text-[11px] font-medium uppercase tracking-[0.18em] text-lab-primary">
            {code}
          </p>
          <h1 className="relative mt-3 text-2xl font-semibold tracking-tight text-lab-ink sm:text-3xl">
            {title}
          </h1>
          <p className="relative mt-3 max-w-md text-sm leading-relaxed text-lab-ink-subtle">
            {description}
          </p>
          <div className="relative mt-8 flex flex-wrap gap-3">{children}</div>
        </div>
      </main>
    </SiteShell>
  );
}

export function StatusAction({
  children,
  onClick,
  href,
  variant = "ghost",
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "ghost";
}) {
  const className = cn(
    "inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm font-medium",
    "transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40",
    variant === "primary"
      ? "border-lab-primary/35 bg-lab-primary/12 text-lab-primary hover:bg-lab-primary/18"
      : "border-white/12 bg-white/5 text-lab-ink hover:bg-white/10"
  );

  if (href) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}
