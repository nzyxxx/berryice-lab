"use client";

import { SectionZone } from "@/components/gallery/section-zone";
import { FeedSlot } from "@/components/stickers/feed/feed-slot";
import { KitchenBench } from "@/components/stickers/kitchen/kitchen-bench";
import { useStickerKitchen } from "@/components/stickers/kitchen/use-sticker-kitchen";
import { ShelfGrid } from "@/components/stickers/shelf/shelf-grid";
import { VaultGrid } from "@/components/stickers/vault/vault-grid";
import { useStickerVault } from "@/components/stickers/vault/use-sticker-vault";
import { glassSurfaceClass } from "@/components/uiverse/glass-surface";
import { cn } from "@/lib/utils";

const ANCHORS = [
  { href: "#kitchen", label: "工坊" },
  { href: "#vault", label: "保险箱" },
  { href: "#shelf", label: "橱窗" },
  { href: "#feed", label: "投喂入库" },
] as const;

/**
 * 表情工坊总控。工坊状态机、保险箱读写、橱窗陈列、投喂示意都在这里拼，
 * 底层组件不互相调用。
 */
export function StickerStudio() {
  const kitchen = useStickerKitchen();
  const vault = useStickerVault();

  const saveConverted = () => {
    const { result, title, tags } = kitchen.state;
    if (!result) return;
    void vault.save({
      blob: result.blob,
      title,
      tags,
      bytes: result.bytes,
      edge: result.edge,
      frames: result.frames,
    });
  };

  return (
    <>
      <nav aria-label="表情工坊分区" className="mt-8 flex flex-wrap gap-2">
        {ANCHORS.map((anchor) => (
          <a
            key={anchor.href}
            href={anchor.href}
            className={cn(
              glassSurfaceClass(),
              "inline-flex min-h-11 items-center rounded-full px-4 text-sm text-lab-ink-muted",
              "transition-[color,transform] duration-200 hover:-translate-y-0.5 hover:text-lab-ink",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lab-primary/40"
            )}
          >
            {anchor.label}
          </a>
        ))}
      </nav>

      {vault.notice ? (
        <p
          role="status"
          className={cn(
            glassSurfaceClass(),
            "mt-6 flex min-h-11 items-center justify-between gap-3 rounded-2xl px-4 text-sm",
            vault.notice.tone === "ok" ? "text-lab-ink" : "text-lab-error"
          )}
        >
          <span>{vault.notice.text}</span>
          <button
            type="button"
            onClick={vault.dismissNotice}
            className="min-h-11 shrink-0 px-2 text-xs text-lab-ink-subtle hover:text-lab-ink"
          >
            知道了
          </button>
        </p>
      ) : null}

      <SectionZone
        id="kitchen"
        index="02"
        label="Bench"
        title="工坊"
        description="拖进动图或贴链接，裁成方形、压进 300KB。素材不出这台浏览器。"
        className="mt-12 scroll-mt-20"
      >
        <KitchenBench kitchen={kitchen} saving={vault.pending?.kind === "save"} onSave={saveConverted} />
      </SectionZone>

      <SectionZone
        id="vault"
        index="03"
        label="Vault"
        title="私人保险箱"
        description="自己做的、投喂进来的，都先落在这里。按心情标签翻。"
        className="mt-16 scroll-mt-20"
      >
        <VaultGrid
          stickers={vault.stickers}
          pending={vault.pending}
          onToggleShowcase={(id, visibility) => void vault.setVisibility(id, visibility)}
          onRemove={(id) => void vault.remove(id)}
        />
      </SectionZone>

      <SectionZone
        id="shelf"
        index="04"
        label="Shelf"
        title="公开橱窗"
        description="BerryIce 品牌橱窗。只陈列从保险箱里挑出来的那几张。"
        className="mt-16 scroll-mt-20"
      >
        <ShelfGrid stickers={vault.stickers} />
      </SectionZone>

      <SectionZone
        id="feed"
        index="05"
        label="Ingest"
        title="投喂入库"
        description="知识库旁路。Webby 整理完的表情以后从这里进保险箱。"
        className="mt-16 scroll-mt-20"
      >
        <FeedSlot busy={vault.pending?.kind === "feed"} onSimulate={() => void vault.feedFromWebby()} />
      </SectionZone>
    </>
  );
}
