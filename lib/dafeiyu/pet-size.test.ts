import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { dafeiyuHelperSrc, dafeiyuWorkArea, DAFEIYU_DESKTOP_SIZE, DAFEIYU_GEOMETRY_MESSAGE, petSizeForStage } from "./pet-size.ts";

test("宽舞台用官方桌宠宽度 462", () => {
  assert.equal(petSizeForStage(1280), DAFEIYU_DESKTOP_SIZE);
  assert.equal(petSizeForStage(478), DAFEIYU_DESKTOP_SIZE);
  assert.equal(petSizeForStage(477), 461);
});

test("窄舞台缩小，但不小于 280", () => {
  assert.equal(petSizeForStage(360), 344);
  assert.equal(petSizeForStage(200), 280);
});

test("助手地址带上台面尺寸和官方素材前缀", () => {
  const src = dafeiyuHelperSrc("https://berryice.cn", 1280, 700);
  const url = new URL(src, "https://berryice.cn");
  assert.equal(url.pathname, "/dafeiyu/helper/index.html");
  assert.equal(url.searchParams.get("petSize"), "462");
  assert.equal(url.searchParams.get("workAreaW"), "1280");
  assert.equal(url.searchParams.get("configUrl"), "https://berryice.cn/dsh-pet-7340/config");
});

test("工作区是一块屏，消息名和桥一致", () => {
  const area = dafeiyuWorkArea(800, 600);
  assert.equal(area.hull.width, 800);
  assert.equal(area.areas.length, 1);
  assert.equal(area.primaryIndex, 0);
  const bridge = readFileSync(new URL("../../public/dafeiyu/helper/browser-bridge.js", import.meta.url), "utf8");
  assert.match(bridge, new RegExp(DAFEIYU_GEOMETRY_MESSAGE));
});
