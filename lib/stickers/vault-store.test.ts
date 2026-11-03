import assert from "node:assert/strict";
import { test } from "node:test";
import { demoStickers, type Sticker } from "../../data/stickers.ts";
import { simulateWebbyFeed } from "./ingest-stub.ts";
import { mergeVault, parseVaultRecord, withSticker, withVisibility, withoutSticker } from "./vault-store.ts";

function own(id: string, createdAt: string): Sticker {
  return {
    id,
    title: "测试",
    mood: "",
    tags: ["小莓自制"],
    visibility: "private",
    source: "manual",
    src: "data:image/gif;base64,R0lGODlh",
    bytes: 1024,
    edge: 240,
    frames: 1,
    createdAt,
  };
}

test("坏存档回到空保险箱，不抛", () => {
  for (const raw of [null, "", "{", "[]", '{"items":"x"}']) {
    assert.deepEqual(parseVaultRecord(raw), { items: [], visibility: {} });
  }
});

test("认不出的条目丢掉，认得出的留下", () => {
  const good = own("mine-1", "2026-11-01T00:00:00.000Z");
  const raw = JSON.stringify({
    items: [good, { ...good, id: "evil", src: "javascript:alert(1)" }, { ...good, id: "t", tags: ["乱写"] }],
    visibility: { [demoStickers[0].id]: "private", "not-a-demo": "showcase", [demoStickers[1].id]: "public" },
  });
  const record = parseVaultRecord(raw);
  assert.deepEqual(record.items.map((s) => s.id), ["mine-1"]);
  assert.deepEqual(record.visibility, { [demoStickers[0].id]: "private" });
});

test("合并：本机做的在前，示意表情带上橱窗覆盖", () => {
  const record = {
    items: [own("old", "2026-11-01T00:00:00.000Z"), own("new", "2026-11-02T00:00:00.000Z")],
    visibility: { [demoStickers[0].id]: "private" as const },
  };
  const merged = mergeVault(record);
  assert.deepEqual(merged.slice(0, 2).map((s) => s.id), ["new", "old"]);
  assert.equal(merged.length, 2 + demoStickers.length);
  assert.equal(merged.find((s) => s.id === demoStickers[0].id)?.visibility, "private");
});

test("投喂幂等：同一事件第二次不重复入库", () => {
  const first = withSticker({ items: [], visibility: {} }, simulateWebbyFeed());
  assert.equal(first.created, true);
  const second = withSticker(first.record, simulateWebbyFeed());
  assert.equal(second.created, false);
  assert.equal(second.record, first.record);
  assert.equal(second.record.items.length, 1);
});

test("上下橱窗和删除只认存在的 id，示意表情不可删", () => {
  const base = { items: [own("mine", "2026-11-01T00:00:00.000Z")], visibility: {} };
  assert.equal(withVisibility(base, "mine", "showcase")?.items[0].visibility, "showcase");
  assert.equal(withVisibility(base, demoStickers[2].id, "showcase")?.visibility[demoStickers[2].id], "showcase");
  assert.equal(withVisibility(base, "ghost", "showcase"), null);
  assert.equal(withoutSticker(base, demoStickers[0].id), null);
  assert.deepEqual(withoutSticker(base, "mine")?.items, []);
});
