"use client";

import {
  homeFeedDateLabel,
  homeFeedEmptyCopy,
  selectHomeUpdates,
  type HomeUpdate,
} from "@/lib/content/home-feed";
import Link from "next/link";

/**
 * 每一行共用这一套列。桌面三列，手机上日期和来源占第一行，标题独占下一行。
 * 日期列有固定最小宽度。短的「时间未记」不会把来源起点往左拉。
 */
const lineGrid =
  "grid w-full min-w-0 grid-cols-[minmax(4.5rem,6.5rem)_minmax(0,1fr)] items-center gap-x-3 sm:grid-cols-[minmax(4.5rem,6.5rem)_minmax(2.75rem,4.5rem)_minmax(0,1fr)]";

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

/** 右侧阅读。八条同一行结构，分类留在全站栏目里。 */
export function HomeFeed({ updates, className = "" }: { updates: readonly HomeUpdate[]; className?: string }) {
  const selected = selectHomeUpdates(updates, "all");

  return (
    <section aria-labelledby="home-feed" className={`min-w-0 lg:col-span-7 lg:col-start-6 ${className}`}>
      <h2 id="home-feed" className="text-[11px] tracking-[0.18em] text-lab-primary">
        最新动态
      </h2>

      {selected.items.length > 0 ? (
        <ul className="mt-4 w-full min-w-0 max-w-xl border-t border-lab-hairline">
          {selected.items.map((item) => (
            <li key={item.id} className="border-b border-lab-hairline">
              <FeedLine item={item} titleClass="text-[15px]" />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-[15px] text-lab-ink-muted">{homeFeedEmptyCopy("all")}</p>
      )}

      {selected.hidden > 0 ? (
        <p className="mt-3 text-sm text-lab-ink-subtle">还有 {selected.hidden} 条，在各自的栏目里。</p>
      ) : null}
    </section>
  );
}
