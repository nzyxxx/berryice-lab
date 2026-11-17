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

/**
 * 每一行共用这一套列。桌面三列，手机上日期和来源占第一行，标题独占下一行。
 * 短标题若整组居中，长标题顶满，日期起点就对不齐。
 */
const lineGrid =
  "grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 sm:grid-cols-[minmax(4.5rem,6.5rem)_minmax(2.75rem,4.5rem)_minmax(0,1fr)]";

function FeedTime({ at }: { at: string | null }) {
  const label = homeFeedDateLabel(at);
  if (!at) return <span>{label}</span>;
  return (
    <time dateTime={at} className="tabular-nums">
      {label}
    </time>
  );
}

function FeedLine({ item, titleClass }: { item: HomeUpdate; titleClass: string }) {
  return (
    <Link
      href={item.href}
      title={item.title}
      data-feed-line=""
      className={`${lineGrid} min-h-11 rounded-md py-1 outline-none hover:text-lab-primary focus-visible:ring-2 focus-visible:ring-lab-primary`}
    >
      <span data-feed-date="" className="font-mono text-xs text-lab-ink-subtle sm:col-start-1">
        <FeedTime at={item.at} />
      </span>
      <span data-feed-source="" className="text-xs text-lab-ink-subtle sm:col-start-2">
        {item.sourceLabel}
      </span>
      <span
        data-feed-title=""
        className={`col-span-2 block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-lab-ink sm:col-span-1 sm:col-start-3 ${titleClass}`}
      >
        {item.title}
      </span>
    </Link>
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
    <section aria-labelledby="home-feed" className="min-w-0 lg:col-span-7 lg:col-start-6" onKeyDown={onKeyDown}>
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
        <div className="mt-4 w-full min-w-0 max-w-xl">
          <h3 className="m-0 w-full min-w-0">
            <FeedLine item={lead} titleClass="text-[15px] font-medium tracking-tight sm:text-xl" />
          </h3>
          {lead.summary ? (
            <p className="mt-2 text-[15px] leading-relaxed text-lab-ink-muted">{lead.summary}</p>
          ) : null}
          {rest.length > 0 ? (
            <ul className="mt-3 border-t border-lab-hairline">
              {rest.map((item) => (
                <li key={item.id} className="border-b border-lab-hairline">
                  <FeedLine item={item} titleClass="text-[15px]" />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-[15px] text-lab-ink-muted">{homeFeedEmptyCopy(filter)}</p>
      )}

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
