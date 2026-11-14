import assert from "node:assert/strict";
import test from "node:test";

import { mysqlDateTime } from "./mysql-datetime.ts";

test("ISO timestamps become MySQL DATETIME text", () => {
  assert.equal(mysqlDateTime("2026-11-13T20:17:05.570Z"), "2026-11-13 20:17:05");
});

test("an already safe DATETIME value is kept", () => {
  assert.equal(mysqlDateTime("2026-11-13 20:17:05"), "2026-11-13 20:17:05");
});

test("empty or unreadable times do not invent a value", () => {
  assert.equal(mysqlDateTime(""), null);
  assert.equal(mysqlDateTime("   "), null);
  assert.equal(mysqlDateTime("not-a-date"), null);
});
