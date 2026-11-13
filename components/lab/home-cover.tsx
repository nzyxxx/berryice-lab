import { homeNoteLine } from "@/lib/content/home-note";
import { homeModules } from "@/lib/content/home-modules";
import type { WikiNote } from "@/lib/content/wiki-store";
import { moduleLinks, profileConfig } from "@/lib/site-config";
import Link from "next/link";

/** 定稿静帧，22804 字节。不引用同目录的动画 webp。 */
const PORTRAIT = {
  src: "/characters/xiaomei/idle-candd-24-still.webp",
  width: 640,
  height: 853,
} as const;

function dateLabel(note: WikiNote) {
  return note.ingestedSort?.slice(0, 10) ?? null;
}

export function HomeCover({ notes }: { notes: readonly WikiNote[] }) {
  const [lead, ...rest] = notes;
  const primary = moduleLinks.filter((item) => item.id === "delta" || item.id === "music" || item.id === "about");
  const writing = moduleLinks.find((item) => item.id === "writing");
  const lab = homeModules.find((module) => module.id === "lab");
  const sideDoors = lab?.entries?.filter((entry) => entry.href && entry.href !== "/delta-gun") ?? [];

  return (
    <main id="main" className="relative mx-auto w-full max-w-6xl flex-1 px-5 pb-24 sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[70%] bg-lab-canvas/80 [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_78%,transparent)]"
      />

      <header className="flex items-end justify-between gap-5 pt-10 md:pt-16">
        <div className="min-w-0">
          <h1 className="text-display-hero">{profileConfig.displayName}</h1>
          <p className="mt-3 text-sm text-lab-ink-muted">
            {profileConfig.latinName}
            <span className="text-lab-ink-subtle"> · {profileConfig.tags.join(" · ")}</span>
          </p>
        </div>
        <Link
          href="/dafeiyu"
          aria-label="小莓"
          className="shrink-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-lab-primary"
        >
          <img
            src={PORTRAIT.src}
            alt=""
            width={PORTRAIT.width}
            height={PORTRAIT.height}
            decoding="async"
            fetchPriority="low"
            className="h-24 w-auto md:h-32"
          />
        </Link>
      </header>

      <section aria-labelledby="home-wiki" className="mt-10 max-w-3xl md:mt-16">
        <p className="text-[11px] tracking-[0.18em] text-lab-primary">知识库</p>
        {lead ? (
          <article className="mt-4">
            {dateLabel(lead) ? (
              <p className="font-mono text-xs tabular-nums text-lab-ink-subtle">{dateLabel(lead)}</p>
            ) : null}
            <h2 id="home-wiki" className="mt-2 text-xl font-medium leading-snug tracking-tight text-lab-ink">
              <Link
                href={`/wiki/${encodeURIComponent(lead.slug)}`}
                className="line-clamp-2 rounded-md outline-none hover:text-lab-primary focus-visible:ring-2 focus-visible:ring-lab-primary"
              >
                {lead.title}
              </Link>
            </h2>
            {lead.summary ? (
              <p className="mt-3 max-w-[36ch] text-[15px] leading-relaxed text-lab-ink-muted">
                {homeNoteLine(lead.summary)}
              </p>
            ) : null}
          </article>
        ) : (
          <h2 id="home-wiki" className="mt-4 text-xl font-medium tracking-tight text-lab-ink">
            知识库还没有笔记
          </h2>
        )}
        {rest.length > 0 ? (
          <ul className="mt-6 divide-y divide-lab-hairline border-t border-lab-hairline">
            {rest.map((note) => (
              <li key={note.slug}>
                <Link
                  href={`/wiki/${encodeURIComponent(note.slug)}`}
                  className="flex min-h-11 items-baseline gap-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-lab-primary"
                >
                  {dateLabel(note) ? (
                    <span className="shrink-0 font-mono text-xs tabular-nums text-lab-ink-subtle">
                      {dateLabel(note)}
                    </span>
                  ) : null}
                  <span className="line-clamp-1 text-[15px] font-medium tracking-tight text-lab-ink">
                    {note.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        <Link
          href="/wiki"
          className="mt-2 inline-flex min-h-11 items-center text-sm text-lab-primary outline-none focus-visible:ring-2 focus-visible:ring-lab-primary"
        >
          进入知识库
        </Link>
      </section>

      <section aria-label="去处" className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-3 md:mt-16">
        {primary.map((item) => (
          <div key={item.id} className="border-t border-lab-hairline pt-4">
            <h2 className="text-[15px] font-medium tracking-tight text-lab-ink">
              <Link
                href={item.href}
                className="rounded-md outline-none hover:text-lab-primary focus-visible:ring-2 focus-visible:ring-lab-primary"
              >
                {item.navLabel ?? item.title}
              </Link>
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-lab-ink-subtle">{item.description}</p>
          </div>
        ))}
      </section>

      <nav aria-label="其余入口" className="mt-12 flex flex-col gap-1 border-t border-lab-hairline pt-4 text-sm">
        {writing ? (
          <Link
            href={writing.href}
            className="inline-flex min-h-11 items-baseline gap-4 outline-none focus-visible:ring-2 focus-visible:ring-lab-primary"
          >
            <span className="text-lab-ink">{writing.title}</span>
            <span className="text-lab-ink-subtle">{writing.description}</span>
          </Link>
        ) : null}
        {sideDoors.map((entry) => (
          <Link
            key={entry.href}
            href={entry.href ?? "/"}
            className="inline-flex min-h-11 items-baseline gap-4 outline-none focus-visible:ring-2 focus-visible:ring-lab-primary"
          >
            <span className="text-lab-ink">{entry.title}</span>
            {entry.description ? <span className="text-lab-ink-subtle">{entry.description}</span> : null}
          </Link>
        ))}
      </nav>
    </main>
  );
}
