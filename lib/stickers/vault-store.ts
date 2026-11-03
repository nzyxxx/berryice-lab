import {
  demoStickers,
  isTag,
  stickerTags,
  type Sticker,
  type StickerSource,
  type StickerVisibility,
} from "../../data/stickers";

/**
 * 私人保险箱的本机存储。原型阶段只有 localStorage，没有服务端：
 * 换浏览器、清缓存都会回到初始的示意表情。
 *
 * 存的东西：
 * - `items`：工坊里做的、投喂进来的表情，GIF 以 data: URL 内联（单张 ≤300KB，配额约 5MB）。
 * - `visibility`：示意表情的上/下橱窗覆盖。示意表情本身不落盘，只记开关。
 *
 * 对外是 `useSyncExternalStore` 那一套：subscribe / getSnapshot / getServerSnapshot。
 */

export const VAULT_STORAGE_KEY = "berryice.stickers.vault.v1";

export interface VaultRecord {
  items: Sticker[];
  visibility: Record<string, StickerVisibility>;
}

export type VaultWriteResult = { ok: true } | { ok: false; reason: "quota" | "unavailable" };

const EMPTY_RECORD: VaultRecord = { items: [], visibility: {} };
const VISIBILITIES: readonly StickerVisibility[] = ["private", "showcase"];
const SOURCES: readonly StickerSource[] = ["manual", "feed-stub"];
const demoIds = new Set(demoStickers.map((s) => s.id));

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSticker(value: unknown): Sticker | null {
  if (!isRecord(value)) return null;
  const { id, title, mood, tags, visibility, source, src, bytes, edge, frames, createdAt } = value;
  if (typeof id !== "string" || !id || demoIds.has(id)) return null;
  if (typeof title !== "string" || typeof mood !== "string") return null;
  if (!Array.isArray(tags) || !tags.every(isTag)) return null;
  if (!VISIBILITIES.includes(visibility as StickerVisibility)) return null;
  if (!SOURCES.includes(source as StickerSource)) return null;
  if (typeof src !== "string" || !(src.startsWith("data:image/gif") || src.startsWith("/stickers/"))) return null;
  if (typeof bytes !== "number" || typeof edge !== "number" || typeof frames !== "number") return null;
  if (typeof createdAt !== "string") return null;
  return {
    id,
    title,
    mood,
    tags: stickerTags.filter((t) => tags.includes(t)),
    visibility: visibility as StickerVisibility,
    source: source as StickerSource,
    src,
    bytes,
    edge,
    frames,
    createdAt,
  };
}

/** 坏掉或被手改过的存档不让页面崩，认不出的条目直接丢掉。 */
export function parseVaultRecord(raw: string | null): VaultRecord {
  if (!raw) return EMPTY_RECORD;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return EMPTY_RECORD;
  }
  if (!isRecord(parsed)) return EMPTY_RECORD;
  const items = Array.isArray(parsed.items)
    ? parsed.items.map(parseSticker).filter((s): s is Sticker => s !== null)
    : [];
  const visibility: Record<string, StickerVisibility> = {};
  if (isRecord(parsed.visibility)) {
    for (const [id, v] of Object.entries(parsed.visibility)) {
      if (demoIds.has(id) && VISIBILITIES.includes(v as StickerVisibility)) visibility[id] = v as StickerVisibility;
    }
  }
  return { items, visibility };
}

/** 保险箱里看到的完整列表：本机做的在前，示意表情在后，各自按时间倒序。 */
export function mergeVault(record: VaultRecord): Sticker[] {
  const own = [...record.items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const demos = demoStickers.map((s) => ({ ...s, visibility: record.visibility[s.id] ?? s.visibility }));
  return [...own, ...demos];
}

/** 同一个 id 第二次进来不覆盖、不重复，返回 created: false。 */
export function withSticker(record: VaultRecord, sticker: Sticker): { record: VaultRecord; created: boolean } {
  if (demoIds.has(sticker.id) || record.items.some((s) => s.id === sticker.id)) return { record, created: false };
  return { record: { ...record, items: [sticker, ...record.items] }, created: true };
}

export function withVisibility(record: VaultRecord, id: string, visibility: StickerVisibility): VaultRecord | null {
  if (demoIds.has(id)) return { ...record, visibility: { ...record.visibility, [id]: visibility } };
  if (!record.items.some((s) => s.id === id)) return null;
  return { ...record, items: record.items.map((s) => (s.id === id ? { ...s, visibility } : s)) };
}

export function withoutSticker(record: VaultRecord, id: string): VaultRecord | null {
  if (!record.items.some((s) => s.id === id)) return null;
  return { ...record, items: record.items.filter((s) => s.id !== id) };
}

// ---- 浏览器端的外部 store ----

const SERVER_SNAPSHOT: Sticker[] = mergeVault(EMPTY_RECORD);
let cachedRecord: VaultRecord | null = null;
let cachedSnapshot: Sticker[] = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();

function readRecord(): VaultRecord {
  if (cachedRecord) return cachedRecord;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(VAULT_STORAGE_KEY);
  } catch {
    raw = null;
  }
  cachedRecord = parseVaultRecord(raw);
  cachedSnapshot = mergeVault(cachedRecord);
  return cachedRecord;
}

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeVault(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== VAULT_STORAGE_KEY) return;
    cachedRecord = null;
    readRecord();
    emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getVaultSnapshot(): Sticker[] {
  readRecord();
  return cachedSnapshot;
}

export function getVaultServerSnapshot(): Sticker[] {
  return SERVER_SNAPSHOT;
}

/** 先写盘再改内存：写失败（配额满、隐私模式）时页面停在原状态，不出现「看着存了其实没存」。 */
export function commitVault(next: VaultRecord): VaultWriteResult {
  try {
    window.localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    const quota = error instanceof DOMException && (error.name === "QuotaExceededError" || error.code === 22);
    return { ok: false, reason: quota ? "quota" : "unavailable" };
  }
  cachedRecord = next;
  cachedSnapshot = mergeVault(next);
  emit();
  return { ok: true };
}

export function currentVaultRecord(): VaultRecord {
  return readRecord();
}
