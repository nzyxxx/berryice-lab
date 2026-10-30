"use client";

import { isXiaomeiJailbreak, moodAfterReply, pullSseEvents, type XiaomeiChatTurn } from "@/lib/xiaomei-chat";
import { createCelebrateEdge, sceneBucket } from "@/lib/xiaomei-fsm";
import { pickXiaomeiLine, XIAOMEI_SCENE_PIN_MS } from "@/lib/xiaomei-lines";
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
  const [sceneLine, setSceneLine] = useState<string | null>(null);
  const [replyMood, setReplyMood] = useState<"happy" | "annoyed">("happy");
  /** 真回合边沿庆祝脉冲：仅 thinking→done 成功一次；取消/断线为 null。 */
  const [celebratePulse, setCelebratePulse] = useState<"cheer" | "sigh" | null>(null);
  const lock = useRef(false);
  const faceTimer = useRef<number | null>(null);
  const pulseTimer = useRef<number | null>(null);
  const sceneLineRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const celebrateEdge = useRef(createCelebrateEdge());
  const abortedRef = useRef(false);
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

  const clearFaceTimer = useCallback(() => {
    if (faceTimer.current == null) return;
    window.clearTimeout(faceTimer.current);
    faceTimer.current = null;
  }, []);

  const clearPulseTimer = useCallback(() => {
    if (pulseTimer.current == null) return;
    window.clearTimeout(pulseTimer.current);
    pulseTimer.current = null;
  }, []);

  const pinStatus = useCallback(
    (next: "thinking" | "done" | "error", opts?: { aborted?: boolean; replyMood?: "happy" | "annoyed" }) => {
      clearFaceTimer();
      clearPulseTimer();
      // Round2 Knife B：场景桶钉词；thinking 不抽 idle 开心句。
      const bucket = sceneBucket(next, opts?.replyMood ?? "happy");
      const text = pickXiaomeiLine(bucket.lines, sceneLineRef.current ?? undefined);
      sceneLineRef.current = text;
      setSceneLine(text);
      const pulse = celebrateEdge.current.observe(next, {
        aborted: opts?.aborted ?? abortedRef.current,
        replyMood: opts?.replyMood,
      });
      // 脉冲窗口未结束不叠第二下，避免 cue class 连闪。
      if (pulse && pulseTimer.current == null) {
        setCelebratePulse(pulse);
        pulseTimer.current = window.setTimeout(() => {
          pulseTimer.current = null;
          setCelebratePulse(null);
        }, XIAOMEI_SCENE_PIN_MS);
      } else if (!pulse) {
        setCelebratePulse(null);
      }
      setStatus(next);
      if (next === "thinking") {
        abortedRef.current = false;
        return;
      }
      faceTimer.current = window.setTimeout(() => {
        faceTimer.current = null;
        sceneLineRef.current = null;
        setSceneLine(null);
        setCelebratePulse(null);
        setStatus("idle");
        celebrateEdge.current.observe("idle");
      }, XIAOMEI_SCENE_PIN_MS);
    },
    [clearFaceTimer, clearPulseTimer],
  );

  const resetFace = useCallback(() => {
    clearFaceTimer();
    clearPulseTimer();
    sceneLineRef.current = null;
    setSceneLine(null);
    setCelebratePulse(null);
    setStatus("idle");
    celebrateEdge.current.reset();
    abortedRef.current = false;
  }, [clearFaceTimer, clearPulseTimer]);

  useEffect(
    () => () => {
      clearFaceTimer();
      clearPulseTimer();
    },
    [clearFaceTimer, clearPulseTimer],
  );

  const stop = useCallback(() => {
    abortedRef.current = true;
    abortRef.current?.abort();
  }, []);

  const begin = useCallback(async (text: string) => {
    const content = text.trim();
    if (!content || lock.current) return false;
    pullStored();
    lock.current = true;
    setPending(true);
    pinStatus("thinking");

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
      const mood = moodAfterReply(accumulated);
      setReplyMood(mood);
      pinStatus("done", { replyMood: mood, aborted: false });
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
      pinStatus("error", { replyMood: "annoyed", aborted: abortedRef.current });
      return true;
    } finally {
      window.clearTimeout(timer);
      lock.current = false;
      setPending(false);
      abortRef.current = null;
    }
  }, [pinStatus, pullStored]);

  const send = useCallback((text: string) => begin(text), [begin]);

  const retry = useCallback(() => {
    if (lock.current) return Promise.resolve(false);
    const thread = messagesRef.current;
    const last = thread[thread.length - 1];
    if (!last?.failed) return Promise.resolve(false);
    let userIndex = -1;
    for (let index = thread.length - 2; index >= 0; index -= 1) {
      if (thread[index]?.role === "user") {
        userIndex = index;
        break;
      }
    }
    const content = userIndex >= 0 ? thread[userIndex]?.content ?? "" : "";
    if (!content) return Promise.resolve(false);
    messagesRef.current = thread.slice(0, userIndex);
    setMessages(messagesRef.current);
    return begin(content);
  }, [begin]);

  return {
    messages,
    pending,
    status,
    sceneLine,
    replyMood,
    celebratePulse,
    send,
    retry,
    stop,
    resetFace,
  };
}
