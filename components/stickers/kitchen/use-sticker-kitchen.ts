"use client";

import type { StickerTag } from "@/data/stickers";
import {
  estimateWechatBytes,
  fetchSource,
  makeWechatSticker,
  PipelineError,
  probeSource,
  type SourceProbe,
  type WechatSticker,
} from "@/lib/stickers/wechat-pipeline";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 工坊的状态机。只往前走：
 *
 *   empty → reading → ready → converting → converted
 *
 * reading / converting 期间所有指令都被锁拒绝（ref 锁挡住同一帧里的连点，phase 给按钮置灰）。
 * 出错时退回进来之前的稳定状态，不丢已经读好的素材。
 */
export type KitchenPhase = "empty" | "reading" | "ready" | "converting" | "converted";

export interface KitchenSource {
  file: File;
  previewUrl: string;
  probe: SourceProbe;
  estimateBytes: number;
  origin: "upload" | "link";
}

export interface KitchenResult extends WechatSticker {
  previewUrl: string;
}

export interface KitchenState {
  phase: KitchenPhase;
  source: KitchenSource | null;
  result: KitchenResult | null;
  title: string;
  tags: StickerTag[];
  error: string | null;
}

const INITIAL: KitchenState = { phase: "empty", source: null, result: null, title: "", tags: [], error: null };

function titleFromName(name: string): string {
  const base = name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").trim();
  return base.slice(0, 24) || "未命名表情";
}

function messageOf(error: unknown): string {
  if (error instanceof PipelineError) return error.message;
  return "处理失败了，换一张试试。";
}

export function useStickerKitchen() {
  const [state, setState] = useState<KitchenState>(INITIAL);
  const busy = useRef(false);
  const urls = useRef<{ source?: string; result?: string }>({});

  const swapUrl = useCallback((slot: "source" | "result", next?: string) => {
    const prev = urls.current[slot];
    if (prev && prev !== next) URL.revokeObjectURL(prev);
    urls.current[slot] = next;
  }, []);

  useEffect(() => {
    const held = urls.current;
    return () => {
      if (held.source) URL.revokeObjectURL(held.source);
      if (held.result) URL.revokeObjectURL(held.result);
    };
  }, []);

  const intake = useCallback(
    async (load: () => Promise<File>, origin: KitchenSource["origin"]) => {
      if (busy.current) return;
      busy.current = true;
      setState((s) => ({ ...s, phase: "reading", error: null }));
      try {
        const file = await load();
        const probe = await probeSource(file);
        const previewUrl = URL.createObjectURL(file);
        swapUrl("source", previewUrl);
        swapUrl("result");
        setState((s) => ({
          ...s,
          phase: "ready",
          source: { file, previewUrl, probe, estimateBytes: estimateWechatBytes(file.size, probe), origin },
          result: null,
          title: titleFromName(file.name),
          error: null,
        }));
      } catch (error) {
        setState((s) => ({ ...s, phase: s.result ? "converted" : s.source ? "ready" : "empty", error: messageOf(error) }));
      } finally {
        busy.current = false;
      }
    },
    [swapUrl]
  );

  const intakeFile = useCallback((file: File) => intake(async () => file, "upload"), [intake]);
  const intakeUrl = useCallback(
    (url: string, title?: string) =>
      intake(async () => {
        const file = await fetchSource(url);
        if (!title) return file;
        return new File([file], `${title}.gif`, { type: file.type || "image/gif" });
      }, "link"),
    [intake]
  );

  const convert = useCallback(async () => {
    const source = state.source;
    if (busy.current || !source || state.phase !== "ready") return;
    busy.current = true;
    setState((s) => ({ ...s, phase: "converting", error: null }));
    try {
      const sticker = await makeWechatSticker(source.file);
      const previewUrl = URL.createObjectURL(sticker.blob);
      swapUrl("result", previewUrl);
      setState((s) => ({ ...s, phase: "converted", result: { ...sticker, previewUrl } }));
    } catch (error) {
      setState((s) => ({ ...s, phase: "ready", error: messageOf(error) }));
    } finally {
      busy.current = false;
    }
  }, [state.source, state.phase, swapUrl]);

  const setTitle = useCallback((title: string) => {
    setState((s) => ({ ...s, title: title.slice(0, 24) }));
  }, []);

  const toggleTag = useCallback((tag: StickerTag) => {
    setState((s) => ({ ...s, tags: s.tags.includes(tag) ? s.tags.filter((t) => t !== tag) : [...s.tags, tag] }));
  }, []);

  const reset = useCallback(() => {
    if (busy.current) return;
    swapUrl("source");
    swapUrl("result");
    setState(INITIAL);
  }, [swapUrl]);

  return { state, intakeFile, intakeUrl, convert, setTitle, toggleTag, reset };
}
