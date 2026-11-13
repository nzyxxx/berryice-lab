import { homeNoteLine } from "@/lib/content/home-note";
import type { WikiNote } from "@/lib/content/wiki-store";
import { profileConfig } from "@/lib/site-config";
import Link from "next/link";

const PORTRAIT = { src: "/characters/xiaomei/idle-candd-24-still.webp", width: 640, height: 853 } as const;
const GUN = { src: "/arsenal/awm.webp", width: 2253, height: 714 } as const;

function dateLabel(note: WikiNote) {
  return note.ingestedSort?.slice(0, 10) ?? null;
}

/** 方向 A：人物占一栏，文字靠在旁边。 */
export function MediaGallery({ notes }: { notes: readonly WikiNote[] }) {
  const [lead, ...rest] = notes;

  return (
    <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-5 pb-20 sm:px-6">
      <div className="grid items-end gap-8 pt-8 lg:grid-cols-12 lg:gap-12 lg:pt-12">
        <figure className="lg:col-span-5">
          <Link
            href="/dafeiyu"
            className="inline-block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-lab-primary"
          >
            <img
              src={PORTRAIT.src}
              alt="小莓"
              width={PORTRAIT.width}
              height={PORTRAIT.height}
              decoding="async"
              fetchPriority="low"
              className="h-auto w-52 max-w-full object-contain sm:w-60 lg:max-h-[70vh] lg:w-auto lg:max-w-full"
            />
          </Link>
        </figure>

        <div className="relative lg:col-span-7">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-4 -inset-y-8 -z-10 bg-lab-canvas/75 [mask-image:linear-gradient(to_bottom,transparent,black_16%,black_84%,transparent)]"
          />
          <p className="text-[11px] tracking-[0.18em] text-lab-primary">BerryIce</p>
          <h1 className="mt-3 text-display-hero">{profileConfig.displayName}</h1>
          <p className="mt-3 text-sm text-lab-ink-muted">{profileConfig.tags.join(" · ")}</p>

          <section aria-labelledby="gallery-wiki" className="mt-10 max-w-xl">
            <p className="text-[11px] tracking-[0.18em] text-lab-primary">知识库</p>
            {lead ? (
              <>
                <h2 id="gallery-wiki" className="mt-3 text-xl font-medium leading-snug tracking-tight text-lab-ink">
                  <Link
                    href={`/wiki/${encodeURIComponent(lead.slug)}`}
                    className="rounded-md outline-none hover:text-lab-primary focus-visible:ring-2 focus-visible:ring-lab-primary"
                  >
                    {lead.title}
                  </Link>
                </h2>
                {dateLabel(lead) ? (
                  <p className="mt-2 font-mono text-xs tabular-nums text-lab-ink-subtle">{dateLabel(lead)}</p>
                ) : null}
                {lead.summary ? (
                  <p className="mt-3 text-[15px] leading-relaxed text-lab-ink-muted">{homeNoteLine(lead.summary)}</p>
                ) : null}
              </>
            ) : (
              <h2 id="gallery-wiki" className="mt-3 text-xl font-medium text-lab-ink">
                知识库还没有笔记
              </h2>
            )}
            {rest.length > 0 ? (
              <ul className="mt-6 space-y-3">
                {rest.map((note) => (
                  <li key={note.slug}>
                    <Link
                      href={`/wiki/${encodeURIComponent(note.slug)}`}
                      className="text-[15px] text-lab-ink outline-none hover:text-lab-primary focus-visible:ring-2 focus-visible:ring-lab-primary"
                    >
                      {note.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </div>
      </div>

      <section className="mt-14 grid gap-8 border-t border-lab-hairline pt-6 md:grid-cols-12">
        <Link
          href="/delta-gun"
          className="flex items-center gap-5 outline-none focus-visible:ring-2 focus-visible:ring-lab-primary md:col-span-7"
        >
          <img
            src={GUN.src}
            alt=""
            width={GUN.width}
            height={GUN.height}
            loading="lazy"
            decoding="async"
            className="h-16 w-auto max-w-[46%] object-contain"
          />
          <span>
            <span className="block text-[15px] font-medium tracking-tight text-lab-ink">三角洲</span>
            <span className="mt-1 block text-sm text-lab-ink-subtle">枪械、改枪码、主播</span>
          </span>
        </Link>
        <div className="flex flex-col justify-center gap-3 text-sm md:col-span-5">
          <Link href="/music" className="min-h-11 text-lab-ink outline-none hover:text-lab-primary focus-visible:ring-2 focus-visible:ring-lab-primary">
            歌单
          </Link>
          <Link href="/about" className="min-h-11 text-lab-ink outline-none hover:text-lab-primary focus-visible:ring-2 focus-visible:ring-lab-primary">
            关于
          </Link>
          <Link href="/writing" className="min-h-11 text-lab-ink-subtle outline-none hover:text-lab-ink focus-visible:ring-2 focus-visible:ring-lab-primary">
            写作 · 还没有文章
          </Link>
        </div>
      </section>
    </main>
  );
}
