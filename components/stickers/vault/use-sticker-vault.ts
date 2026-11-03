"use client";

import type { Sticker, StickerTag, StickerVisibility } from "@/data/stickers";
import { blobToDataUrl } from "@/lib/stickers/files";
import { simulateWebbyFeed } from "@/lib/stickers/ingest-stub";
import {
  commitVault,
  currentVaultRecord,
  getVaultServerSnapshot,
  getVaultSnapshot,
  subscribeVault,
  withSticker,
  withVisibility,
  withoutSticker,
  type VaultWriteResult,
} from "@/lib/stickers/vault-store";
import { useCallback, useRef, useState, useSyncExternalStore } from "react";

export type VaultAction = { kind: "save" } | { kind: "feed" } | { kind: "item"; id: string };

export interface VaultNotice {
  tone: "ok" | "error";
  text: string;
}

export interface SaveInput {
  blob: Blob;
  title: string;
  tags: StickerTag[];
  bytes: number;
  edge: number;
  frames: number;
}

const FEED_LATENCY_MS = 600;

function newId(): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `mine-${Date.now().toString(36)}-${random}`;
}

function failureText(result: Extract<VaultWriteResult, { ok: false }>): string {
  return result.reason === "quota"
    ? "保险箱满了：原型存在本机浏览器，大约 5MB。删掉几张再存。"
    : "这台浏览器不让写本地存储（可能是隐私模式），没存上。";
}

/**
 * 保险箱的读写。所有写操作共用一把锁：一次只跑一个，进行中的再点直接忽略。
 * 写盘失败时内存不动，页面停在原状态并给出提示。
 */
export function useStickerVault() {
  const stickers = useSyncExternalStore(subscribeVault, getVaultSnapshot, getVaultServerSnapshot);
  const [pending, setPending] = useState<VaultAction | null>(null);
  const [notice, setNotice] = useState<VaultNotice | null>(null);
  const busy = useRef(false);

  const run = useCallback(async <T,>(action: VaultAction, task: () => Promise<T> | T): Promise<T | null> => {
    if (busy.current) return null;
    busy.current = true;
    setPending(action);
    try {
      return await task();
    } finally {
      busy.current = false;
      setPending(null);
    }
  }, []);

  const save = useCallback(
    (input: SaveInput) =>
      run({ kind: "save" }, async (): Promise<Sticker | null> => {
        let src: string;
        try {
          src = await blobToDataUrl(input.blob);
        } catch {
          setNotice({ tone: "error", text: "读不出做好的 GIF，再做一次试试。" });
          return null;
        }
        const sticker: Sticker = {
          id: newId(),
          title: input.title.trim() || "未命名表情",
          mood: "工坊里做的",
          tags: input.tags,
          visibility: "private",
          source: "manual",
          src,
          bytes: input.bytes,
          edge: input.edge,
          frames: input.frames,
          createdAt: new Date().toISOString(),
        };
        const { record } = withSticker(currentVaultRecord(), sticker);
        const result = commitVault(record);
        if (!result.ok) {
          setNotice({ tone: "error", text: failureText(result) });
          return null;
        }
        setNotice({ tone: "ok", text: `「${sticker.title}」收进保险箱了。` });
        return sticker;
      }),
    [run]
  );

  const setVisibility = useCallback(
    (id: string, visibility: StickerVisibility) =>
      run({ kind: "item", id }, () => {
        const next = withVisibility(currentVaultRecord(), id, visibility);
        if (!next) return false;
        const result = commitVault(next);
        if (!result.ok) setNotice({ tone: "error", text: failureText(result) });
        return result.ok;
      }),
    [run]
  );

  const remove = useCallback(
    (id: string) =>
      run({ kind: "item", id }, () => {
        const next = withoutSticker(currentVaultRecord(), id);
        if (!next) return false;
        const result = commitVault(next);
        if (!result.ok) setNotice({ tone: "error", text: failureText(result) });
        return result.ok;
      }),
    [run]
  );

  const feedFromWebby = useCallback(
    () =>
      run({ kind: "feed" }, async () => {
        await new Promise((resolve) => setTimeout(resolve, FEED_LATENCY_MS));
        const { record, created } = withSticker(currentVaultRecord(), simulateWebbyFeed());
        if (!created) {
          setNotice({ tone: "ok", text: "这次投喂已经在保险箱里了，没有重复入库。" });
          return false;
        }
        const result = commitVault(record);
        if (!result.ok) {
          setNotice({ tone: "error", text: failureText(result) });
          return false;
        }
        setNotice({ tone: "ok", text: "Webby 投喂了一张，已进保险箱（示意）。" });
        return true;
      }),
    [run]
  );

  const dismissNotice = useCallback(() => setNotice(null), []);

  return { stickers, pending, notice, save, setVisibility, remove, feedFromWebby, dismissNotice };
}
