import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

test("动效笔记写明落点，解码和打字不进首页标题", async () => {
  const root = process.cwd();
  const page = await readFile(path.join(root, "app/writing/motion/page.tsx"), "utf8");
  const stage = await readFile(path.join(root, "components/writing/motion-stage.tsx"), "utf8");
  const home = await readFile(path.join(root, "components/preview/media-gallery.tsx"), "utf8");
  assert.match(page, /六分钟的动效课/);
  assert.match(stage, /Spotlight/);
  assert.match(stage, /Border Beam/);
  assert.match(stage, /0\.05 秒/);
  assert.equal(stage.includes("data-demo="), true);
  assert.equal(home.includes("setInterval"), false);
  assert.match(home, /text-display-hero/);
  assert.equal(home.includes("idle-candd-24-still-hi2.webp"), true);
});
