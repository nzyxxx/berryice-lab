import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { communityCopyText, filterCommunityCodes } from "./community-filter.ts";

test("生产只读样本可以搜索、按武器筛选，并复制原枪码", async () => {
  const file = JSON.parse(
    await readFile(path.join(process.cwd(), "lib/delta-gun/community-sample.json"), "utf8")
  ) as {
    source: string;
    sampledAt: string;
    data: { weapon: string; fullCode: string; description: string; valueText: string }[];
  };
  assert.equal(file.source, "https://berryice.cn/api/gun-codes?limit=8");
  assert.match(file.sampledAt, /^2026-11-19T/);
  assert.equal(file.data.length, 8);

  const typeOf = (weapon: string) => (weapon.includes("SR-25") ? "sniper" : "assault");
  const sniper = filterCommunityCodes(file.data, { q: "SR-25", category: "sniper", weapon: "all", sort: "hot" }, typeOf);
  assert.equal(sniper.length, 1);
  assert.equal(communityCopyText(sniper[0]!), sniper[0]!.fullCode);
  assert.match(sniper[0]!.fullCode, /^[A-Z0-9]+$/);

  const none = filterCommunityCodes(file.data, {
    q: "不可能存在的枪码zzz",
    category: "all",
    weapon: "all",
    sort: "hot",
  });
  assert.equal(none.length, 0);

  const byWeapon = filterCommunityCodes(file.data, { q: "", category: "all", weapon: "M4A1", sort: "value" });
  assert.equal(byWeapon.length, 1);
  assert.equal(byWeapon[0]!.weapon, "M4A1");

  const cleared = filterCommunityCodes(file.data, { q: "", category: "all", weapon: "all", sort: "hot" });
  assert.equal(cleared.length, file.data.length);
});
