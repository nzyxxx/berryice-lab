import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const { createDafeiyuHost } = require("../../public/dafeiyu/helper/local-host.js") as {
  createDafeiyuHost: (options?: {
    random?: () => number;
    names?: () => { start: string; loop: string; end: string } | null;
    texts?: () => { start: string[]; end: string[] };
  }) => {
    snapshot: () => { counter: number; pets: Record<string, Record<string, { data: unknown }>> };
    wait: (since: number, timeoutMs: number) => Promise<void>;
    post: (rest: string, petId?: string) => { ok: boolean; changed?: boolean; sleeping?: boolean; reason?: string };
  };
};

const names = { start: "睡觉-开始", loop: "睡觉-循环", end: "睡觉-起来" };

function host() {
  return createDafeiyuHost({
    random: () => 0,
    names: () => names,
    texts: () => ({ start: ["睡了"], end: ["醒了"] }),
  });
}

test("睡觉第二次是幂等的，不把动画从头再放一遍", () => {
  const pet = host();
  const first = pet.post("sleep", "main");
  const second = pet.post("sleep", "main");
  assert.equal(first.ok, true);
  assert.equal(first.changed, true);
  assert.equal(second.changed, false);
  const snap = pet.snapshot();
  assert.equal((snap.pets.main.sleep.data as { sleeping: boolean }).sleeping, true);
  assert.equal((snap.pets.main.say.data as { text: string }).text, "睡了");
  assert.equal((snap.pets.main.say.data as { anim: boolean }).anim, false);
});

test("没睡的时候叫醒也是成功，不写新叶子", () => {
  const pet = host();
  const woke = pet.post("wake", "main");
  assert.equal(woke.ok, true);
  assert.equal(woke.changed, false);
  assert.deepEqual(pet.snapshot().pets, {});
});

test("醒来会把睡觉叶子写成 false", () => {
  const pet = host();
  pet.post("sleep", "main");
  const woke = pet.post("wake", "main");
  assert.equal(woke.changed, true);
  assert.equal((pet.snapshot().pets.main.sleep.data as { sleeping: boolean }).sleeping, false);
  assert.equal((pet.snapshot().pets.main.say.data as { text: string }).text, "醒了");
});

test("未知宠物不写状态", () => {
  const pet = host();
  const result = pet.post("sleep", "other");
  assert.equal(result.ok, false);
  assert.equal(result.reason, "unknown-pet");
  assert.equal(pet.snapshot().counter, 0);
});

test("版本没变时长轮询会挂起，叶子一写就醒来", async () => {
  const pet = host();
  const started = Date.now();
  const pending = pet.wait(pet.snapshot().counter, 2000);
  setTimeout(() => pet.post("sleep", "main"), 30);
  await pending;
  assert.ok(Date.now() - started < 500);
  assert.equal((pet.snapshot().pets.main.sleep.data as { start: string }).start, "睡觉-开始");
});
