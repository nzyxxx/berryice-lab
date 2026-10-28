"use client";

import { isXiaomeiJailbreak, moodAfterReply, pullSseEvents, type XiaomeiChatTurn } from "@/lib/xiaomei-chat";
import { readXiaomeiMemory, rememberThread, writeXiaomeiMemory } from "@/lib/xiaomei-memory";
import { XIAOMEI_METER_DEFAULT } from "@/lib/xiaomei-meters";
import { useCallback, useEffect, useRef, useState } from "react";

export type XiaomeiChatStatus = "idle" | "thinking" | "done" | "error";

type ThreadMessage = XiaomeiChatTurn & { failed?: boolean };

const FALLBACK = "线断了啦。不是我不会，是这会儿没接上。";

type XiaomeiChatOptions = {
  getMeters?: () => { affection: number; fullness: number; feedCountToday?: number };
  onReplied?: () => void;
};

export function useXiaomeiChat(options?: XiaomeiChatOptions) {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<XiaomeiChatStatus>("idle");
  const [replyMood, setReplyMood] = useState<"happy" | "annoyed">("happy");
  const lock = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef(messages);
  const hooksRef = useRef(options);
  const hydrated = useRef(false);
  hooksRef.current = options;

  const pullStored = useCallback(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    if (messagesRef.current.some((item) => item.content.trim())) return;
    const stored = readXiaomeiMemory().turns;
    if (stored.length === 0) return;
    messagesRef.current = stored;
    setMessages(stored);
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
  });

  useEffect(() => {
    pullStored();
  }, [pullStored]);

  const resetFace = useCallback(() => {
    setStatus("idle");
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const send = useCallback(async (text: string) => {
    const content = text.trim();
    if (!content || lock.current) return false;
    pullStored();
    lock.current = true;
    setPending(true);
    setStatus("thinking");

    const history: ThreadMessage[] = [
      ...messagesRef.current.filter((item) => !item.failed),
      { role: "user", content },
    ];
    messagesRef.current = [...history, { role: "assistant", content: "" }];
    setMessages(messagesRef.current);

    const controller = new AbortController();
    abortRef.current = controller;
    const timer = window.setTimeout(() => controller.abort(), 30_000);
    let accumulated = "";

    const writeAssistant = (next: string, failed = false) => {
      const thread = messagesRef.current.slice();
      const last = thread[thread.length - 1];
      if (last?.role === "assistant") {
        thread[thread.length - 1] = { role: "assistant", content: next, failed };
      }
      messagesRef.current = thread;
      setMessages(thread);
    };

    try {
      const response = await fetch("/api/xiaomei/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.slice(-16).map(({ role, content: line }) => ({ role, content: line })),
          memory: (() => {
            const live = hooksRef.current?.getMeters?.();
            const stored = readXiaomeiMemory();
            return {
              affection: live?.affection ?? XIAOMEI_METER_DEFAULT.affection,
              fullness: live?.fullness ?? XIAOMEI_METER_DEFAULT.fullness,
              feedCountToday: live?.feedCountToday ?? 0,
              userName: stored.userName,
              topics: stored.topics,
            };
          })(),
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const data = (await response.json().catch(() => null)) as { error?: unknown } | null;
        const message = data && typeof data.error === "string" ? data.error : FALLBACK;
        throw new Error(message);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const pulled = pullSseEvents(buffer);
        buffer = pulled.rest;
        for (const event of pulled.events) {
          if (event.error) throw new Error(event.error);
          if (event.delta) {
            accumulated += event.delta;
            writeAssistant(accumulated);
          }
        }
      }

      if (!accumulated.trim()) throw new Error("……我听到了啦。你再说一遍？");
      setReplyMood(moodAfterReply(accumulated));
      setStatus("done");
      const stored = readXiaomeiMemory();
      writeXiaomeiMemory(rememberThread(stored, content, accumulated.trim()));
      if (!isXiaomeiJailbreak(content)) hooksRef.current?.onReplied?.();
      return true;
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === "AbortError";
      const message = aborted
        ? "等太久了啦。你过会儿再来问我。"
        : error instanceof Error && error.message
          ? error.message
          : FALLBACK;
      writeAssistant(accumulated.trim() ? `${accumulated}\n${message}` : message, true);
      setReplyMood("annoyed");
      setStatus("error");
      return true;
    } finally {
      window.clearTimeout(timer);
      lock.current = false;
      setPending(false);
      abortRef.current = null;
    }
  }, [pullStored]);

  return { messages, pending, status, replyMood, send, stop, resetFace };
}
