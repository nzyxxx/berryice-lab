"use strict";

/**
 * 同一播放器的角色槽。
 * 大肥鱼继续走 /dsh-pet-7340。
 * 小莓清单 status=empty 时只画空包。
 * status=ready 且 sources 里有她自己的光栅（至少 idle）时，画脚边的 SameBody，仍不取鱼的画面。
 *
 * 成片清单：
 * { id:"xiaomei", body:"raster-samebody", status:"ready",
 *   identity:["银紫发","绵羊耳","女仆围裙"],
 *   sources:[{id:"idle",src:"/characters/xiaomei/idle.webp"},
 *            {id:"breath-1",src:"/characters/xiaomei/breath-1.webp"}],
 *   note:"小莓站在台上。" }
 * src 只能是 /characters/xiaomei/ 下的 webp、png、svg。stretch / walk 可以先写进清单，台上先不轮播。
 * 另一份成片是 artFamily "xiaomei-samebody-v1"：activities 只有 idle/stretch/walk，frames 指向同目录 webp。
 */
var FALLBACK_LABEL = "小莓";
var FALLBACK_IDENTITY = "银紫发 · 绵羊耳 · 女仆围裙";
var FALLBACK_NOTE = "空包。等小莓自己的 SameBody 成片。";
// 立绘 640×853。演员宽 min(72vw, 180px)，高按 853/640 钉死（180 时约 240）。鱼的 petSize 仍是 462。
// preview_fix_v1：缩小显示贴近鱼舞台高 260；内容高约贴近鱼。
// 现网 webp 每帧 125ms。stretch / walk 各 41 帧 = 5125ms，且末帧接不回第 0 帧。
// 播完一轮前 40ms 收起，避免循环接缝。两张图不再叠 0.28s 透明度，否则会双重影。
var ACTOR_WIDTH = 180;
var BREATH_FRAME_MS = 1600;
var MOUNT_WAIT_MS = 4000;
var CLIP_MS = { stretch: 5085, walk: 5085 };
var MANIFEST_URL = "/characters/xiaomei/manifest.json";

var LAB_DROPPED_ACTIONS = {
  "open-site": true,
  "show-balance": true,
  todo: true,
  whisper: true,
  chat: true,
  "set-display": true,
  reload: true,
  "third-party": true,
};

function readCharacterId(search) {
  var params = new URLSearchParams(String(search || "").replace(/^\?/, ""));
  return params.get("character") === "xiaomei" ? "xiaomei" : "dafeiyu";
}

/** 小莓的 config 与 thumb 不能落到鱼包。其余请求仍交给原来的宿主。 */
function assetPolicy(characterId, rest) {
  if (characterId !== "xiaomei") return { kind: "fish" };
  if (rest === "config") return { kind: "empty" };
  if (String(rest || "").indexOf("thumb/") === 0) return { kind: "block" };
  return { kind: "passthrough" };
}

function emptyDesktopConfig() {
  return {
    main: {
      pets: [],
      animations: {},
      memes: {},
      clickSoundEnabled: false,
      voiceEnabled: false,
      chatImageEnabled: false,
    },
  };
}

function slotCopyAllowed(data) {
  if (!data || data.id !== "xiaomei" || data.status !== "empty") return false;
  if (data.sources != null && (!Array.isArray(data.sources) || data.sources.length !== 0)) return false;
  if (data.animations != null && (typeof data.animations !== "object" || Object.keys(data.animations).length !== 0)) {
    return false;
  }
  var blob = JSON.stringify(data);
  if (blob.indexOf("dsh-pet") !== -1) return false;
  if (blob.indexOf(".webm") !== -1) return false;
  if (blob.indexOf("/thumb/") !== -1) return false;
  if (blob.indexOf("鲸鳍") !== -1 || blob.indexOf("鲸尾") !== -1) return false;
  return true;
}

function textAllowed(text) {
  return typeof text === "string" && text.trim() !== "" && text.indexOf("dsh-pet") === -1 && text.indexOf(".webm") === -1 && text.indexOf("鲸鳍") === -1 && text.indexOf("鲸尾") === -1;
}

function identityLine(data) {
  if (!data || !Array.isArray(data.identity)) return FALLBACK_IDENTITY;
  var parts = [];
  for (var i = 0; i < data.identity.length; i += 1) {
    if (typeof data.identity[i] === "string" && data.identity[i].trim()) parts.push(data.identity[i].trim());
  }
  var line = parts.join(" · ");
  return textAllowed(line) ? line : FALLBACK_IDENTITY;
}

function bannedPackText(text) {
  var raw = String(text);
  var lower = raw.toLowerCase();
  if (lower.indexOf("dsh-pet") !== -1) return true;
  if (lower.indexOf(".webm") !== -1) return true;
  if (raw.indexOf("/thumb/") !== -1) return true;
  if (raw.indexOf("鲸") !== -1) return true;
  if (lower.indexOf("whale") !== -1) return true;
  if (raw.indexOf("小莓妹") !== -1) return true;
  if (raw.indexOf("蓝莓") !== -1) return true;
  return false;
}

function identityLocked(data) {
  var line = identityLine(data);
  return line.indexOf("银紫发") !== -1 && line.indexOf("绵羊耳") !== -1 && line.indexOf("女仆") !== -1;
}

function sourceKind(id) {
  if (id === "idle") return "idle";
  if (id === "stretch") return "stretch";
  if (id === "walk") return "walk";
  if (id === "breath" || /^breath-[1-9]\d*$/.test(id)) return "breath";
  return "";
}

function breathRank(id) {
  if (id === "breath") return 0;
  var n = Number(String(id).slice("breath-".length));
  return Number.isFinite(n) ? n : 99;
}

var ART_FRAME_FILE = /^[a-z0-9][a-z0-9-]*\.webp$/;
var ART_ACTIVITIES = { idle: true, stretch: true, walk: true };

/** artFamily 清单折成原来的成片包。对不上就返回 null。 */
function artFamilyPack(data) {
  if (!data || data.artFamily !== "xiaomei-samebody-v1") return null;
  var slot = data.reskinSlot;
  if (!slot || slot.id !== "xiaomei" || slot.status !== "ready") return null;
  var activities = data.activities;
  if (!Array.isArray(activities) || activities.length !== 3) return null;
  var seen = Object.create(null);
  for (var i = 0; i < activities.length; i += 1) {
    var name = activities[i];
    if (!ART_ACTIVITIES[name] || seen[name]) return null;
    seen[name] = true;
  }
  var frames = data.frames;
  if (!frames || typeof frames !== "object" || Array.isArray(frames)) return null;
  var locks = data.identityLocks;
  if (!Array.isArray(locks)) return null;
  if (locks.indexOf("sheepEars") === -1 || locks.indexOf("silverLilacHair") === -1 || locks.indexOf("maidApronBlueberry") === -1) {
    return null;
  }
  var sources = [];
  var order = ["idle", "stretch", "walk"];
  for (var j = 0; j < order.length; j += 1) {
    var id = order[j];
    var file = frames[id];
    if (typeof file !== "string" || !ART_FRAME_FILE.test(file)) return null;
    sources.push({ id: id, src: "/characters/xiaomei/" + file });
  }
  return {
    id: "xiaomei",
    label: FALLBACK_LABEL,
    status: "ready",
    body: "raster-samebody",
    identity: ["银紫发", "绵羊耳", "女仆围裙"],
    animations: {},
    sources: sources,
    note: "小莓站在台上。",
  };
}

/** 成片帧计划。不合格就返回 null，调用方继续画空包。 */
function sameBodyPlan(data) {
  if (!data || typeof data !== "object") return null;
  var rawBlob;
  try {
    rawBlob = JSON.stringify(data);
  } catch {
    return null;
  }
  if (bannedPackText(rawBlob)) return null;
  if (data.artFamily != null) {
    data = artFamilyPack(data);
    if (!data) return null;
  }
  if (data.id !== "xiaomei" || data.status !== "ready" || data.body !== "raster-samebody") return null;
  if (data.label != null && data.label !== FALLBACK_LABEL) return null;
  if (data.note != null && typeof data.note !== "string") return null;
  if (data.animations != null && (typeof data.animations !== "object" || Array.isArray(data.animations) || Object.keys(data.animations).length !== 0)) {
    return null;
  }
  var blob;
  try {
    blob = JSON.stringify(data);
  } catch {
    return null;
  }
  if (bannedPackText(blob) || !identityLocked(data)) return null;
  if (!Array.isArray(data.sources) || data.sources.length === 0) return null;
  var seen = Object.create(null);
  var idle = "";
  var breath = [];
  var stretch = null;
  var walk = null;
  var srcOk = /^\/characters\/xiaomei\/[a-z0-9][a-z0-9-]*\.(webp|png|svg)$/;
  for (var i = 0; i < data.sources.length; i += 1) {
    var item = data.sources[i];
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    if (typeof item.id !== "string" || typeof item.src !== "string") return null;
    if (seen[item.id]) return null;
    seen[item.id] = true;
    if (!srcOk.test(item.src) || bannedPackText(item.src)) return null;
    var kind = sourceKind(item.id);
    if (kind === "idle") idle = item.src;
    else if (kind === "breath") breath.push({ id: item.id, src: item.src });
    else if (kind === "stretch") stretch = item.src;
    else if (kind === "walk") walk = item.src;
    else return null;
  }
  if (!idle) return null;
  breath.sort(function (a, b) {
    return breathRank(a.id) - breathRank(b.id);
  });
  return {
    width: ACTOR_WIDTH,
    idle: idle,
    breath: breath.map(function (frame) {
      return frame.src;
    }),
    stretch: stretch,
    walk: walk,
    identity: identityLine(data),
  };
}

function sameBodyReady(data) {
  return sameBodyPlan(data) !== null;
}

function labMenuTree(tree) {
  if (!Array.isArray(tree)) return [];
  var out = [];
  for (var i = 0; i < tree.length; i += 1) {
    var node = tree[i];
    if (!node || typeof node !== "object") continue;
    if (node.action && LAB_DROPPED_ACTIONS[node.action]) continue;
    if (Array.isArray(node.children)) {
      var children = labMenuTree(node.children);
      if (children.length === 0) continue;
      out.push(Object.assign({}, node, { children: children }));
      continue;
    }
    out.push(node);
  }
  return out;
}

/** sleep 留给原热键。对话、待办、截图、显示位置和按住说话在这一页没有宿主。 */
function labHotkeyDisposition(flags) {
  var input = flags || {};
  if (input.sleep) return "sleep";
  if (input.chat || input.todo || input.capture || input.display) return "drop";
  return "ignore";
}

function placeholderFigureSvg() {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 220" role="img" aria-label="小莓占位">',
    "<title>小莓占位</title>",
    '<rect x="18" y="16" width="124" height="188" rx="18" fill="none" stroke="currentColor" stroke-opacity="0.35" stroke-dasharray="4 4"/>',
    '<ellipse cx="58" cy="58" rx="16" ry="22" fill="#c9b6e4"/>',
    '<ellipse cx="102" cy="58" rx="16" ry="22" fill="#c9b6e4"/>',
    '<ellipse cx="58" cy="60" rx="8" ry="12" fill="#efe6f8"/>',
    '<ellipse cx="102" cy="60" rx="8" ry="12" fill="#efe6f8"/>',
    '<path d="M80 42c2-10 8-12 6-20" fill="none" stroke="#b7a6d6" stroke-width="3" stroke-linecap="round"/>',
    '<path d="M48 78c0-22 14-36 32-36s32 14 32 36v18H48z" fill="#b7a6d6"/>',
    '<circle cx="80" cy="86" r="20" fill="#f3e7ea"/>',
    '<path d="M62 112h36l8 62H54z" fill="#4a4160"/>',
    '<path d="M70 118h20l6 40H64z" fill="#f6f1e8"/>',
    '<rect x="64" y="172" width="12" height="6" rx="2" fill="#2c2836"/>',
    '<rect x="84" y="172" width="12" height="6" rx="2" fill="#2c2836"/>',
    '<text x="80" y="198" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.72">占位</text>',
    "</svg>",
  ].join("");
}

var SLOT_CSS = [
  ".berryice-slot{position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;",
  "padding:24px 16px 8vh;pointer-events:none;color:CanvasText;",
  "font-family:'PingFang SC','Microsoft YaHei',sans-serif}",
  ".berryice-slot-card{display:flex;flex-direction:column;align-items:center;gap:8px;max-width:16rem;text-align:center}",
  ".berryice-slot-figure{width:min(46vw,180px)}",
  ".berryice-slot-figure svg{display:block;width:100%;height:auto}",
  ".berryice-slot-name{margin:0;font-size:15px;letter-spacing:.14em}",
  ".berryice-slot-line{margin:0;font-size:12px;line-height:1.5;opacity:.72}",
  ".berryice-actor{position:relative;width:min(72vw,180px);height:calc(min(72vw,180px) * 853 / 640);aspect-ratio:640 / 853;touch-action:none;pointer-events:auto;cursor:grab;user-select:none}",
  ".berryice-actor[data-dragging='1']{cursor:grabbing}",
  ".berryice-ground{position:absolute;left:50%;bottom:2px;width:68%;height:14px;transform:translateX(-50%);",
  "background:radial-gradient(ellipse at center, rgba(150,196,214,.45), rgba(150,196,214,0) 72%);pointer-events:none}",
  ".berryice-actor-frames{position:absolute;inset:0;width:100%;height:100%}",
  ".berryice-actor-frame{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:contain;object-position:center bottom;",
  "pointer-events:none;user-select:none}",
  ".berryice-actor-frames.has-breath .berryice-actor-frame:not(.is-idle){opacity:0}",
  "@media (prefers-reduced-motion:no-preference){",
  ".berryice-actor-frames.has-breath .berryice-actor-frame{animation-name:berryice-breath;animation-duration:var(--berryice-breath,3200ms);",
  "animation-timing-function:linear;animation-iteration-count:infinite}}",
  ".berryice-actor[data-dragging='1'] .berryice-actor-frames{transform:scale(1.015,.97);transform-origin:center bottom}",
  "@media (prefers-reduced-motion:reduce){",
  ".berryice-actor[data-dragging='1'] .berryice-actor-frames{transform:none}}",
  ".berryice-actor-pose{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:center bottom;",
  "opacity:0;visibility:hidden;pointer-events:none}",
  ".berryice-actor[data-pose='stretch'] .berryice-actor-frames,.berryice-actor[data-pose='walk'] .berryice-actor-frames{visibility:hidden}",
  ".berryice-actor[data-pose='stretch'] .berryice-actor-pose[data-frame='stretch']{opacity:1;visibility:visible}",
  ".berryice-actor[data-pose='walk'] .berryice-actor-pose[data-frame='walk']{opacity:1;visibility:visible}",
  ".berryice-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}",
].join("");

function ensureSlotCss() {
  if (typeof document === "undefined" || !document.head || document.getElementById("berryice-slot-css")) return;
  var style = document.createElement("style");
  style.id = "berryice-slot-css";
  style.textContent = SLOT_CSS;
  document.head.appendChild(style);
}

function breathCss(count) {
  var hold = Math.round((100 / count) * 1000) / 1000;
  var cut = Math.min(hold + 0.02, 99.9);
  var lines = [
    "@keyframes berryice-breath{0%{opacity:1}",
    hold + "%{opacity:1}",
    cut + "%,100%{opacity:0}}",
  ];
  for (var i = 0; i < count; i += 1) {
    lines.push(
      ".berryice-actor-frames.has-breath .berryice-actor-frame:nth-child(" +
        (i + 1) +
        "){animation-delay:" +
        i * BREATH_FRAME_MS +
        "ms}",
    );
  }
  return lines.join("");
}

function ensureBreathCss(count) {
  if (typeof document === "undefined" || !document.head) return;
  var prev = document.getElementById("berryice-breath-css");
  if (count < 2) {
    if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
    return;
  }
  var css = breathCss(count);
  if (prev) {
    prev.textContent = css;
    return;
  }
  var style = document.createElement("style");
  style.id = "berryice-breath-css";
  style.textContent = css;
  document.head.appendChild(style);
}

function paintPlaceholder(root) {
  if (typeof document === "undefined" || !root) return;
  if (root.querySelector("[data-pack='empty']")) return;
  ensureSlotCss();
  var wrap = document.createElement("div");
  wrap.className = "berryice-slot";
  wrap.setAttribute("data-character", "xiaomei");
  wrap.setAttribute("data-pack", "empty");
  var card = document.createElement("div");
  card.className = "berryice-slot-card";
  var figure = document.createElement("div");
  figure.className = "berryice-slot-figure";
  figure.innerHTML = placeholderFigureSvg();
  var name = document.createElement("p");
  name.className = "berryice-slot-name";
  name.setAttribute("data-slot-label", "");
  name.textContent = FALLBACK_LABEL;
  var identity = document.createElement("p");
  identity.className = "berryice-slot-line";
  identity.setAttribute("data-slot-identity", "");
  identity.textContent = FALLBACK_IDENTITY;
  var note = document.createElement("p");
  note.className = "berryice-slot-line";
  note.setAttribute("data-slot-note", "");
  note.textContent = FALLBACK_NOTE;
  card.appendChild(figure);
  card.appendChild(name);
  card.appendChild(identity);
  card.appendChild(note);
  wrap.appendChild(card);
  root.appendChild(wrap);
  fetch(MANIFEST_URL, { cache: "no-store" })
    .then(function (res) {
      return res.ok ? res.json() : null;
    })
    .then(function (data) {
      if (!slotCopyAllowed(data)) return;
      var line = identityLine(data);
      var nextNote = typeof data.note === "string" ? data.note : "";
      if (textAllowed(line)) identity.textContent = line;
      if (textAllowed(nextNote)) note.textContent = nextNote;
    })
    .catch(function () {});
}

function watchBreath(img, frames) {
  img.addEventListener("error", function () {
    if (img.parentNode) img.parentNode.removeChild(img);
    if (frames.querySelector && !frames.querySelector("[data-frame='breath']")) frames.className = "berryice-actor-frames";
  });
  frames.appendChild(img);
}

function makeFrame(src, frameId, idle) {
  var img = document.createElement("img");
  img.className = idle ? "berryice-actor-frame is-idle" : "berryice-actor-frame";
  img.setAttribute("src", src);
  img.setAttribute("data-frame", frameId);
  img.alt = idle ? FALLBACK_LABEL : "";
  img.decoding = "async";
  img.draggable = false;
  return img;
}

function bindActorDrag(actor, root, onTap) {
  var drag = null;
  var pos = { x: 0, y: 0 };
  var moved = 0;
  actor.addEventListener("pointerdown", function (event) {
    if (event.button != null && event.button !== 0) return;
    if (typeof actor.setPointerCapture === "function") actor.setPointerCapture(event.pointerId);
    drag = { x: event.clientX, y: event.clientY, bx: pos.x, by: pos.y };
    moved = 0;
    actor.setAttribute("data-dragging", "1");
  });
  actor.addEventListener("pointermove", function (event) {
    if (!drag) return;
    var dx = event.clientX - drag.x;
    var dy = event.clientY - drag.y;
    moved = Math.max(moved, Math.abs(dx) + Math.abs(dy));
    var limitX = Math.max(80, (root.clientWidth || 0) * 0.42);
    var limitUp = Math.max(80, (root.clientHeight || 0) * 0.5);
    var limitDown = Math.max(24, (root.clientHeight || 0) * 0.08);
    pos.x = Math.max(-limitX, Math.min(limitX, drag.bx + dx));
    pos.y = Math.max(-limitUp, Math.min(limitDown, drag.by + dy));
    actor.style.transform = "translate(" + Math.round(pos.x) + "px," + Math.round(pos.y) + "px)";
  });
  actor.addEventListener("pointerup", function () {
    if (!drag) return;
    drag = null;
    actor.removeAttribute("data-dragging");
    if (moved < 6) onTap();
  });
  actor.addEventListener("pointercancel", function () {
    drag = null;
    actor.removeAttribute("data-dragging");
  });
}

/** 脚边光栅。不成片就什么都不画。 */
function paintSameBodyReady(root, manifest) {
  var plan = sameBodyPlan(manifest);
  if (!plan || typeof document === "undefined" || !root) return null;
  if (root.querySelector("[data-pack='ready']")) return plan;
  var stale = root.querySelector("[data-pack='empty']");
  if (stale && stale.parentNode) stale.parentNode.removeChild(stale);
  ensureSlotCss();
  var frameCount = 1 + plan.breath.length;
  ensureBreathCss(frameCount);
  var wrap = document.createElement("div");
  wrap.className = "berryice-slot";
  wrap.setAttribute("data-character", "xiaomei");
  wrap.setAttribute("data-pack", "ready");
  var actor = document.createElement("div");
  actor.className = "berryice-actor";
  actor.setAttribute("data-actor", "samebody");
  actor.setAttribute("aria-label", FALLBACK_LABEL);
  var ground = document.createElement("div");
  ground.className = "berryice-ground";
  ground.setAttribute("aria-hidden", "true");
  var frames = document.createElement("div");
  frames.className = plan.breath.length > 0 ? "berryice-actor-frames has-breath" : "berryice-actor-frames";
  if (plan.breath.length > 0 && frames.style && typeof frames.style.setProperty === "function") {
    frames.style.setProperty("--berryice-breath", frameCount * BREATH_FRAME_MS + "ms");
  }
  var reduceMotion = false;
  if (typeof window !== "undefined" && window.matchMedia) {
    reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  var idleImg = makeFrame(plan.idle, "idle", true);
  var fellBack = false;
  idleImg.addEventListener("error", function () {
    var src = idleImg.getAttribute("src") || "";
    if (src.indexOf("-still.webp") !== -1) {
      idleImg.setAttribute("src", plan.idle);
      return;
    }
    if (fellBack) return;
    fellBack = true;
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    paintPlaceholder(root);
  });
  if (reduceMotion) idleImg.setAttribute("src", plan.idle.replace(/\.webp$/, "-still.webp"));
  frames.appendChild(idleImg);
  for (var i = 0; i < plan.breath.length; i += 1) {
    watchBreath(makeFrame(plan.breath[i], "breath", false), frames);
  }
  var poseTimer = 0;
  var poseOrder = [];
  if (plan.stretch) poseOrder.push("stretch");
  if (plan.walk) poseOrder.push("walk");
  var poseCursor = 0;
  function endPose() {
    if (poseTimer) clearTimeout(poseTimer);
    poseTimer = 0;
    actor.removeAttribute("data-pose");
  }
  function restartClip(frameId) {
    var img = actor.querySelector("[data-frame='" + frameId + "']");
    if (!img) return;
    var src = img.getAttribute("src");
    if (src) img.setAttribute("src", src);
  }
  function showNextPose() {
    if (reduceMotion || poseTimer || poseOrder.length === 0) return;
    var pose = poseOrder[poseCursor % poseOrder.length];
    poseCursor += 1;
    var ms = CLIP_MS[pose];
    if (!ms) return;
    restartClip(pose);
    actor.setAttribute("data-pose", pose);
    poseTimer = setTimeout(endPose, ms);
  }
  if (typeof document !== "undefined" && document.addEventListener) {
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) endPose();
    });
  }
  actor.appendChild(ground);
  actor.appendChild(frames);
  function addPose(src, frameId) {
    var img = makeFrame(src, frameId, false);
    img.className = "berryice-actor-pose";
    img.addEventListener("error", function () {
      if (frameId === "stretch") plan.stretch = null;
      if (frameId === "walk") plan.walk = null;
      poseOrder = poseOrder.filter(function (name) { return name !== frameId; });
      if (actor.getAttribute("data-pose") === frameId) endPose();
      if (img.parentNode) img.parentNode.removeChild(img);
    });
    actor.appendChild(img);
  }
  if (plan.stretch) addPose(plan.stretch, "stretch");
  if (plan.walk) addPose(plan.walk, "walk");
  var sr = document.createElement("p");
  sr.className = "berryice-sr";
  sr.textContent = FALLBACK_LABEL + "。" + plan.identity;
  actor.appendChild(sr);
  bindActorDrag(actor, root, showNextPose);
  wrap.appendChild(actor);
  root.appendChild(wrap);
  return plan;
}

/** 先看清单。成片画光栅，否则画原来的空包。慢了先空包，成片随后换上。 */
function mountXiaomeiSlot(root) {
  if (typeof document === "undefined" || !root) return;
  if (root.getAttribute("data-xiaomei-mount") === "1") return;
  root.setAttribute("data-xiaomei-mount", "1");
  var finished = false;
  var timer = setTimeout(function () {
    if (finished || root.querySelector("[data-character='xiaomei']")) return;
    paintPlaceholder(root);
  }, MOUNT_WAIT_MS);
  fetch(MANIFEST_URL, { cache: "no-store" })
    .then(function (res) {
      return res && res.ok && typeof res.json === "function" ? res.json() : null;
    })
    .then(function (data) {
      finished = true;
      clearTimeout(timer);
      if (sameBodyReady(data)) {
        paintSameBodyReady(root, data);
        return;
      }
      if (!root.querySelector("[data-pack='empty']")) paintPlaceholder(root);
    })
    .catch(function () {
      finished = true;
      clearTimeout(timer);
      if (!root.querySelector("[data-character='xiaomei']")) paintPlaceholder(root);
    });
}

var api = {
  FALLBACK_LABEL: FALLBACK_LABEL,
  FALLBACK_IDENTITY: FALLBACK_IDENTITY,
  FALLBACK_NOTE: FALLBACK_NOTE,
  ACTOR_WIDTH: ACTOR_WIDTH,
  MANIFEST_URL: MANIFEST_URL,
  readCharacterId: readCharacterId,
  assetPolicy: assetPolicy,
  emptyDesktopConfig: emptyDesktopConfig,
  slotCopyAllowed: slotCopyAllowed,
  identityLine: identityLine,
  sameBodyPlan: sameBodyPlan,
  sameBodyReady: sameBodyReady,
  labMenuTree: labMenuTree,
  labHotkeyDisposition: labHotkeyDisposition,
  placeholderFigureSvg: placeholderFigureSvg,
  paintPlaceholder: paintPlaceholder,
  paintSameBodyReady: paintSameBodyReady,
  mountXiaomeiSlot: mountXiaomeiSlot,
};

if (typeof module === "object" && module.exports) module.exports = api;
if (typeof window !== "undefined") window.BerryiceCharacterSlot = api;
