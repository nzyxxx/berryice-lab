"use client";

import { EmptyState } from "@/components/gallery/empty-state";
import { pillClass } from "@/components/stickers/shared/pill";
import { StickerCard } from "@/components/stickers/shared/sticker-card";
import type { Sticker } from "@/data/stickers";
import { downloadSticker } from "@/lib/stickers/files";

/** BerryIce 品牌橱窗。只陈列 visibility === showcase 的表情，不在这里改可见性。 */
export function ShelfGrid({ stickers }: { stickers: Sticker[] }) {
  const shelf = stickers.filter((s) => s.visibility === "showcase");

  if (shelf.length === 0) {
    return (
      <EmptyState
        title="橱窗还空着"
        description="从保险箱里挑几张「上橱窗」。这里是对外的品牌陈列，不是演示列表。"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {shelf.map((sticker, index) => (
        <StickerCard
          key={sticker.id}
          sticker={sticker}
          index={index}
          actions={
            <button
              type="button"
              onClick={() => downloadSticker(sticker.src, sticker.title)}
              className={pillClass("secondary", "px-4")}
            >
              下载微信包
            </button>
          }
        />
      ))}
    </div>
  );
}
