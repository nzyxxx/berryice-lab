import assert from "node:assert/strict";
import test from "node:test";

import { writePageLink } from "../../lib/wiki/share-link.ts";

test("copy reports success only after the clipboard accepts the address", async () => {
  let stored = "";
  const copied = await writePageLink("https://berryice.cn/wiki/note", async (value) => {
    stored = value;
  });
  assert.equal(copied, "copied");
  assert.equal(stored, "https://berryice.cn/wiki/note");

  const failed = await writePageLink("https://berryice.cn/wiki/note", async () => {
    throw new Error("denied");
  });
  assert.equal(failed, "failed");
});
