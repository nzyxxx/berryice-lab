import { homeNoteLine } from "@/lib/content/home-note";
import type { WikiNote } from "@/lib/content/wiki-store";
import { profileConfig } from "@/lib/site-config";
import Link from "next/link";

const PORTRAIT = { src: "/characters/xiaomei/idle-candd-24-still.webp", width: 640, height: 853 } as const;
const GUN = { src: "/arsenal/awm.webp", width: 2253, height: 714 } as const;

function dateLabel(note: WikiNote) {
  return note.ingestedSort?.slice(0, 10) ?? null;
}

/** 首页：小莓全身静帧和人名是一幅构图，笔记靠在旁边。 */
export function MediaGallery({ notes }: { notes: readonly WikiNote[] }) {
  const [lead, ...rest] = notes;

  return (
    <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 sm:px-6">
      <div className="grid grid-cols-1 items-center gap-x-10 gap-y-4 pt-6 lg:grid-cols-12 lg:pt-10">
        <div className="lg:col-span-7 lg:col-start-6 lg:row-start-1">
          <p className="text-[11px] tracking-[0.18em] text-lab-primary">{profileConfig.latinName}</p>
          <h1 className="mt-2 text-display-hero">{profileConfig.displayName}</h1>
          <p className="mt-3 text-sm text-lab-ink-muted">{profileConfig.tags.join(" · ")}</p>
        </div>

        <figure className="lg:col-span-5 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <Link
            href="/dafeiyu"
            aria-label="小莓的房间"
            className="inline-block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-lab-primary"
          >
            <img
              src={PORTRAIT.src}
              alt="小莓"
              width={PORTRAIT.width}
              height={PORTRAIT.height}
              decoding="async"
              fetchPriority="low"
              className="h-44 w-auto object-contain sm:h-52 lg:h-auto lg:max-h-[62vh] lg:max-w-full"
            />
          </Link>
        </figure>

        <section aria-labelledby="home-wiki" className="lg:col-span-7 lg:col-start-6">
          <p id="home-wiki" className="text-[11px] tracking-[0.18em] text-lab-primary">
            知识库
          </p>
          {lead ? (
            <article className="mt-3 max-w-xl">
              <h2 className="text-xl font-medium leading-snug tracking-tight text-lab-ink">
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
            </article>
          ) : (
            <p className="mt-3 text-[15px] text-lab-ink-muted">知识库还没有笔记。</p>
          )}
          {rest.length > 0 ? (
            <ul className="mt-5 max-w-xl space-y-2 border-t border-lab-hairline pt-4">
              {rest.map((note) => (
                <li key={note.slug} className="flex min-h-11 items-baseline gap-3">
                  {dateLabel(note) ? (
                    <span className="shrink-0 font-mono text-xs tabular-nums text-lab-ink-subtle">
                      {dateLabel(note)}
                    </span>
                  ) : null}
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
          <Link
            href="/wiki"
            className="mt-2 inline-flex min-h-11 items-center text-sm text-lab-primary outline-none focus-visible:ring-2 focus-visible:ring-lab-primary"
          >
            进入知识库
          </Link>
        </section>
      </div>

      <section className="mt-10 grid items-center gap-8 border-t border-lab-hairline pt-6 md:grid-cols-12">
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
            className="h-14 w-auto max-w-[48%] object-contain"
          />
          <span>
            <span className="block text-[15px] font-medium tracking-tight text-lab-ink">三角洲</span>
            <span className="mt-1 block text-sm text-lab-ink-subtle">枪械、改枪码、主播</span>
          </span>
        </Link>
        <nav aria-label="其他" className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm md:col-span-5">
          <Link href="/music" className="inline-flex min-h-11 items-center text-lab-ink outline-none hover:text-lab-primary focus-visible:ring-2 focus-visible:ring-lab-primary">
            歌单
          </Link>
          <Link href="/stickers" className="inline-flex min-h-11 items-center text-lab-ink outline-none hover:text-lab-primary focus-visible:ring-2 focus-visible:ring-lab-primary">
            表情
          </Link>
          <Link href="/about" className="inline-flex min-h-11 items-center text-lab-ink outline-none hover:text-lab-primary focus-visible:ring-2 focus-visible:ring-lab-primary">
            关于
          </Link>
          <Link href="/writing" className="inline-flex min-h-11 items-center text-lab-ink outline-none hover:text-lab-primary focus-visible:ring-2 focus-visible:ring-lab-primary">
            写作
          </Link>
        </nav>
      </section>
    </main>
  );
}
