import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  bulletExposesPrivatePath,
  findPublicNoteStill,
  noteMentionsStill,
} from "./wiki-media.ts";

test("a backtick image name counts as a still mention, a video does not", () => {
  assert.equal(noteMentionsStill(["存了 `cover.jpg`"]), true);
  assert.equal(noteMentionsStill(["只有 `video.mp4`"]), false);
  assert.equal(noteMentionsStill(["正文里写 cover.jpg 但没有反引号"]), false);
});

test("storage paths stay detectable so the page can skip them", () => {
  assert.equal(bulletExposesPrivatePath("sources: `wiki/sources/a/cover.jpg`"), true);
  assert.equal(bulletExposesPrivatePath("https://berryice.cn/wiki/note"), false);
});

test("public stills only resolve inside wiki-covers for a safe slug", () => {
  const root = mkdtempSync(path.join(tmpdir(), "wiki-covers-"));
  const dir = path.join(root, "wiki-covers");
  mkdirSync(dir);
  writeFileSync(path.join(dir, "note-a.webp"), "still");

  assert.equal(findPublicNoteStill("note-a", root), "/wiki-covers/note-a.webp");
  assert.equal(findPublicNoteStill("missing", root), null);
  assert.equal(findPublicNoteStill("../note-a", root), null);
  assert.equal(findPublicNoteStill("note-a/../../etc/passwd", root), null);
});
