"use client";

import { controlClass } from "@/components/lab/control";
import {
  HOME_FEED_FILTERS,
  homeFeedDateLabel,
  homeFeedEmptyCopy,
  homeFeedMoreHref,
  selectHomeUpdates,
  type HomeFeedFilter,
  type HomeUpdate,
} from "@/lib/content/home-feed";
import Link from "next/link";
import { useState, type KeyboardEvent } from "react";

function FeedTime({ at }: { at: string | null }) {
  const label = homeFeedDateLabel(at);
  if (!at) return <span>{label}</span>;
  return (
    <time dateTime={at} className="font-mono tabular-nums">
      {label}
    </time>
  );
}

/** 右侧阅读。筛选是本地状态，不发请求。Esc 回到「全部」。 */
export function HomeFeed({ updates }: { updates: readonly HomeUpdate[] }) {
  const [filter, setFilter] = useState<HomeFeedFilter>("all");
  const selected = selectHomeUpdates(updates, filter);
  const [lead, ...rest] = selected.items;
  const moreHref = homeFeedMoreHref(filter);

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Escape" || filter === "all") return;
    event.preventDefault();
    setFilter("all");
  }

  return (
    <section aria-labelledby="home-feed" className="lg:col-span-7 lg:col-start-6" onKeyDown={onKeyDown}>
      <h2 id="home-feed" className="text-[11px] tracking-[0.18em] text-lab-primary">
        最新动态
      </h2>
      <div role="group" aria-label="按来源筛选" className="mt-3 flex flex-wrap gap-1">
        {HOME_FEED_FILTERS.map((item) => {
          const pressed = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={pressed}
              className={pressed ? controlClass.secondary : controlClass.quiet}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {lead ? (
        <article className="mt-4 max-w-xl">
          <p className="flex flex-wrap items-baseline gap-x-3 text-xs text-lab-ink-subtle">
            <FeedTime at={lead.at} />
            <span>{lead.sourceLabel}</span>
          </p>
          <h3 className="mt-2 text-xl font-medium leading-snug tracking-tight text-lab-ink">
            <Link
              href={lead.href}
              className="inline-flex min-h-11 items-center rounded-md outline-none hover:text-lab-primary focus-visible:ring-2 focus-visible:ring-lab-primary"
            >
              {lead.title}
            </Link>
          </h3>
          {lead.summary ? (
            <p className="mt-3 text-[15px] leading-relaxed text-lab-ink-muted">{lead.summary}</p>
          ) : null}
        </article>
      ) : (
        <p className="mt-4 text-[15px] text-lab-ink-muted">{homeFeedEmptyCopy(filter)}</p>
      )}

      {rest.length > 0 ? (
        <ul className="mt-5 max-w-xl border-t border-lab-hairline">
          {rest.map((item) => (
            <li key={item.id} className="border-b border-lab-hairline">
              <Link
                href={item.href}
                className="flex min-h-11 flex-col justify-center gap-0.5 py-2 outline-none focus-visible:ring-2 focus-visible:ring-lab-primary sm:flex-row sm:items-baseline sm:gap-3"
              >
                <span className="shrink-0 text-xs text-lab-ink-subtle sm:w-[6.5rem]">
                  <FeedTime at={item.at} />
                </span>
                <span className="shrink-0 text-xs text-lab-ink-subtle sm:w-[4.5rem]">{item.sourceLabel}</span>
                <span className="min-w-0 text-[15px] text-lab-ink hover:text-lab-primary">{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {selected.hidden > 0 ? (
        moreHref ? (
          <Link
            href={moreHref}
            className="mt-1 inline-flex min-h-11 items-center text-sm text-lab-primary outline-none focus-visible:ring-2 focus-visible:ring-lab-primary"
          >
            还有 {selected.hidden} 条
          </Link>
        ) : (
          <p className="mt-3 text-sm text-lab-ink-subtle">还有 {selected.hidden} 条，在各自的栏目里。</p>
        )
      ) : null}
    </section>
  );
}
