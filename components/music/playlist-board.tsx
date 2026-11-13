import { controlClass, fieldClass } from "@/components/lab/control";
import type { PlaylistTrack } from "@/lib/music/playlist-draft";

export function PlaylistBoard({
  tracks,
  pending,
  message,
  onAdd,
  onRemove,
  onMove,
}: {
  tracks: readonly PlaylistTrack[];
  pending: boolean;
  message: string;
  onAdd: (draft: { title: string; artist: string; url: string }) => boolean;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
}) {
  return (
    <div className="mt-10">
      <form
        className="grid gap-3 sm:grid-cols-[1fr_1fr_1.4fr_auto] sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = new FormData(form);
          const added = onAdd({
            title: String(data.get("title") ?? ""),
            artist: String(data.get("artist") ?? ""),
            url: String(data.get("url") ?? ""),
          });
          if (added) form.reset();
        }}
      >
        <label className="grid gap-1 text-xs text-lab-ink-subtle">
          曲名
          <input
            name="title"
            required
            maxLength={40}
            autoComplete="off"
            className={fieldClass}
          />
        </label>
        <label className="grid gap-1 text-xs text-lab-ink-subtle">
          歌手
          <input
            name="artist"
            required
            maxLength={40}
            autoComplete="off"
            className={fieldClass}
          />
        </label>
        <label className="grid gap-1 text-xs text-lab-ink-subtle">
          官方链接
          <input
            name="url"
            required
            type="url"
            inputMode="url"
            placeholder="https://"
            maxLength={300}
            autoComplete="off"
            className={fieldClass}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className={controlClass.primary}
          aria-busy={pending}
        >
          加入
        </button>
      </form>
      <p
        className={`mt-3 min-h-5 text-xs ${message.startsWith("已") ? "text-lab-primary" : "text-lab-ink-subtle"}`}
        role="status"
        aria-live="polite"
      >
        {message}
      </p>

      {tracks.length === 0 ? (
        <p className="mt-8 max-w-md border-t border-lab-hairline pt-6 text-[15px] leading-relaxed text-lab-ink-muted">
          还没有曲目。写上去的只会留在这台浏览器，刷新还在，换一台就没有。
        </p>
      ) : (
        <ol className="mt-6 divide-y divide-lab-hairline border-y border-lab-hairline">
          {tracks.map((track, index) => (
            <li key={track.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium tracking-tight text-lab-ink">{track.title}</p>
                <p className="mt-1 text-sm text-lab-ink-subtle">{track.artist}</p>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <a
                  href={track.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={controlClass.quiet}
                >
                  官方页面
                </a>
                <button
                  type="button"
                  disabled={pending || index === 0}
                  onClick={() => onMove(track.id, -1)}
                  className={controlClass.quiet}
                >
                  上移
                </button>
                <button
                  type="button"
                  disabled={pending || index === tracks.length - 1}
                  onClick={() => onMove(track.id, 1)}
                  className={controlClass.quiet}
                >
                  下移
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onRemove(track.id)}
                  className={controlClass.danger}
                >
                  删除
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
