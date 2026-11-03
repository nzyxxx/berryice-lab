import assert from "node:assert/strict";
import { test } from "node:test";
import { estimateWechatBytes, sourceKind } from "./wechat-pipeline.ts";

test("只认表情工坊收的几种素材", () => {
  assert.equal(sourceKind("image/gif"), "gif");
  assert.equal(sourceKind("image/webp"), "webp");
  assert.equal(sourceKind("image/png"), "image");
  assert.equal(sourceKind("image/jpeg"), "image");
  assert.equal(sourceKind("video/mp4"), "video");
  assert.equal(sourceKind("image/svg+xml"), null);
  assert.equal(sourceKind("application/octet-stream"), null);
});

test("体积估算：方形 GIF 不放大，横图按裁掉的面积缩", () => {
  assert.equal(estimateWechatBytes(20_000, { kind: "gif", width: 240, height: 240 }), 20_000);
  assert.equal(estimateWechatBytes(20_000, { kind: "gif", width: 480, height: 240 }), 10_000);
  const still = estimateWechatBytes(2_000_000, { kind: "image", width: 1200, height: 800 });
  assert.ok(still < 80_000);
});
