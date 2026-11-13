import { FramedStill } from "@/components/lab/framed-still";
import { glassSurfaceClass } from "@/components/uiverse/glass-surface";
import { homeModules } from "@/lib/content/home-modules";
import type { WikiNote } from "@/lib/content/wiki-store";
import { profileConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import Link from "next/link";

const GUN_STILL = {
  src: "/arsenal/awm.webp",
  alt: "枪械库里现成的 AWM 图",
  width: 2253,
  height: 714,
} as const;

function dateLabel(note: WikiNote) {
  return note.ingestedSort?.slice(0, 10) ?? null;
}

export function HomeCover({ notes }: { notes: readonly WikiNote[] }) {
  const [lead, ...rest] = notes;
  const quiet = homeModules.filter((module) => module.badge !== "即将上线" && module.id !== "lab");
  const lab = homeModules.find((module) => module.id === "lab");

  return (
    <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-5 pb-24 sm:px-6">
      <header className="pt-16 md:pt-20">
        <h1 className="text-display-hero">{profileConfig.displayName}</h1>
        <p className="mt-3 text-lg text-lab-ink-muted">{profileConfig.latinName}</p>
        <p className="mt-4 text-sm text-lab-ink-subtle">{profileConfig.tags.join(" · ")}</p>
      </header>

      <div className="mt-16 grid items-start gap-12 md:mt-24 lg:grid-cols-12 lg:gap-16">
        <section aria-labelledby="home-notes" className="lg:col-span-7">
          <p className="text-[11px] tracking-[0.18em] text-lab-primary">笔记 · 最新</p>
          {lead ? (
            <article className="mt-6">
              {dateLabel(lead) ? (
                <p className="font-mono text-xs tabular-nums text-lab-ink-subtle">{dateLabel(lead)}</p>
              ) : null}
              <h2 id="home-notes" className="mt-2 text-display-section">
                <Link
                  href={`/wiki/${encodeURIComponent(lead.slug)}`}
                  className="rounded-md outline-none hover:text-lab-primary focus-visible:ring-2 focus-visible:ring-lab-primary"
                >
                  {lead.title}
                </Link>
              </h2>
              {lead.summary ? (
                <p className="mt-4 max-w-[42ch] text-[15px] leading-relaxed text-lab-ink-muted">
                  {lead.summary}
                </p>
              ) : null}
            </article>
          ) : (
            <>
              <h2 id="home-notes" className="mt-6 text-display-section">
                还没有笔记
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-lab-ink-muted">
                有笔记之后，最新的一篇会放在这里。
              </p>
            </>
          )}
          {rest.length > 0 ? (
            <ul className="mt-8 divide-y divide-lab-hairline border-t border-lab-hairline">
              {rest.map((note) => (
                <li key={note.slug}>
                  <Link
                    href={`/wiki/${encodeURIComponent(note.slug)}`}
                    className="flex min-h-11 flex-col justify-center py-4 outline-none focus-visible:ring-2 focus-visible:ring-lab-primary"
                  >
                    {dateLabel(note) ? (
                      <span className="font-mono text-xs tabular-nums text-lab-ink-subtle">
                        {dateLabel(note)}
                      </span>
                    ) : null}
                    <span className="mt-1 text-[15px] font-medium tracking-tight text-lab-ink">
                      {note.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          <Link
            href="/wiki"
            className="mt-4 inline-flex min-h-11 items-center text-sm text-lab-primary outline-none focus-visible:ring-2 focus-visible:ring-lab-primary"
          >
            全部笔记
          </Link>
        </section>

        <div className="grid gap-8 lg:col-span-5">
          <section aria-labelledby="home-gun" className="border-t border-lab-hairline pt-5">
            <p className="text-[11px] tracking-[0.18em] text-lab-ink-subtle">游戏</p>
            <h2 id="home-gun" className="mt-3 text-[15px] font-medium tracking-tight text-lab-ink">
              <Link
                href="/delta-gun"
                className="rounded-md outline-none hover:text-lab-primary focus-visible:ring-2 focus-visible:ring-lab-primary"
              >
                三角洲
              </Link>
            </h2>
            <p className="mt-2 max-w-[32ch] text-sm leading-relaxed text-lab-ink-subtle">
              枪、码和主播在专栏里。这张是枪械库现成的图，不是新画的封面。
            </p>
            <div className="mt-4">
              <FramedStill {...GUN_STILL} />
            </div>
          </section>

          <section
            aria-labelledby="home-pet"
            className={cn(glassSurfaceClass(), "rounded-3xl px-6 py-6")}
          >
            <p className="text-[11px] tracking-[0.18em] text-lab-primary">宠物</p>
            <h2 id="home-pet" className="mt-3 text-[15px] font-medium tracking-tight text-lab-ink">
              <Link
                href="/dafeiyu"
                className="rounded-md outline-none hover:text-lab-primary focus-visible:ring-2 focus-visible:ring-lab-primary"
              >
                大肥鱼的房间
              </Link>
            </h2>
            <p className="mt-3 max-w-[28ch] text-sm leading-relaxed text-lab-ink-muted">
              小莓在那一页。首页不放三套动画，点进去才见面。
            </p>
          </section>
        </div>
      </div>

      <div className="mt-16 grid gap-10 md:mt-24 md:grid-cols-2 md:gap-16">
        <section aria-labelledby="home-picture" className="flex min-h-44 flex-col justify-end border border-dashed border-lab-hairline px-5 py-5">
          <p className="text-[11px] tracking-[0.18em] text-lab-primary">图片</p>
          <h2 id="home-picture" className="mt-3 text-[15px] font-medium tracking-tight text-lab-ink">
            原图还没挂出来
          </h2>
          <p className="mt-3 max-w-[36ch] text-sm leading-relaxed text-lab-ink-muted">
            笔记里提过画面文件。公开目录没有这些原图，线上预览地址也打不开。这格留空，不用别的图填。
          </p>
          <Link
            href="/wiki"
            className="mt-4 inline-flex min-h-11 items-center text-sm text-lab-primary outline-none focus-visible:ring-2 focus-visible:ring-lab-primary"
          >
            先读文字
          </Link>
        </section>

        <section aria-labelledby="home-music" className="border-t border-lab-hairline pt-5">
          <p className="text-[11px] tracking-[0.18em] text-lab-primary">歌单</p>
          <h2 id="home-music" className="mt-3 text-[15px] font-medium tracking-tight text-lab-ink">
            <Link
              href="/music"
              className="rounded-md outline-none hover:text-lab-primary focus-visible:ring-2 focus-visible:ring-lab-primary"
            >
              这台浏览器里的草稿
            </Link>
          </h2>
          <p className="mt-3 max-w-[36ch] text-sm leading-relaxed text-lab-ink-muted">
            还没有公开曲目。可以自己写下曲名、歌手和官方链接，只留在本地。语音没有成片。
          </p>
        </section>
      </div>

      <nav aria-label="其余入口" className="mt-16 flex flex-col gap-3 border-t border-lab-hairline pt-6 text-sm md:mt-24">
        {quiet.map((module) =>
          module.href ? (
            <Link
              key={module.id}
              href={module.href}
              className="inline-flex min-h-11 items-baseline gap-4 outline-none focus-visible:ring-2 focus-visible:ring-lab-primary"
            >
              <span className="text-lab-ink">{module.title}</span>
              {module.description ? (
                <span className="text-lab-ink-subtle">{module.description}</span>
              ) : null}
            </Link>
          ) : null
        )}
        {lab?.entries?.map((entry) =>
          entry.href ? (
            <Link
              key={entry.href}
              href={entry.href}
              className="inline-flex min-h-11 items-baseline gap-4 outline-none focus-visible:ring-2 focus-visible:ring-lab-primary"
            >
              <span className="text-lab-ink">{entry.title}</span>
              {entry.description ? (
                <span className="text-lab-ink-subtle">{entry.description}</span>
              ) : null}
            </Link>
          ) : null
        )}
      </nav>
    </main>
  );
}
