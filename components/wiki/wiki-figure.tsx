import { FramedStill } from "@/components/lab/framed-still";
import { findPublicNoteStill, noteMentionsStill } from "@/lib/content/wiki-media";
import type { WikiBullet } from "@/lib/content/wiki-parse";

export function WikiFigure({
  slug,
  title,
  body,
  bullets,
}: {
  slug: string;
  title: string;
  body: string;
  bullets: readonly WikiBullet[];
}) {
  const src = findPublicNoteStill(slug);
  if (src) {
    return (
      <div className="mt-8 max-w-xl">
        <FramedStill src={src} alt={title} width={1200} height={800} />
      </div>
    );
  }

  if (!noteMentionsStill([body, ...bullets.map((bullet) => bullet.value)])) return null;

  return (
    <figure className="mt-8 max-w-xl border-t border-lab-hairline pt-4">
      <figcaption className="text-[11px] tracking-[0.18em] text-lab-primary">画面</figcaption>
      <p className="mt-3 text-[15px] leading-relaxed text-lab-ink-muted">这篇还没有可看的原图。</p>
    </figure>
  );
}
