import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { parseLabCharacterSearch } from "./characters.ts";
import { dafeiyuHelperSrc } from "./pet-size.ts";

const require = createRequire(import.meta.url);
const slot = require("../../public/dafeiyu/helper/character-slot.js") as {
  FALLBACK_IDENTITY: string;
  FALLBACK_LABEL: string;
  FALLBACK_NOTE: string;
  readCharacterId: (search: string) => string;
  assetPolicy: (characterId: string, rest: string) => { kind: string };
  emptyDesktopConfig: () => { main: { pets: unknown[]; animations: Record<string, unknown> } };
  slotCopyAllowed: (data: unknown) => boolean;
  labMenuTree: (tree: unknown[]) => { label?: string; action?: string; anim?: string; children?: unknown[] }[];
  labHotkeyDisposition: (flags: Record<string, boolean>) => string;
  placeholderFigureSvg: () => string;
};

const root = new URL("../../", import.meta.url);

test("地址栏里的角色：小莓留下，别的都回到大肥鱼", () => {
  assert.equal(parseLabCharacterSearch(""), "dafeiyu");
  assert.equal(parseLabCharacterSearch("?character=dafeiyu"), "dafeiyu");
  assert.equal(parseLabCharacterSearch("?character=xiaomei"), "xiaomei");
  assert.equal(parseLabCharacterSearch("?character=whale"), "dafeiyu");
  assert.equal(slot.readCharacterId("?character=xiaomei"), "xiaomei");
  assert.equal(slot.readCharacterId("?character=whale"), "dafeiyu");
});

test("小莓和鱼共用助手地址，但小莓的 config 与 thumb 不落到鱼包", () => {
  const fish = new URL(dafeiyuHelperSrc("https://berryice.cn", 1280, 700), "https://berryice.cn");
  const xiaomei = new URL(dafeiyuHelperSrc("https://berryice.cn", 1280, 700, 1, "dark", "xiaomei"), "https://berryice.cn");
  assert.equal(fish.pathname, xiaomei.pathname);
  assert.equal(fish.searchParams.get("character"), "dafeiyu");
  assert.equal(xiaomei.searchParams.get("character"), "xiaomei");
  assert.equal(slot.assetPolicy("dafeiyu", "config").kind, "fish");
  assert.equal(slot.assetPolicy("dafeiyu", "thumb/main/待机呼吸休闲.webm").kind, "fish");
  assert.equal(slot.assetPolicy("xiaomei", "config").kind, "empty");
  assert.equal(slot.assetPolicy("xiaomei", "thumb/main/待机呼吸休闲.webm").kind, "block");
  assert.equal(slot.assetPolicy("xiaomei", "font/上首软糖体.ttf").kind, "passthrough");
  const empty = slot.emptyDesktopConfig();
  assert.deepEqual(empty.main.pets, []);
  assert.equal(JSON.stringify(empty).includes(".webm"), false);
  assert.equal(JSON.stringify(empty).includes("待机"), false);
});

test("小莓清单是空包，目录里没有光栅，占位图不是鲸鱼", () => {
  const manifest = JSON.parse(readFileSync(new URL("public/characters/xiaomei/manifest.json", root), "utf8")) as {
    id: string;
    label: string;
    status: string;
    body: string;
    identity: string[];
    sources: string[];
    note: string;
  };
  assert.equal(manifest.id, "xiaomei");
  assert.equal(manifest.label, slot.FALLBACK_LABEL);
  assert.equal(manifest.status, "empty");
  assert.equal(manifest.body, "raster-samebody");
  assert.equal(manifest.identity.join(" · "), slot.FALLBACK_IDENTITY);
  assert.equal(manifest.note, slot.FALLBACK_NOTE);
  assert.deepEqual(manifest.sources, []);
  assert.equal(slot.slotCopyAllowed(manifest), true);
  assert.equal(
    slot.slotCopyAllowed({
      id: "xiaomei",
      status: "empty",
      sources: ["/dsh-pet-7340/thumb/main/待机呼吸休闲.webm"],
      animations: {},
    }),
    false,
  );
  const names = readdirSync(new URL("public/characters/xiaomei", root));
  assert.deepEqual(names, ["manifest.json"]);
  const figure = slot.placeholderFigureSvg();
  assert.match(figure, /小莓占位/);
  assert.match(figure, /占位/);
  assert.doesNotMatch(figure, /dsh-pet|\.webm|鲸|<image|href=/);
});

test("右键留下睡觉、走路和鱼的动作，拿掉余额、待办、碎碎念和对话", () => {
  const tree = slot.labMenuTree([
    { label: "打开网站", action: "open-site" },
    { label: "查看余额", action: "show-balance" },
    { label: "待办事项", action: "todo" },
    { label: "碎碎念", action: "whisper" },
    { label: "对话", action: "chat" },
    { label: "睡觉", action: "sleep" },
    {
      label: "动作",
      children: [
        { label: "移动", children: [{ label: "螃蟹走路", anim: "螃蟹走路" }] },
        { label: "余额档位", children: [{ label: "余额-钱袋满溢", anim: "余额-钱袋满溢" }] },
      ],
    },
    { label: "显示位置", children: [{ label: "仅网页", action: "set-display" }] },
    { label: "重载配置", action: "reload" },
    { label: "回到初始位置", action: "home" },
  ]);
  const labels = JSON.stringify(tree);
  assert.match(labels, /睡觉/);
  assert.match(labels, /螃蟹走路/);
  assert.match(labels, /余额-钱袋满溢/);
  assert.match(labels, /回到初始位置/);
  assert.doesNotMatch(labels, /查看余额|待办事项|碎碎念|对话|打开网站|显示位置|重载配置/);
  assert.equal(slot.labHotkeyDisposition({ sleep: true, chat: true }), "sleep");
  assert.equal(slot.labHotkeyDisposition({ chat: true }), "drop");
  assert.equal(slot.labHotkeyDisposition({ todo: true }), "drop");
  assert.equal(slot.labHotkeyDisposition({ display: true }), "drop");
  assert.equal(slot.labHotkeyDisposition({}), "ignore");
});

test("舞台能切换两只角色，小莓不挂回首页，也不借用鱼或旧立绘", () => {
  const stage = readFileSync(new URL("components/dafeiyu/dafeiyu-stage.tsx", root), "utf8");
  const bridge = readFileSync(new URL("public/dafeiyu/helper/browser-bridge.js", root), "utf8");
  const helper = readFileSync(new URL("public/dafeiyu/helper/index.html", root), "utf8");
  const layout = readFileSync(new URL("app/layout.tsx", root), "utf8");
  const pageFit = readFileSync(new URL("public/dafeiyu/helper/page-fit.js", root), "utf8");
  assert.match(stage, /CharacterSwitch/);
  assert.match(stage, /characterId/);
  assert.match(stage, /小莓的空槽正在打开/);
  assert.match(stage, /大肥鱼正在进来/);
  assert.doesNotMatch(stage, /XiaomeiCompanion|投喂|饱腹|好感|二维码|\/xiaomei\/.+\.webp/);
  assert.doesNotMatch(layout, /XiaomeiCompanion/);
  assert.doesNotMatch(bridge, /pet\.name = "小莓"/);
  assert.match(bridge, /pet\.name = "大肥鱼"/);
  const configAt = bridge.indexOf('if (rest === "config")');
  const emptyAt = bridge.indexOf("emptyDesktopConfig");
  const nativeAt = bridge.indexOf("return nativeFetch(input, init).then");
  assert.ok(configAt !== -1 && emptyAt !== -1 && nativeAt !== -1);
  assert.ok(configAt < emptyAt && emptyAt < nativeAt);
  const thumbBlock = bridge.indexOf('placeholder && rest.indexOf("thumb/") === 0');
  const thumbPass = bridge.indexOf('rest.indexOf("thumb/") === 0 ||');
  assert.ok(thumbBlock !== -1 && thumbPass !== -1 && thumbBlock < thumbPass);
  assert.ok(helper.indexOf("character-slot.js") < helper.indexOf("browser-bridge.js"));
  assert.ok(helper.indexOf("browser-bridge.js") < helper.indexOf("vendor/renderer.js"));
  assert.match(pageFit, /installLabChrome/);
  assert.match(pageFit, /labMenuTree/);
  assert.match(pageFit, /onDropImage/);
});
