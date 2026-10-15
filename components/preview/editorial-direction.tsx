import { PreviewLegal } from "@/components/preview/preview-legal";
import { PreviewSwitch } from "@/components/preview/preview-switch";
import { ThemeToggle } from "@/components/lab/theme-toggle";
import { homeIntro, homeModules } from "@/lib/content/home-modules";
import { profileConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export function EditorialDirection() {
  const { displayName, latinName } = profileConfig;

  return (
    <>
      <main id="main" className="relative flex-1">
        <header className="relative overflow-hidden px-5 pb-16 pt-8 sm:px-8 md:pb-24 md:pt-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-25"
            style={{
              backgroundImage: "radial-gradient(circle, var(--lab-primary) 0.7px, transparent 0.8px)",
              backgroundSize: "8px 8px",
              maskImage: "radial-gradient(ellipse 80% 70% at 0% 0%, black, transparent 72%)",
            }}
          />
          <div className="relative mx-auto flex max-w-5xl items-center justify-between gap-4">
            <PreviewSwitch current="b" />
            <ThemeToggle />
          </div>
          <div className="relative mx-auto mt-16 max-w-5xl animate-preview-rise md:mt-24">
            <p className="font-mono text-sm tracking-[0.14em] text-lab-ink-subtle">{latinName}</p>
            <h1 className="mt-4 max-w-4xl text-[clamp(3.25rem,11vw,7.5rem)] font-semibold leading-[0.92] tracking-[-0.045em] text-lab-ink">
              {displayName}
            </h1>
            <p className="mt-8 max-w-md text-lg leading-relaxed text-lab-ink-muted">{homeIntro}</p>
            <nav aria-label="栏目" className="mt-10 flex flex-wrap gap-x-6 gap-y-1">
              {homeModules.map((module) => (
                <a
                  key={module.id}
                  href={`#${module.id}`}
                  className="inline-flex min-h-11 items-center text-sm text-lab-ink-subtle hover:text-lab-ink"
                >
                  {module.title}
                </a>
              ))}
            </nav>
          </div>
        </header>

        {homeModules.map((module, index) => {
          const entries = module.entries ?? [];
          const href = module.href && entries.length === 0 ? module.href : undefined;
          const title = (
            <h2 className="text-4xl font-semibold tracking-tight text-lab-ink sm:text-6xl">{module.title}</h2>
          );

          return (
            <section
              key={module.id}
              id={module.id}
              className="scroll-mt-8 border-t border-lab-hairline px-5 py-14 sm:px-8 md:py-20"
            >
              <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[4rem_1fr_16rem] md:items-end">
                <p className="font-mono text-xs tracking-[0.18em] text-lab-ink-subtle">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <div>
                  {href ? (
                    <Link href={href} className="group inline-flex items-end gap-3 outline-none focus-visible:ring-2 focus-visible:ring-lab-ink/30">
                      {title}
                      <ArrowUpRight className="mb-2 size-5 text-lab-ink-tertiary transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </Link>
                  ) : (
                    title
                  )}
                  {module.badge ? (
                    <p className="mt-4 inline-flex rounded-full bg-lab-ink px-2.5 py-1 text-[11px] font-medium text-lab-canvas">
                      {module.badge}
                    </p>
                  ) : null}
                </div>
                <p className="text-sm leading-relaxed text-lab-ink-subtle md:text-right">{module.description}</p>
              </div>
              {entries.length > 0 ? (
                <ul className="mx-auto mt-8 max-w-5xl md:pl-16">
                  {entries.map((entry) => (
                    <li key={entry.title}>
                      {entry.href ? (
                        <Link
                          href={entry.href}
                          className={cn(
                            "flex min-h-11 max-w-xl flex-col gap-1 border-b border-lab-hairline py-3 text-sm sm:flex-row sm:items-baseline sm:justify-between sm:gap-6",
                            "outline-none hover:text-lab-ink focus-visible:ring-2 focus-visible:ring-lab-ink/30"
                          )}
                        >
                          <span className="font-medium">{entry.title}</span>
                          <span className="text-lab-ink-subtle">{entry.description}</span>
                        </Link>
                      ) : (
                        <p className="flex min-h-11 items-baseline justify-between gap-6 text-sm">
                          <span>{entry.title}</span>
                          <span className="text-lab-ink-subtle">{entry.description}</span>
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          );
        })}
      </main>
      <PreviewLegal />
    </>
  );
}
