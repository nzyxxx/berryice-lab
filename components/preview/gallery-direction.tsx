import { HalftoneMark } from "@/components/lab/halftone-mark";
import { PreviewLegal } from "@/components/preview/preview-legal";
import { PreviewSwitch } from "@/components/preview/preview-switch";
import { ThemeToggle } from "@/components/lab/theme-toggle";
import { homeIntro, homeModules, type HomeModule } from "@/lib/content/home-modules";
import { profileConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

function Row({ module, index }: { module: HomeModule; index: number }) {
  const entries = module.entries ?? [];
  const href = module.href && entries.length === 0 ? module.href : undefined;
  const number = String(index + 1).padStart(2, "0");

  const body = (
    <>
      <span className="w-8 shrink-0 font-mono text-[11px] tracking-[0.14em] text-lab-ink-tertiary">{number}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-lg font-medium tracking-tight text-lab-ink">{module.title}</span>
          {module.badge ? (
            <span className="shrink-0 rounded-full border border-lab-hairline px-2 py-0.5 text-[11px] text-lab-ink-subtle">
              {module.badge}
            </span>
          ) : null}
        </span>
        {module.description ? (
          <span className="mt-1 block text-sm leading-relaxed text-lab-ink-subtle">{module.description}</span>
        ) : null}
        {entries.length > 0 ? (
          <span className="mt-3 block border-t border-lab-hairline pt-3">
            {entries.map((entry) =>
              entry.href ? (
                <Link
                  key={entry.title}
                  href={entry.href}
                  className="flex min-h-11 flex-col items-start gap-1 text-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-lab-ink/30 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                >
                  <span className="font-medium text-lab-ink">{entry.title}</span>
                  <span className="text-lab-ink-subtle">{entry.description}</span>
                </Link>
              ) : (
                <span key={entry.title} className="flex min-h-11 items-baseline justify-between gap-4 text-sm">
                  <span className="text-lab-ink">{entry.title}</span>
                  <span className="text-lab-ink-subtle">{entry.description}</span>
                </span>
              )
            )}
          </span>
        ) : null}
      </span>
      {href ? (
        <ArrowUpRight className="mt-1 size-4 shrink-0 text-lab-ink-tertiary transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      ) : (
        <span className="size-4 shrink-0" aria-hidden />
      )}
    </>
  );

  const className = cn(
    "group flex items-start gap-4 border-b border-lab-hairline px-2 py-5",
    "transition-colors duration-200 hover:bg-lab-surface-1 dark:hover:bg-lab-surface-2",
    href && "outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-lab-ink/30"
  );

  if (href) {
    return (
      <li>
        <Link href={href} className={className}>
          {body}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <article className={className}>{body}</article>
    </li>
  );
}

export function GalleryDirection() {
  const { displayName, latinName } = profileConfig;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-lab-hairline bg-lab-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-4 px-5 sm:px-6">
          <Link href="/" className="text-sm font-medium tracking-tight text-lab-ink">
            {displayName}
          </Link>
          <div className="flex items-center gap-2">
            <PreviewSwitch current="c" className="hidden sm:flex" />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-5 py-16 sm:px-6 md:py-24">
        <div className="sm:hidden">
          <PreviewSwitch current="c" />
        </div>
        <div className="mt-2 flex items-center gap-5 sm:mt-0">
          <HalftoneMark className="size-14 sm:size-16" />
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-lab-ink sm:text-6xl">{displayName}</h1>
            <p className="mt-2 font-mono text-xs tracking-[0.16em] text-lab-ink-subtle">{latinName}</p>
          </div>
        </div>
        <p className="mt-8 max-w-md text-[15px] leading-relaxed text-lab-ink-muted">{homeIntro}</p>

        <p className="mb-2 mt-16 font-mono text-[11px] uppercase tracking-[0.22em] text-lab-ink-subtle">Index</p>
        <ul className="border-t border-lab-hairline">
          {homeModules.map((module, index) => (
            <Row key={module.id} module={module} index={index} />
          ))}
        </ul>
      </main>
      <PreviewLegal />
    </>
  );
}
