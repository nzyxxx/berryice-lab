"use client";

import { EmptyState } from "@/components/gallery/empty-state";
import { pillClass } from "@/components/stickers/shared/pill";
import { PrototypeNote } from "@/components/stickers/shared/prototype-note";
import { Loader2 } from "lucide-react";

/**
 * 投喂入库的预留位。真写入还没接线，按钮只走客户端示意，
 * 请求形状写在 `lib/stickers/ingest-stub.ts`，对齐 `/api/wiki/ingest`。
 */
export function FeedSlot({
  busy,
  onSimulate,
}: {
  busy: boolean;
  onSimulate: () => void;
}) {
  return (
    <div className="space-y-4">
      <EmptyState
        title="投喂还没接线"
        description="以后 Webby 整理完的表情会 POST /api/stickers/ingest，约定和知识库的 /api/wiki/ingest 同一套：口令、幂等、默认进保险箱。这一期不改 wiki ingest。"
        action={
          <button type="button" disabled={busy} onClick={onSimulate} className={pillClass("secondary")}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            模拟 Webby 投喂
          </button>
        }
      />
      <PrototypeNote>
        「模拟 Webby 投喂」只往本机保险箱塞一张标了 feed-stub 的示意表情，不发请求、不写服务器。同一事件再点一次不会重复入库。
      </PrototypeNote>
    </div>
  );
}
