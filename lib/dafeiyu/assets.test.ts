import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const root = new URL("../../", import.meta.url);

test("成品配置能被桌面助手直接拍平", () => {
  const config = JSON.parse(readFileSync(new URL("public/dsh-pet-7340/config", root), "utf8")) as {
    ok?: boolean;
    main?: { pets?: { id?: string; size?: number; display?: string }[]; animations?: { idle?: string[] } };
  };
  assert.notEqual(config.ok, false);
  assert.equal(config.main?.pets?.[0]?.id, "main");
  assert.equal(config.main?.pets?.[0]?.size, 462);
  assert.equal(config.main?.pets?.[0]?.display, "both");
  assert.deepEqual(config.main?.animations?.idle, ["待机呼吸休闲"]);
});

test("待机、点击和走路素材在包里", () => {
  for (const name of ["待机呼吸休闲", "点击回应-开心跃动", "被鼠标拖拽悬空反馈", "螃蟹走路", "睡觉-循环"]) {
    assert.equal(existsSync(new URL(`public/dsh-pet-7340/thumb/main/${name}.webm`, root)), true, name);
  }
  assert.equal(existsSync(new URL("public/dsh-pet-7340/sound/click-duck.wav", root)), true);
  assert.equal(existsSync(new URL("public/dafeiyu/helper/vendor/shared-core.js", root)), true);
  assert.equal(existsSync(new URL("public/dafeiyu/helper/vendor/sprite/motion.js", root)), true);
});
