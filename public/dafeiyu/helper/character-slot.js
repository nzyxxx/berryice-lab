"use strict";

/**
 * 同一播放器的角色槽。
 * 大肥鱼继续走 /dsh-pet-7340。
 * 小莓在成片到来之前只画空包，不取鲸鱼画面。
 */
var FALLBACK_LABEL = "小莓";
var FALLBACK_IDENTITY = "银紫发 · 绵羊耳 · 女仆围裙";
var FALLBACK_NOTE = "空包。等小莓自己的 SameBody 成片。";

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
].join("");

function paintPlaceholder(root) {
  if (typeof document === "undefined" || !root) return;
  if (root.querySelector("[data-pack='empty']")) return;
  if (!document.getElementById("berryice-slot-css")) {
    var style = document.createElement("style");
    style.id = "berryice-slot-css";
    style.textContent = SLOT_CSS;
    document.head.appendChild(style);
  }
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
  fetch("/characters/xiaomei/manifest.json", { cache: "no-store" })
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

var api = {
  FALLBACK_LABEL: FALLBACK_LABEL,
  FALLBACK_IDENTITY: FALLBACK_IDENTITY,
  FALLBACK_NOTE: FALLBACK_NOTE,
  readCharacterId: readCharacterId,
  assetPolicy: assetPolicy,
  emptyDesktopConfig: emptyDesktopConfig,
  slotCopyAllowed: slotCopyAllowed,
  identityLine: identityLine,
  labMenuTree: labMenuTree,
  labHotkeyDisposition: labHotkeyDisposition,
  placeholderFigureSvg: placeholderFigureSvg,
  paintPlaceholder: paintPlaceholder,
};

if (typeof module === "object" && module.exports) module.exports = api;
if (typeof window !== "undefined") window.BerryiceCharacterSlot = api;
