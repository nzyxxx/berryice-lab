import { HalftoneMark } from "@/components/lab/halftone-mark";
import { homeIntro, homeModules, type HomeModule } from "@/lib/content/home-modules";
import { profileConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Crosshair } from "lucide-react";
import Link from "next/link";

const cardClass =
  "flex flex-col rounded-3xl border border-lab-hairline bg-lab-surface-1 px-6 py-7 dark:bg-lab-surface-2";

function Badge({ children }: { children: string }) {
  return (
    <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-lab-ink px-2.5 text-[11px] font-medium tracking-wide text-lab-canvas">
      {children}
    </span>
  );
}

function ModuleCard({ module }: { module: HomeModule }) {
  const entries = module.entries ?? [];
  const linked = Boolean(module.href) && entries.length === 0;

  const body = (
    <>
      <span className="flex items-start justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight text-lab-ink">{module.title}</h2>
        {module.badge ? <Badge>{module.badge}</Badge> : null}
        {linked && !module.badge ? (
          <ArrowUpRight className="mt-1.5 size-4 shrink-0 text-lab-ink-tertiary" aria-hidden />
        ) : null}
      </span>
      {module.description ? (
        <p className="mt-3 text-sm leading-relaxed text-lab-ink-subtle">{module.description}</p>
      ) : null}
      {entries.length > 0 ? (
        <ul className="mt-5 border-t border-lab-hairline">
          {entries.map((entry) => {
            const row = (
              <>
                <Crosshair className="mt-0.5 size-4 shrink-0 text-lab-ink-subtle" aria-hidden />
                <span className="shrink-0 text-sm font-medium group-hover:underline">{entry.title}</span>
                {entry.description ? (
                  <span className="min-w-0 flex-1 text-sm font-normal leading-snug text-lab-ink-subtle">
                    {entry.description}
                  </span>
                ) : null}
              </>
            );

            return (
              <li key={entry.title}>
                {entry.href ? (
                  <Link
                    href={entry.href}
                    className="group flex min-h-11 items-start gap-3 py-2 text-lab-ink outline-none focus-visible:ring-2 focus-visible:ring-lab-ink/30 sm:items-center"
                  >
                    {row}
                  </Link>
                ) : (
                  <div className="flex min-h-11 items-start gap-3 py-2 text-lab-ink sm:items-center">
                    {row}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </>
  );

  if (linked && module.href) {
    return (
      <li>
        <Link
          href={module.href}
          className={cn(
            cardClass,
            "outline-none transition-colors duration-200 hover:bg-lab-surface-2 focus-visible:ring-2 focus-visible:ring-lab-ink/30 dark:hover:bg-lab-surface-3"
          )}
        >
          {body}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <article className={cardClass}>{body}</article>
    </li>
  );
}

export function HomeFront() {
  const { displayName, latinName } = profileConfig;

  return (
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-5 py-16 sm:px-6 md:py-24">
      <header>
        <div className="flex items-center gap-4 sm:gap-6">
          <HalftoneMark />
          <div className="min-w-0">
            <h1 className="text-[2rem] font-semibold leading-none tracking-tight text-lab-ink sm:text-5xl">
              {displayName}
            </h1>
            <p className="mt-2 font-mono text-sm tracking-[0.08em] text-lab-ink-subtle">{latinName}</p>
          </div>
        </div>
        <p className="mt-8 max-w-md text-[15px] leading-relaxed text-lab-ink-muted">{homeIntro}</p>
      </header>

      <section aria-label="栏目" className="mt-16 md:mt-24">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-lab-ink-subtle">Index</p>
        <ul className="mt-5 grid grid-cols-1 items-start gap-4 sm:grid-cols-2 sm:gap-5">
          {homeModules.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </ul>
      </section>
    </main>
  );
}
