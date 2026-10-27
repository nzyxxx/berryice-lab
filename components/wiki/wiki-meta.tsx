import { WikiInline } from "@/components/wiki/wiki-markdown";
import type { WikiBullet } from "@/lib/content/wiki-parse";

export function WikiByline({
  author,
  ingestedAt,
}: {
  author: string | null;
  ingestedAt: string | null;
}) {
  if (!author && !ingestedAt) return null;

  return (
    <p className="text-sm leading-relaxed text-lab-ink-subtle">
      {author ? <span className="text-lab-ink-muted">{author}</span> : null}
      {author && ingestedAt ? <span aria-hidden="true"> · </span> : null}
      {ingestedAt ? <span>入库 {ingestedAt}</span> : null}
    </p>
  );
}

export function WikiFacts({ bullets }: { bullets: WikiBullet[] }) {
  if (bullets.length === 0) return null;

  return (
    <dl className="mt-8 divide-y divide-lab-hairline border-y border-lab-hairline">
      {bullets.map((bullet, index) => (
        <div
          key={`${bullet.label}-${index}`}
          className="grid gap-1 py-3.5 sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:items-baseline sm:gap-6"
        >
          <dt className="text-xs text-lab-ink-subtle">{bullet.label}</dt>
          <dd className="min-w-0 text-sm leading-relaxed text-lab-ink-muted">
            <WikiInline text={bullet.value} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
