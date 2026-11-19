import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { marqueeDelaySeconds } from "./motion-hold.ts";

test("暂停后的位移按轨道一半换算成负延迟", () => {
  assert.equal(marqueeDelaySeconds(0, 1000, 22), 0);
  assert.equal(marqueeDelaySeconds(-250, 1000, 22), -11);
  assert.equal(marqueeDelaySeconds(-500, 1000, 22), -22);
  assert.equal(marqueeDelaySeconds(40, 1000, 22), 0);
  assert.equal(marqueeDelaySeconds(-10, 0, 22), 0);
});

test("人名保持展示字号，聚光离开会灭，循环在减少动效时是 none", async () => {
  const root = process.cwd();
  const home = await readFile(path.join(root, "components/preview/media-gallery.tsx"), "utf8");
  const play = await readFile(path.join(root, "components/lab/motion-play.tsx"), "utf8");
  const css = await readFile(path.join(root, "app/globals.css"), "utf8");
  assert.match(home, /whitespace-nowrap text-display-hero/);
  assert.match(home, /minmax\(11\.5rem,1fr\)/);
  assert.equal(home.includes("text-[1.7rem]"), false);
  assert.match(home, /idle-candd-24-still-hi2.webp/);
  assert.match(play, /spotLeave/);
  assert.match(play, /dataset\.lit = "false"/);
  assert.match(play, /animation = "none"/);
  assert.match(css, /\.marquee-track,\s*\.type-caret,\s*\.channel-beam,\s*\.beam-demo \{\s*animation: none !important;/);
  assert.match(css, /\.marquee-track \{\s*transform: none !important;/);
  assert.match(css, /data-lit="true"\]:hover::after/);
});
