import { homeNoteLine } from "@/lib/content/home-note";
import type { WikiNote } from "@/lib/content/wiki-store";
import { profileConfig } from "@/lib/site-config";
import Link from "next/link";

const PORTRAIT = { src: "/characters/xiaomei/idle-candd-24-still.webp", width: 640, height: 853 } as const;
const GUN = { src: "/arsenal/awm.webp", width: 2253, height: 714 } as const;

function dateLabel(note: WikiNote) {
  return note.ingestedSort?.slice(0, 10) ?? null;
}

/** 方向 B：书架。有图的行才放图，笔记不造封面。 */
export function ShelfDirection({ notes }: { notes: readonly WikiNote[] }) {
  return (
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 sm:px-6">
      <header className="flex flex-col items-start gap-4 pt-8 sm:flex-row sm:items-end sm:gap-8 md:gap-10 md:pt-12">
        <img
          src={PORTRAIT.src}
          alt="小莓"
          width={PORTRAIT.width}
          height={PORTRAIT.height}
          decoding="async"
          fetchPriority="low"
          className="h-52 w-auto object-contain md:h-64"
        />
        <div className="min-w-0 pb-1">
          <h1 className="text-display-hero">{profileConfig.displayName}</h1>
          <p className="mt-2 text-sm text-lab-ink-muted">
            {profileConfig.latinName} · {profileConfig.tags.join(" · ")}
          </p>
        </div>
      </header>

      <div
        aria-hidden
        className="pointer-events-none -mx-5 mt-8 h-px bg-lab-hairline sm:-mx-6"
      />

      <section aria-labelledby="shelf-wiki" className="border-b border-lab-hairline py-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="shelf-wiki" className="text-[15px] font-medium tracking-tight text-lab-ink">
            知识库
          </h2>
          <Link
            href="/wiki"
            className="text-sm text-lab-primary outline-none focus-visible:ring-2 focus-visible:ring-lab-primary"
          >
            全部
          </Link>
        </div>
        {notes.length === 0 ? (
          <p className="mt-4 text-sm text-lab-ink-subtle">还没有笔记。</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {notes.map((note) => (
              <li key={note.slug}>
                <Link
                  href={`/wiki/${encodeURIComponent(note.slug)}`}
                  className="block outline-none focus-visible:ring-2 focus-visible:ring-lab-primary"
                >
                  {dateLabel(note) ? (
                    <span className="font-mono text-xs tabular-nums text-lab-ink-subtle">{dateLabel(note)}</span>
                  ) : null}
                  <span className="mt-1 block text-[15px] font-medium leading-snug tracking-tight text-lab-ink">
                    {note.title}
                  </span>
                  {note.summary ? (
                    <span className="mt-1 block text-sm leading-relaxed text-lab-ink-muted">
                      {homeNoteLine(note.summary)}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-4 border-b border-lab-hairline py-6 sm:grid-cols-[9rem_1fr] sm:items-center">
        <img
          src={GUN.src}
          alt=""
          width={GUN.width}
          height={GUN.height}
          loading="lazy"
          decoding="async"
          className="h-16 w-full object-contain object-left sm:h-20"
        />
        <div>
          <h2 className="text-[15px] font-medium tracking-tight text-lab-ink">
            <Link href="/delta-gun" className="outline-none hover:text-lab-primary focus-visible:ring-2 focus-visible:ring-lab-primary">
              三角洲
            </Link>
          </h2>
          <p className="mt-1 text-sm text-lab-ink-subtle">枪械、改枪码、主播</p>
        </div>
      </section>

      <section className="grid gap-x-8 sm:grid-cols-2">
        <Link href="/music" className="border-b border-lab-hairline py-5 outline-none focus-visible:ring-2 focus-visible:ring-lab-primary">
          <span className="block text-[15px] font-medium text-lab-ink">歌单</span>
          <span className="mt-1 block text-sm text-lab-ink-subtle">自己的曲目</span>
        </Link>
        <Link href="/about" className="border-b border-lab-hairline py-5 outline-none focus-visible:ring-2 focus-visible:ring-lab-primary">
          <span className="block text-[15px] font-medium text-lab-ink">关于</span>
          <span className="mt-1 block text-sm text-lab-ink-subtle">现在在做什么</span>
        </Link>
        <Link href="/stickers" className="border-b border-lab-hairline py-5 outline-none focus-visible:ring-2 focus-visible:ring-lab-primary">
          <span className="block text-[15px] font-medium text-lab-ink">表情</span>
          <span className="mt-1 block text-sm text-lab-ink-subtle">方形小图</span>
        </Link>
        <Link href="/writing" className="border-b border-lab-hairline py-5 outline-none focus-visible:ring-2 focus-visible:ring-lab-primary">
          <span className="block text-[15px] font-medium text-lab-ink-subtle">写作</span>
          <span className="mt-1 block text-sm text-lab-ink-subtle">还没有文章</span>
        </Link>
      </section>
    </main>
  );
}
