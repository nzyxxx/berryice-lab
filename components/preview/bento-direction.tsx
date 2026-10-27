import { HalftoneMark } from "@/components/lab/halftone-mark";
import { PreviewLegal } from "@/components/preview/preview-legal";
import { PreviewSwitch } from "@/components/preview/preview-switch";
import { ThemeToggle } from "@/components/lab/theme-toggle";
import { homeIntro, homeModules, type HomeModule } from "@/lib/content/home-modules";
import { profileConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

const SPANS: Record<string, string> = {
  works: "lg:col-span-4",
  writing: "lg:col-span-4",
  lab: "sm:col-span-2 lg:col-span-8",
  life: "lg:col-span-4",
  more: "lg:col-span-4",
};

function BentoTile({ module, className }: { module: HomeModule; className?: string }) {
  const entries = module.entries ?? [];
  const href = module.href && entries.length === 0 ? module.href : undefined;

  const body = (
    <div
      className={cn(
        "flex h-full min-h-44 flex-col justify-between rounded-3xl border border-lab-hairline bg-lab-surface-1 p-6",
        "transition-[transform,border-color] duration-200 dark:bg-lab-surface-2",
        href && "group-hover:-translate-y-0.5 group-hover:border-lab-ink/25",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-lab-ink-subtle">{module.id}</p>
        {module.badge ? (
          <span className="rounded-full bg-lab-ink px-2 py-0.5 text-[11px] font-medium text-lab-canvas">
            {module.badge}
          </span>
        ) : href ? (
          <ArrowUpRight className="size-4 text-lab-ink-tertiary transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        ) : null}
      </div>
      <div className="mt-8">
        <h2 className="text-2xl font-semibold tracking-tight text-lab-ink">{module.title}</h2>
        {module.description ? (
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-lab-ink-subtle">{module.description}</p>
        ) : null}
        {entries.length > 0 ? (
          <ul className="mt-4 border-t border-lab-hairline pt-3">
            {entries.map((entry) => (
              <li key={entry.title}>
                {entry.href ? (
                  <Link
                    href={entry.href}
                    className="block min-h-11 py-2 text-sm text-lab-ink outline-none hover:underline focus-visible:ring-2 focus-visible:ring-lab-ink/30"
                  >
                    <span className="block font-medium">{entry.title}</span>
                    {entry.description ? (
                      <span className="mt-1 block font-normal text-lab-ink-subtle">{entry.description}</span>
                    ) : null}
                  </Link>
                ) : (
                  <p className="min-h-11 py-2 text-sm">
                    <span className="block">{entry.title}</span>
                    {entry.description ? (
                      <span className="mt-1 block text-lab-ink-subtle">{entry.description}</span>
                    ) : null}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );

  if (!href) return <article className="h-full">{body}</article>;

  return (
    <Link
      href={href}
      className="group block h-full rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-lab-ink/30"
    >
      {body}
    </Link>
  );
}

export function BentoDirection() {
  const { displayName, latinName } = profileConfig;
  const about = homeModules.find((module) => module.id === "about");
  const rest = homeModules.filter((module) => module.id !== "about");

  return (
    <>
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-6 md:py-14">
        <div className="mb-8 flex items-center justify-between gap-4">
          <PreviewSwitch current="a" />
          <ThemeToggle />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
          <section className="flex min-h-64 flex-col justify-between rounded-3xl border border-lab-hairline bg-lab-surface-1 p-6 sm:col-span-2 sm:p-8 dark:bg-lab-surface-2 lg:col-span-7">
            <HalftoneMark />
            <div className="mt-8">
              <h1 className="text-4xl font-semibold tracking-tight text-lab-ink sm:text-5xl">{displayName}</h1>
              <p className="mt-2 font-mono text-sm tracking-[0.08em] text-lab-ink-subtle">{latinName}</p>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-lab-ink-muted">{homeIntro}</p>
            </div>
          </section>

          {about ? (
            <div className="lg:col-span-5">
              <BentoTile module={about} className="min-h-64" />
            </div>
          ) : null}

          {rest.map((module) => (
            <div key={module.id} className={cn("sm:col-span-1", SPANS[module.id] ?? "lg:col-span-4")}>
              <BentoTile module={module} />
            </div>
          ))}
        </div>
      </main>
      <PreviewLegal />
    </>
  );
}
