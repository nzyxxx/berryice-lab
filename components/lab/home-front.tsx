import { homeModules, type HomeModule } from "@/lib/content/home-modules";
import { profileConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

const cardClass =
  "flex flex-col rounded-2xl border border-lab-hairline bg-lab-surface-1 px-5 py-6";

function ModuleCard({ module }: { module: HomeModule }) {
  const entries = module.entries ?? [];
  const linked = Boolean(module.href) && entries.length === 0;

  const body = (
    <>
      <span className="flex items-start justify-between gap-3">
        <h2 className="text-[15px] font-medium tracking-tight text-lab-ink">{module.title}</h2>
        {linked ? (
          <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-lab-ink-tertiary" aria-hidden />
        ) : null}
      </span>
      {module.description ? (
        <p className="mt-2 text-sm leading-relaxed text-lab-ink-subtle">{module.description}</p>
      ) : null}
      {entries.length > 0 ? (
        <ul className="mt-4 border-t border-lab-hairline pt-2">
          {entries.map((entry) => {
            const label = (
              <>
                <span className="block text-sm">{entry.title}</span>
                {entry.description ? (
                  <span className="mt-0.5 block text-xs leading-relaxed text-lab-ink-subtle">
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
                    className="flex min-h-11 items-center rounded-lg py-2 text-lab-ink outline-none hover:text-lab-primary focus-visible:ring-2 focus-visible:ring-lab-primary/40"
                  >
                    {label}
                  </Link>
                ) : (
                  <div className="py-2">{label}</div>
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
            "outline-none transition-colors hover:border-lab-ink-tertiary focus-visible:ring-2 focus-visible:ring-lab-primary/40"
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
  const { displayName, latinName, tags } = profileConfig;

  return (
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-5 py-16 sm:px-6 md:py-24">
      <header className="max-w-xl">
        <h1 className="text-display-hero">{displayName}</h1>
        <p className="mt-3 text-base text-lab-ink-muted">{latinName}</p>
        <ul className="mt-6 flex flex-wrap gap-x-3 text-sm text-lab-ink-subtle">
          {tags.map((tag, index) => (
            <li key={tag} className="flex items-center gap-x-3">
              {index > 0 ? (
                <span aria-hidden className="text-lab-ink-tertiary">
                  ·
                </span>
              ) : null}
              {tag}
            </li>
          ))}
        </ul>
      </header>

      <section aria-label="栏目" className="mt-16 md:mt-24">
        <ul className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 sm:gap-5">
          {homeModules.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </ul>
      </section>
    </main>
  );
}
