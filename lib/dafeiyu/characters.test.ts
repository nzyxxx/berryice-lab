import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { parseLabCharacterSearch } from "./characters.ts";
import { dafeiyuHelperSrc } from "./pet-size.ts";
import { xiaomeiPackReady, xiaomeiPackReadyFromJson, xiaomeiSameBodyPlan } from "./xiaomei-pack.ts";

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
  ACTOR_WIDTH: number;
  MANIFEST_URL: string;
  sameBodyPlan: (data: unknown) => {
    width: number;
    idle: string;
    breath: string[];
    stretch: string | null;
    walk: string | null;
    identity: string;
  } | null;
  sameBodyReady: (data: unknown) => boolean;
  paintSameBodyReady: (root: unknown, manifest: unknown) => unknown;
  mountXiaomeiSlot: (root: unknown) => void;
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

function webpSize(file: URL) {
  const bytes = readFileSync(file);
  assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
  assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
  assert.equal(bytes.toString("ascii", 12, 16), "VP8L");
  assert.equal(bytes[20], 0x2f);
  const bits = bytes.readUInt32LE(21);
  return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
}

test("小莓清单是她自己的成片，空包规则还在，占位图不是鲸鱼", () => {
  const manifest = JSON.parse(readFileSync(new URL("public/characters/xiaomei/manifest.json", root), "utf8")) as {
    artFamily: string;
    activities: string[];
    frames: { idle: string; stretch: string; walk: string };
    identityLocks: string[];
    reskinSlot: { id: string; status: string };
  };
  assert.equal(manifest.artFamily, "xiaomei-samebody-v1");
  assert.deepEqual(manifest.activities, ["idle", "stretch", "walk"]);
  assert.deepEqual(manifest.frames, {
    idle: "idle-hair-light-24.webp",
    stretch: "stretch-hair-light-24.webp",
    walk: "walk-hair-light-24.webp",
  });
  assert.equal(manifest.reskinSlot.id, "xiaomei");
  assert.equal(manifest.reskinSlot.status, "ready");
  assert.equal(manifest.identityLocks.includes("sheepEars"), true);
  assert.equal(manifest.identityLocks.includes("silverLilacHair"), true);
  assert.equal(manifest.identityLocks.includes("maidApronBlueberry"), true);
  const manifestText = JSON.stringify(manifest);
  assert.equal(manifestText.includes("dsh-pet"), false);
  assert.equal(manifestText.includes("/thumb/"), false);
  assert.equal(manifestText.includes(".webm"), false);
  assert.equal(slot.slotCopyAllowed(manifest), false);
  assert.equal(slot.sameBodyReady(manifest), true);
  assert.equal(xiaomeiPackReady(manifest), true);
  assert.equal(xiaomeiPackReadyFromJson(JSON.stringify(manifest)), true);
  assert.equal(xiaomeiPackReadyFromJson("{"), false);
  const plan = slot.sameBodyPlan(manifest);
  assert.equal(plan?.width, 180);
  assert.equal(plan?.idle, "/characters/xiaomei/idle-hair-light-24.webp");
  assert.deepEqual(plan?.breath, []);
  assert.equal(plan?.stretch, "/characters/xiaomei/stretch-hair-light-24.webp");
  assert.equal(plan?.walk, "/characters/xiaomei/walk-hair-light-24.webp");
  assert.equal(plan?.playbackMs?.stretch, 5082);
  assert.equal(plan?.frameMs?.stretch, 42);
  assert.equal(plan?.identity, slot.FALLBACK_IDENTITY);
  plansAgree(manifest);
  const flipped = { ...manifest, reskinSlot: { ...manifest.reskinSlot, status: "empty" } };
  assert.equal(slot.sameBodyReady(flipped), false);
  assert.equal(
    slot.slotCopyAllowed({ id: "xiaomei", status: "empty", sources: [], note: slot.FALLBACK_NOTE }),
    true,
  );
  assert.equal(
    slot.slotCopyAllowed({
      id: "xiaomei",
      status: "empty",
      sources: ["/dsh-pet-7340/thumb/main/待机呼吸休闲.webm"],
      animations: {},
    }),
    false,
  );
  const names = readdirSync(new URL("public/characters/xiaomei", root)).sort();
  assert.deepEqual(names, [
    "idle-hair-light-24-still.webp",
    "idle-hair-light-24.webp",
    "idle-still.webp",
    "idle.webp",
    "manifest.json",
    "stretch-hair-light-24.webp",
    "stretch.webp",
    "walk-hair-light-24.webp",
    "walk.webp",
  ]);
  for (const name of ["idle.webp", "stretch.webp", "walk.webp"]) {
    assert.deepEqual(webpSize(new URL(`public/characters/xiaomei/${name}`, root)), { width: 640, height: 853 });
  }
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
  assert.match(stage, /xiaomeiReady \? "小莓正在进来。" : "小莓的空槽正在打开。"/);
  assert.match(stage, /xiaomeiReady \? "小莓，可以拖拽" : "小莓，空包占位"/);
  assert.match(stage, /大肥鱼正在进来/);
  const switchUi = readFileSync(new URL("components/dafeiyu/character-switch.tsx", root), "utf8");
  const page = readFileSync(new URL("app/(labs)/dafeiyu/page.tsx", root), "utf8");
  assert.match(switchUi, /xiaomeiReady \? "小莓" : "小莓，空包占位"/);
  assert.match(switchUi, /xiaomeiReady \? "可以拖一拖" : "空包占位"/);
  assert.match(page, /xiaomeiPackReadyFromJson/);
  assert.match(page, /xiaomeiReady=\{labXiaomeiReady\(\)\}/);
  assert.doesNotMatch(stage + switchUi + page, /小莓妹|蓝莓|鲸|XiaomeiCompanion/);
  assert.doesNotMatch(stage, /readFileSync|node:fs/);
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
  const mountAt = bridge.indexOf("mountXiaomeiSlot");
  assert.ok(mountAt !== -1 && mountAt < thumbBlock);
  assert.match(pageFit, /installLabChrome/);
  assert.match(pageFit, /labMenuTree/);
  assert.match(pageFit, /onDropImage/);
});

const readyPack = {
  id: "xiaomei",
  label: "小莓",
  status: "ready",
  body: "raster-samebody",
  identity: ["银紫发", "绵羊耳", "女仆围裙"],
  animations: {},
  sources: [
    { id: "breath-10", src: "/characters/xiaomei/breath-10.webp" },
    { id: "walk", src: "/characters/xiaomei/walk.webp" },
    { id: "breath-2", src: "/characters/xiaomei/breath-2.webp" },
    { id: "idle", src: "/characters/xiaomei/idle.webp" },
    { id: "stretch", src: "/characters/xiaomei/stretch.webp" },
    { id: "breath", src: "/characters/xiaomei/breath.webp" },
  ],
  note: "小莓站在台上。",
  playbackMs: { stretch: 5082, walk: 5082 },
  frameMs: { stretch: 42, walk: 42 },
};

function plansAgree(data: unknown) {
  assert.deepEqual(xiaomeiSameBodyPlan(data), slot.sameBodyPlan(data));
  assert.equal(xiaomeiPackReady(data), slot.sameBodyReady(data));
}

test("成片夹具换成 SameBody，鱼的 thumb 和鲸鱼字眼进不了小莓槽", () => {
  plansAgree(readyPack);
  const plan = slot.sameBodyPlan(readyPack);
  assert.ok(plan);
  assert.equal(plan.width, 180);
  assert.equal(slot.ACTOR_WIDTH, 180);
  assert.equal(plan.idle, "/characters/xiaomei/idle.webp");
  assert.deepEqual(plan.breath, [
    "/characters/xiaomei/breath.webp",
    "/characters/xiaomei/breath-2.webp",
    "/characters/xiaomei/breath-10.webp",
  ]);
  assert.equal(plan.stretch, "/characters/xiaomei/stretch.webp");
  assert.equal(plan.walk, "/characters/xiaomei/walk.webp");
  assert.equal(plan.identity, slot.FALLBACK_IDENTITY);
  for (const src of [plan.idle, ...plan.breath, plan.stretch, plan.walk]) {
    assert.equal(src.includes("dsh-pet"), false);
    assert.equal(src.includes("/thumb/"), false);
    assert.equal(src.endsWith(".webm"), false);
  }
  assert.equal(slot.slotCopyAllowed(readyPack), false);
  assert.equal(slot.assetPolicy("xiaomei", "thumb/main/待机呼吸休闲.webm").kind, "block");
  assert.equal(slot.assetPolicy("xiaomei", "config").kind, "empty");
  const idleOnly = {
    id: "xiaomei",
    status: "ready",
    body: "raster-samebody",
    sources: [{ id: "idle", src: "/characters/xiaomei/idle.png" }],
  };
  plansAgree(idleOnly);
  assert.equal(slot.sameBodyReady(idleOnly), true);
  assert.deepEqual(slot.sameBodyPlan(idleOnly)?.breath, []);
  const noIdentity = {
    id: readyPack.id,
    label: readyPack.label,
    status: readyPack.status,
    body: readyPack.body,
    animations: readyPack.animations,
    sources: readyPack.sources,
    note: readyPack.note,
  };
  plansAgree(noIdentity);
  assert.equal(slot.sameBodyPlan(noIdentity)?.identity, slot.FALLBACK_IDENTITY);
  const rejected = [
    { ...readyPack, status: "empty" },
    { ...readyPack, body: "raster" },
    { ...readyPack, id: "dafeiyu" },
    { ...readyPack, label: "小莓妹" },
    { ...readyPack, label: "蓝莓" },
    { ...readyPack, note: "whale" },
    { ...readyPack, identity: ["银紫发", "鲸鳍", "女仆围裙"] },
    { ...readyPack, identity: ["银紫发", "女仆围裙"] },
    { ...readyPack, animations: { idle: "/characters/xiaomei/idle.webp" } },
    { ...readyPack, sources: ["/characters/xiaomei/idle.webp"] },
    { ...readyPack, sources: [{ id: "stretch", src: "/characters/xiaomei/stretch.webp" }] },
    { ...readyPack, sources: [{ id: "idle", src: "/dsh-pet-7340/thumb/main/待机呼吸休闲.webm" }] },
    { ...readyPack, sources: [{ id: "idle", src: "/xiaomei/body_neutral.webp" }] },
    { ...readyPack, sources: [{ id: "idle", src: "/characters/xiaomei/idle.webm" }] },
    { ...readyPack, sources: [{ id: "idle", src: "/characters/xiaomei/idle.webp?v=1" }] },
    {
      ...readyPack,
      sources: [
        { id: "idle", src: "/characters/xiaomei/idle.webp" },
        { id: "idle", src: "/characters/xiaomei/idle.png" },
      ],
    },
    {
      ...readyPack,
      sources: [
        { id: "idle", src: "/characters/xiaomei/idle.webp" },
        { id: "螃蟹走路", src: "/characters/xiaomei/walk.webp" },
      ],
    },
  ];
  for (const pack of rejected) {
    plansAgree(pack);
    assert.equal(slot.sameBodyReady(pack), false);
  }
  const slotSource = readFileSync(new URL("public/dafeiyu/helper/character-slot.js", root), "utf8");
  assert.match(slotSource, /width:min\(72vw,180px\)/);
  assert.match(slotSource, /paintSameBodyReady/);
  assert.doesNotMatch(slotSource, /requestAnimationFrame|backdrop-filter|will-change|dsh-pet-7340\/thumb/);
});

type FakeEl = {
  tag: string;
  id: string;
  className: string;
  textContent: string;
  innerHTML: string;
  clientWidth: number;
  clientHeight: number;
  attrs: Record<string, string>;
  children: FakeEl[];
  parentNode: FakeEl | null;
  listeners: Record<string, Array<(event: { button?: number; pointerId?: number; clientX?: number; clientY?: number }) => void>>;
  style: { transform: string; props: Record<string, string>; setProperty: (key: string, value: string) => void };
  setAttribute: (key: string, value: string) => void;
  getAttribute: (key: string) => string | null;
  removeAttribute: (key: string) => void;
  appendChild: (child: FakeEl) => FakeEl;
  removeChild: (child: FakeEl) => FakeEl;
  addEventListener: (type: string, fn: (event: { button?: number; clientX?: number; clientY?: number }) => void) => void;
  setPointerCapture: () => void;
  querySelector: (sel: string) => FakeEl | null;
  querySelectorAll: (sel: string) => FakeEl[];
};

function matchesSlot(el: FakeEl, sel: string) {
  if (sel === "img") return el.tag === "img";
  const attr = /^\[([a-zA-Z0-9-]+)='([^']*)'\]$/.exec(sel);
  if (attr) return el.attrs[attr[1]] === attr[2];
  if (sel.startsWith("#")) return el.id === sel.slice(1);
  return false;
}

function querySlotAll(el: FakeEl, sel: string) {
  const found: FakeEl[] = [];
  const walk = (node: FakeEl) => {
    for (const child of node.children) {
      if (matchesSlot(child, sel)) found.push(child);
      walk(child);
    }
  };
  walk(el);
  return found;
}

function makeSlotEl(tag: string): FakeEl {
  const el = {
    tag,
    id: "",
    className: "",
    textContent: "",
    innerHTML: "",
    clientWidth: 0,
    clientHeight: 0,
    attrs: {},
    children: [],
    parentNode: null,
    listeners: {},
    style: {
      transform: "",
      props: {},
      setProperty(key: string, value: string) {
        this.props[key] = value;
      },
    },
  } as FakeEl;
  el.setAttribute = (key, value) => {
    el.attrs[key] = String(value);
  };
  el.getAttribute = (key) => (key in el.attrs ? el.attrs[key] : null);
  el.removeAttribute = (key) => {
    delete el.attrs[key];
  };
  el.appendChild = (child) => {
    child.parentNode = el;
    el.children.push(child);
    return child;
  };
  el.removeChild = (child) => {
    el.children = el.children.filter((item) => item !== child);
    child.parentNode = null;
    return child;
  };
  el.addEventListener = (type, fn) => {
    el.listeners[type] = el.listeners[type] ?? [];
    el.listeners[type].push(fn);
  };
  el.setPointerCapture = () => {};
  el.querySelector = (sel) => querySlotAll(el, sel)[0] ?? null;
  el.querySelectorAll = (sel) => querySlotAll(el, sel);
  return el;
}

function fireSlot(el: FakeEl, type: string, event: { button?: number; clientX?: number; clientY?: number }) {
  for (const fn of el.listeners[type] ?? []) fn(event);
}

function slotDump(el: FakeEl): string {
  let text = `${el.textContent}\n${el.innerHTML}`;
  for (const child of el.children) text += `\n${slotDump(child)}`;
  return text;
}

test("空包仍画占位；成片夹具画脚边光栅，且不请求鱼的 thumb", async () => {
  assert.equal(slot.paintSameBodyReady({}, readyPack), null);
  const previousFetch = globalThis.fetch;
  const hadDocument = "document" in globalThis;
  const previousDocument = globalThis.document;
  const calls: string[] = [];
  let payload: unknown = readyPack;
  const created: FakeEl[] = [];
  try {
    globalThis.fetch = (async (input: unknown) => {
      calls.push(String(input));
      return { ok: true, json: async () => payload };
    }) as typeof fetch;
    const head = makeSlotEl("head");
    created.push(head);
    globalThis.document = {
      head,
      createElement(tag: string) {
        const el = makeSlotEl(tag);
        created.push(el);
        return el;
      },
      getElementById(id: string) {
        return created.find((el) => el.id === id) ?? null;
      },
    } as unknown as Document;
    const stageRoot = makeSlotEl("div");
    stageRoot.clientWidth = 800;
    stageRoot.clientHeight = 600;
    created.push(stageRoot);
    slot.mountXiaomeiSlot(stageRoot);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(stageRoot.querySelector("[data-pack='ready']") !== null, true);
    assert.equal(stageRoot.querySelector("[data-pack='empty']"), null);
    const actor = stageRoot.querySelector("[data-actor='samebody']");
    assert.ok(actor);
    assert.equal(actor.getAttribute("aria-label"), "小莓");
    const srcs = stageRoot.querySelectorAll("img").map((img) => img.getAttribute("src")).filter((src) => src);
    assert.deepEqual(srcs, [
      "/characters/xiaomei/idle.webp",
      "/characters/xiaomei/breath.webp",
      "/characters/xiaomei/breath-2.webp",
      "/characters/xiaomei/breath-10.webp",
    ]);
    assert.equal(stageRoot.querySelector("[data-frame='stretch']")?.getAttribute("src"), null);
    assert.equal(stageRoot.querySelector("[data-frame='stretch']")?.getAttribute("data-src"), "/characters/xiaomei/stretch.webp");
    assert.equal(stageRoot.querySelector("[data-frame='walk']")?.getAttribute("src"), null);
    assert.equal(srcs.some((src) => src?.includes("dsh-pet") || src?.includes("/thumb/") || src?.endsWith(".webm")), false);
    const frames = stageRoot.querySelector("[data-frame='idle']")?.parentNode;
    assert.equal(frames?.style.props["--berryice-breath"], "6400ms");
    fireSlot(actor, "pointerdown", { button: 0, clientX: 10, clientY: 10 });
    fireSlot(actor, "pointermove", { clientX: 50, clientY: -10 });
    fireSlot(actor, "pointerup", {});
    assert.equal(actor.style.transform, "translate(40px,-20px)");
    assert.equal(actor.getAttribute("data-pose"), null);
    fireSlot(actor, "pointerdown", { button: 0, clientX: 10, clientY: 10 });
    fireSlot(actor, "pointerup", {});
    const stretchImg = stageRoot.querySelector("[data-frame='stretch']");
    assert.equal(stretchImg?.getAttribute("src"), "/characters/xiaomei/stretch.webp");
    assert.equal(actor.getAttribute("data-pose"), null);
    fireSlot(stretchImg as FakeEl, "load", {});
    assert.equal(actor.getAttribute("data-pose"), "stretch");
    const idle = stageRoot.querySelector("[data-frame='idle']");
    assert.ok(idle);
    fireSlot(idle, "error", {});
    assert.equal(stageRoot.querySelector("[data-pack='ready']"), null);
    assert.ok(stageRoot.querySelector("[data-pack='empty']"));
    const dumped = slotDump(stageRoot);
    assert.match(dumped, /占位/);
    assert.doesNotMatch(dumped, /dsh-pet|鲸|小莓妹|蓝莓/);
    await new Promise((resolve) => setTimeout(resolve, 0));

    payload = { ...readyPack, sources: [{ id: "idle", src: "/dsh-pet-7340/thumb/main/待机呼吸休闲.webm" }] };
    const blocked = makeSlotEl("div");
    created.push(blocked);
    calls.length = 0;
    slot.mountXiaomeiSlot(blocked);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(blocked.querySelector("[data-pack='empty']") !== null, true);
    assert.equal(blocked.querySelector("[data-pack='ready']"), null);
    assert.equal(blocked.querySelectorAll("img").length, 0);
    assert.ok(calls.length > 0);
    assert.equal(calls.every((url) => url === slot.MANIFEST_URL), true);

    const live = JSON.parse(readFileSync(new URL("public/characters/xiaomei/manifest.json", root), "utf8")) as {
      reskinSlot: { id: string; status: string };
    };
    payload = live;
    const liveRoot = makeSlotEl("div");
    created.push(liveRoot);
    calls.length = 0;
    slot.mountXiaomeiSlot(liveRoot);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(liveRoot.querySelector("[data-pack='ready']") !== null, true);
    assert.equal(liveRoot.querySelector("[data-pack='empty']"), null);
    assert.deepEqual(
      liveRoot.querySelectorAll("img").map((img) => img.getAttribute("src")).filter((src) => src),
      ["/characters/xiaomei/idle-hair-light-24.webp"],
    );
    assert.equal(liveRoot.querySelector("[data-frame='stretch']")?.getAttribute("src"), null);
    assert.equal(liveRoot.querySelector("[data-frame='walk']")?.getAttribute("src"), null);
    assert.equal(calls.every((url) => url === slot.MANIFEST_URL), true);

    payload = { ...live, reskinSlot: { ...live.reskinSlot, status: "empty" } };
    const flippedRoot = makeSlotEl("div");
    created.push(flippedRoot);
    calls.length = 0;
    slot.mountXiaomeiSlot(flippedRoot);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(flippedRoot.querySelector("[data-pack='empty']") !== null, true);
    assert.equal(flippedRoot.querySelector("[data-pack='ready']"), null);
    assert.equal(flippedRoot.querySelector("img"), null);
    assert.match(slotDump(flippedRoot), /小莓占位/);
    assert.equal(calls.every((url) => url === slot.MANIFEST_URL), true);
  } finally {
    globalThis.fetch = previousFetch;
    if (hadDocument) globalThis.document = previousDocument;
    else delete (globalThis as { document?: unknown }).document;
  }
});
