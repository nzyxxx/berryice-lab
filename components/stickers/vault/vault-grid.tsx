"use client";

import { EmptyState } from "@/components/gallery/empty-state";
import { pillClass } from "@/components/stickers/shared/pill";
import { StickerCard } from "@/components/stickers/shared/sticker-card";
import { TagChip } from "@/components/stickers/shared/tag-chip";
import type { VaultAction } from "@/components/stickers/vault/use-sticker-vault";
import { stickerTags, type Sticker, type StickerTag } from "@/data/stickers";
import { downloadSticker } from "@/lib/stickers/files";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

/**
 * 私人保险箱。过滤只改本组件的芯片状态，上下橱窗和下载交给上层。
 */
export function VaultGrid({
  stickers,
  pending,
  onToggleShowcase,
  onRemove,
}: {
  stickers: Sticker[];
  pending: VaultAction | null;
  onToggleShowcase: (id: string, next: Sticker["visibility"]) => void;
  onRemove: (id: string) => void;
}) {
  const [filter, setFilter] = useState<StickerTag | null>(null);
  const counts = useMemo(() => {
    const next: Record<StickerTag, number> = { 假笑崩: 0, VTuber: 0, 游戏反应: 0, 小莓自制: 0 };
    for (const sticker of stickers) for (const tag of sticker.tags) next[tag] += 1;
    return next;
  }, [stickers]);
  const visible = filter ? stickers.filter((s) => s.tags.includes(filter)) : stickers;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <TagChip label="全部" active={filter === null} count={stickers.length} onToggle={() => setFilter(null)} />
        {stickerTags.map((tag) => (
          <TagChip
            key={tag}
            label={tag}
            active={filter === tag}
            count={counts[tag]}
            onToggle={() => setFilter((cur) => (cur === tag ? null : tag))}
          />
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          className="mt-5"
          title={filter ? `没有「${filter}」` : "保险箱还是空的"}
          description={filter ? "换一个标签，或者先去工坊做一张。" : "工坊做完的表情会先落在这里。"}
        />
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((sticker, index) => {
            const itemBusy = pending?.kind === "item" && pending.id === sticker.id;
            const showcase = sticker.visibility === "showcase";
            return (
              <StickerCard
                key={sticker.id}
                sticker={sticker}
                index={index}
                actions={
                  <>
                    <button
                      type="button"
                      disabled={itemBusy}
                      onClick={() => onToggleShowcase(sticker.id, showcase ? "private" : "showcase")}
                      className={pillClass(showcase ? "ghost" : "secondary", "px-4")}
                    >
                      {itemBusy ? <Loader2 className="size-4 animate-spin" /> : null}
                      {showcase ? "下橱窗" : "上橱窗"}
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadSticker(sticker.src, sticker.title)}
                      className={pillClass("secondary", "px-4")}
                    >
                      下载微信包
                    </button>
                    {sticker.id.startsWith("demo-") ? null : (
                      <button
                        type="button"
                        disabled={itemBusy}
                        onClick={() => onRemove(sticker.id)}
                        className={pillClass("ghost")}
                      >
                        移出
                      </button>
                    )}
                  </>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
