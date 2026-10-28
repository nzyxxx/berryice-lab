"use client";

import { moodAfterReply, pullSseEvents, type XiaomeiChatTurn } from "@/lib/xiaomei-chat";
import { useCallback, useEffect, useRef, useState } from "react";

export type XiaomeiChatStatus = "idle" | "thinking" | "done" | "error";

type ThreadMessage = XiaomeiChatTurn & { failed?: boolean };

const FALLBACK = "线断了。不是我不会，是这会儿没接上。";

export function useXiaomeiChat() {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<XiaomeiChatStatus>("idle");
  const [replyMood, setReplyMood] = useState<"happy" | "annoyed">("happy");
  const lock = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  });

  const resetFace = useCallback(() => {
    setStatus("idle");
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const send = useCallback(async (text: string) => {
    const content = text.trim();
    if (!content || lock.current) return false;
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

      if (!accumulated.trim()) throw new Error("……我听到了。你再说一遍？");
      setReplyMood(moodAfterReply(accumulated));
      setStatus("done");
      return true;
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === "AbortError";
      const message = aborted
        ? "等太久了。先这样，你过会儿再问。"
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
  }, []);

  return { messages, pending, status, replyMood, send, stop, resetFace };
}
