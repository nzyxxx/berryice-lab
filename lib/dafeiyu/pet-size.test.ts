import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { atmosphereForPath } from "../atmosphere-routes.ts";
import { dafeiyuHelperSrc, dafeiyuRestMargin, dafeiyuWorkArea, DAFEIYU_ASSET_WIDTH, DAFEIYU_DESKTOP_SIZE, DAFEIYU_GEOMETRY_MESSAGE, DAFEIYU_SCHEME_MESSAGE, petSizeForStage } from "./pet-size.ts";

const require = createRequire(import.meta.url);
const { menuViewportClamp, restingBeforeRelayout } = require("../../public/dafeiyu/helper/page-fit.js") as {
  menuViewportClamp: (width: number, height: number) => { x: number; y: number; w: number; h: number } | null;
  restingBeforeRelayout: (sprite: {
    customPos: unknown;
    dragState: { active: boolean };
    throwRef: unknown;
    moveRef: unknown;
  }) => boolean;
};

/** 与上游 mountContextMenu 同一条夹取。 */
function placeMenu(x: number, y: number, rw: number, rh: number, c: { x: number; y: number; w: number; h: number }) {
  return {
    left: Math.max(c.x + 4, Math.min(x, c.x + c.w - rw - 4)),
    top: Math.max(c.y + 4, Math.min(y, c.y + c.h - rh - 4)),
  };
}

test("宽舞台用官方桌宠宽度 462", () => {
  assert.equal(petSizeForStage(1280), DAFEIYU_DESKTOP_SIZE);
  assert.equal(petSizeForStage(478), DAFEIYU_DESKTOP_SIZE);
  assert.equal(petSizeForStage(477), 461);
});

test("窄舞台缩小，但不小于 280", () => {
  assert.equal(petSizeForStage(360), 344);
  assert.equal(petSizeForStage(200), 280);
});

test("视网膜屏不超过素材的 640 像素，避免放大发虚", () => {
  assert.equal(petSizeForStage(1280, 1), DAFEIYU_DESKTOP_SIZE);
  assert.equal(petSizeForStage(1280, 2), 320);
  assert.equal(petSizeForStage(1280, 3), DAFEIYU_ASSET_WIDTH / 3);
  const src = dafeiyuHelperSrc("https://berryice.cn", 1280, 700, 2);
  const url = new URL(src, "https://berryice.cn");
  assert.equal(url.searchParams.get("petSize"), "320");
});

test("设备像素是整数，并且不会超过 640", () => {
  for (const dpr of [1, 1.25, 1.5, 2, 2.5, 3]) {
    const css = petSizeForStage(1440, dpr);
    const device = css * dpr;
    assert.ok(device <= DAFEIYU_ASSET_WIDTH + 1e-6, `dpr ${dpr} device ${device}`);
    assert.ok(Math.abs(device - Math.round(device)) < 1e-6, `dpr ${dpr} landed on ${device}`);
    assert.ok(css <= DAFEIYU_DESKTOP_SIZE + 1e-6, `dpr ${dpr} css ${css}`);
  }
});

test("没拖过的鱼站在舞台下沿正中", () => {
  const rest = dafeiyuRestMargin(1280, 700, 320);
  assert.equal(rest.marginX, 480);
  assert.equal(rest.marginY, 70);
  const tight = dafeiyuRestMargin(360, 400, 344);
  assert.ok(tight.marginX + 344 <= 360);
  assert.ok(tight.marginY + (344 * 9) / 16 <= 400);
});

test("助手地址带上台面尺寸和官方素材前缀", () => {
  const src = dafeiyuHelperSrc("https://berryice.cn", 1280, 700);
  const url = new URL(src, "https://berryice.cn");
  assert.equal(url.pathname, "/dafeiyu/helper/index.html");
  assert.equal(url.searchParams.get("petSize"), "462");
  assert.equal(url.searchParams.get("marginX"), "409");
  assert.equal(url.searchParams.get("scheme"), "dark");
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
  assert.match(bridge, /marginX/);
  const scheme = readFileSync(new URL("../../public/dafeiyu/helper/scheme.js", import.meta.url), "utf8");
  assert.match(scheme, new RegExp(DAFEIYU_SCHEME_MESSAGE));
  assert.match(scheme, /colorScheme/);
});

test("没被摆过的鱼在舞台变窄后仍算初始落点", () => {
  const idle = {
    customPos: null,
    dragState: { active: false },
    throwRef: null,
    moveRef: null,
  };
  assert.equal(restingBeforeRelayout(idle), true);
  assert.equal(restingBeforeRelayout({ ...idle, customPos: { rx: 0.9 } }), false);
  assert.equal(restingBeforeRelayout({ ...idle, dragState: { active: true } }), false);
  assert.equal(restingBeforeRelayout({ ...idle, throwRef: 1 }), false);
  assert.equal(restingBeforeRelayout({ ...idle, moveRef: 1 }), false);
});

test("右键菜单夹在舞台可视区域内，贴着点击处", () => {
  const clamp = menuViewportClamp(1100, 700);
  assert.ok(clamp);
  assert.equal(clamp.x, 0);
  assert.equal(clamp.y, 0);
  const placed = placeMenu(180, 640, 220, 420, clamp);
  assert.equal(placed.left, 180);
  assert.ok(placed.top >= 4);
  assert.ok(placed.top + 420 <= 700);
  assert.equal(menuViewportClamp(10, 700), null);
});

test("大肥鱼和首页共用夜雨，闪电不跟过来", () => {
  assert.deepEqual(atmosphereForPath("/"), { rain: true, lightning: true });
  assert.deepEqual(atmosphereForPath("/dafeiyu"), { rain: true, lightning: false });
  assert.deepEqual(atmosphereForPath("/about"), { rain: false, lightning: false });
  const atmosphere = readFileSync(new URL("../../components/atmosphere/site-atmosphere.tsx", import.meta.url), "utf8");
  assert.match(atmosphere, /atmosphereForPath/);
  assert.match(atmosphere, /<RainField \/>/);
  assert.doesNotMatch(atmosphere, /pathname === "\/" \?/);
});

test("大肥鱼页不写说明，首页不再挂小莓", () => {
  const page = readFileSync(new URL("../../app/(labs)/dafeiyu/page.tsx", import.meta.url), "utf8");
  assert.match(page, /大肥鱼/);
  assert.match(page, /PC2005-cloud\/dsh-pet/);
  assert.match(page, /署名与许可/);
  assert.doesNotMatch(page, /小莓|Harness|Safari/);
  const layout = readFileSync(new URL("../../app/layout.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(layout, /XiaomeiCompanion/);
  const helper = readFileSync(new URL("../../public/dafeiyu/helper/index.html", import.meta.url), "utf8");
  assert.match(helper, /sprite\.js/);
  assert.match(helper, /scheme\.js/);
  assert.ok(helper.indexOf("scheme.js") < helper.indexOf("sprite.js"));
  assert.ok(helper.indexOf("sprite.js") < helper.indexOf("page-fit.js"));
  assert.doesNotMatch(page, /bg-white|#fff|小莓/);
});
