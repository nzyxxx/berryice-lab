import assert from "node:assert/strict";
import test from "node:test";

import { headerNav, moduleLinks, navIsCurrent } from "../site-config.ts";

test("顶栏以游戏为一级，三角洲和写作不并列", () => {
  assert.deepEqual(
    headerNav.map((item) => item.id),
    ["wiki", "games", "music", "about"]
  );
  assert.equal(headerNav.some((item) => item.href === "/delta-gun"), false);
  assert.equal(headerNav.some((item) => item.href === "/writing"), false);
  assert.equal(moduleLinks.some((item) => item.href === "/delta-gun"), true);
  assert.equal(moduleLinks.some((item) => item.href === "/writing"), true);
  assert.equal(navIsCurrent("/games", "/delta-gun/guns"), true);
  assert.equal(navIsCurrent("/games", "/games/delta"), true);
  assert.equal(navIsCurrent("/wiki", "/delta-gun"), false);
  assert.equal(navIsCurrent("/wiki", "/wiki/note"), true);
});
