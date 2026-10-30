/**
 * 最近一条共同经历。从已经记下的对话、记忆、开工手记里挑一句给人看。
 * 不记新账，不做数值。有对话就用最后一轮有内容的你来我往；
 * 没有对话才用最近一条记忆；再没有才用手记里的「上次坑」。
 * 称呼默认值、站规、不喜欢，不算一起经历过的事。
 */

import { isXiaomeiJailbreak, type XiaomeiChatTurn } from "./xiaomei-chat";
import { memoryNotesForDrawer, plainMemoryLine, type XiaomeiMemoryNote } from "./xiaomei-memory";
import { sanitizeXiaomeiNapkin, type XiaomeiNapkin } from "./xiaomei-napkin";

const SIDE_CHARS = 16;

export type XiaomeiSharedMoment = {
  text: string;
  source: "chat" | "note" | "napkin";
};

function isSecret(text: string): boolean {
  return /密钥|密码|api[_-]?key|\bsk-[a-z0-9]/i.test(text);
}

function clipSide(text: string): string {
  const clean = text.replace(/\s+/g, " ").replace(/[「」]/g, "").trim();
  const chars = [...clean];
  if (chars.length <= SIDE_CHARS) return clean;
  return `${chars.slice(0, SIDE_CHARS).join("")}…`;
}

function meaningful(text: string): boolean {
  const side = clipSide(text);
  const words = side.replace(/[.…。！？!?，,、\s]/g, "");
  return [...words].length >= 2 && !isXiaomeiJailbreak(text) && !isSecret(text);
}

function chatBeat(turns: readonly XiaomeiChatTurn[]): XiaomeiSharedMoment | null {
  for (let index = turns.length - 1; index >= 0; index -= 1) {
    const turn = turns[index];
    if (!turn || turn.role !== "user" || !meaningful(turn.content)) continue;
    const user = clipSide(turn.content);
    const next = turns[index + 1];
    const reply = next?.role === "assistant" && meaningful(next.content) ? clipSide(next.content) : "";
    const text = reply ? `你说「${user}」，她回「${reply}」。` : `你说「${user}」。`;
    return { text, source: "chat" };
  }
  return null;
}

function noteBeat(topics: readonly XiaomeiMemoryNote[], userName: string): XiaomeiSharedMoment | null {
  const drawer = memoryNotesForDrawer({ userName, topics });
  const ordered = [...drawer.facts, ...drawer.events];
  let bestText = "";
  let bestAt = Number.NEGATIVE_INFINITY;
  let bestRank = Number.POSITIVE_INFINITY;
  for (let index = 0; index < ordered.length; index += 1) {
    const note = ordered[index];
    if (!note) continue;
    const line = plainMemoryLine(note.summary);
    if (!meaningful(line)) continue;
    const at = typeof note.at === "number" && Number.isFinite(note.at) ? note.at : 0;
    if (at > bestAt || (at === bestAt && index < bestRank)) {
      bestText = line;
      bestAt = at;
      bestRank = index;
    }
  }
  if (!bestText) return null;
  return { text: bestText, source: "note" };
}

function napkinBeat(napkin: XiaomeiNapkin | null | undefined): XiaomeiSharedMoment | null {
  const pit = sanitizeXiaomeiNapkin(napkin).lastPit.trim();
  if (!meaningful(pit)) return null;
  return { text: `上次坑：${clipSide(pit)}`, source: "napkin" };
}

/** 挑一句。什么都没有就 null，调用方自己说「还没有」。 */
export function latestSharedMoment(input: {
  turns?: readonly XiaomeiChatTurn[] | null;
  topics?: readonly XiaomeiMemoryNote[] | null;
  userName?: string | null;
  napkin?: XiaomeiNapkin | null;
}): XiaomeiSharedMoment | null {
  const turns = input.turns ?? [];
  const chat = chatBeat(turns);
  if (chat) return chat;
  const note = noteBeat(input.topics ?? [], input.userName?.trim() ?? "");
  if (note) return note;
  return napkinBeat(input.napkin);
}
