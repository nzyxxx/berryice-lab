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
    <figure className="mt-8 flex min-h-36 max-w-xl flex-col justify-end border border-dashed border-lab-hairline px-5 py-5">
      <figcaption className="text-[11px] tracking-[0.18em] text-lab-primary">画面</figcaption>
      <p className="mt-3 max-w-[38ch] text-[15px] leading-relaxed text-lab-ink">
        原图还在收录盘上，公开目录里没有可显示的文件。
      </p>
      <p className="mt-2 text-sm leading-relaxed text-lab-ink-subtle">
        这格留空。不用别的图顶上，也不写出存储路径。
      </p>
    </figure>
  );
}
