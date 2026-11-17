/**
 * 量首页 8 行动态的列起点。
 *
 * 200% 页面缩放是布局宽约 720、deviceScaleFactor 2。
 * 视口宽 180 是另一套更窄的布局，不能当成 200% 文字缩放。
 *
 * node --experimental-strip-types --import ./scripts/register-ts-test.mjs \
 *   scripts/measure-feed-geometry.mjs http://127.0.0.1:3472
 */
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

import { assessFeedRows, TEXT_ZOOM_NOTE } from "../lib/content/feed-geometry.ts";

const pageUrl = process.argv[2];
if (!pageUrl) {
  console.error("需要首页地址");
  process.exit(1);
}

const port = 9333;
const chrome = spawn(
  "google-chrome",
  [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    `--remote-debugging-port=${port}`,
    "--user-data-dir=/tmp/chrome-feed-geom",
    "--force-device-scale-factor=1",
  ],
  { stdio: "ignore" },
);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function debuggerTabs() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (response.ok) return await response.json();
    } catch {
      // Chrome 还没打开调试端口。
    }
    await sleep(150);
  }
  throw new Error("Chrome 调试端口没有起来");
}

function session(ws) {
  let nextId = 0;
  const pending = new Map();
  const events = [];
  const waiters = [];
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
      return;
    }
    events.push(message);
    for (const waiter of [...waiters]) waiter();
  });
  return {
    send(method, params = {}) {
      const id = ++nextId;
      ws.send(JSON.stringify({ id, method, params }));
      return new Promise((resolve, reject) => {
        pending.set(id, (message) => {
          if (message.error) reject(new Error(JSON.stringify(message.error)));
          else resolve(message.result);
        });
      });
    },
    until(method) {
      return new Promise((resolve) => {
        const ready = () => {
          const index = events.findIndex((message) => message.method === method);
          if (index < 0) return;
          const [message] = events.splice(index, 1);
          waiters.splice(waiters.indexOf(ready), 1);
          resolve(message);
        };
        waiters.push(ready);
        ready();
      });
    },
  };
}

const READ_ROWS = `(() => {
  const lines = [...document.querySelectorAll("[data-feed-line]")];
  return lines.map((line) => {
    const date = line.querySelector("[data-feed-date]").getBoundingClientRect();
    const source = line.querySelector("[data-feed-source]").getBoundingClientRect();
    const title = line.querySelector("[data-feed-title]");
    const titleBox = title.getBoundingClientRect();
    const row = line.getBoundingClientRect();
    return {
      dateX: date.x,
      sourceX: source.x,
      titleX: titleBox.x,
      dateWidth: date.width,
      clientWidth: title.clientWidth,
      scrollWidth: title.scrollWidth,
      text: title.textContent,
      titleAttr: line.getAttribute("title"),
      rowHeight: row.height,
      dateLabel: line.querySelector("[data-feed-date]").textContent.trim(),
    };
  });
})()`;

const viewports = [
  { name: "1440", width: 1440, height: 900, deviceScaleFactor: 1 },
  { name: "125pct-of-1440", width: 1152, height: 720, deviceScaleFactor: 1.25 },
  { name: "200pct-of-1440", width: 720, height: 450, deviceScaleFactor: 2 },
  { name: "1024", width: 1024, height: 800, deviceScaleFactor: 1 },
  { name: "768", width: 768, height: 800, deviceScaleFactor: 1 },
  { name: "390", width: 390, height: 844, deviceScaleFactor: 2 },
  { name: "360", width: 360, height: 800, deviceScaleFactor: 2 },
];

const outDir = "/opt/cursor/artifacts";
await mkdir(outDir, { recursive: true });

try {
  const tabs = await debuggerTabs();
  const tab = tabs.find((item) => item.type === "page") ?? tabs[0];
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  const cdp = session(ws);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  const report = { note: TEXT_ZOOM_NOTE, viewports: [] };

  for (const viewport of viewports) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: viewport.deviceScaleFactor,
      mobile: viewport.width < 640,
    });
    const loaded = cdp.until("Page.loadEventFired");
    await cdp.send("Page.navigate", { url: pageUrl });
    await loaded;
    await sleep(400);
    const result = await cdp.send("Runtime.evaluate", {
      expression: READ_ROWS,
      returnByValue: true,
    });
    const rows = result.result.value;
    const errors = assessFeedRows(rows);
    const shot = await cdp.send("Page.captureScreenshot", { format: "png" });
    const file = `${outDir}/feed-rows-${viewport.name}.png`;
    await writeFile(file, Buffer.from(shot.data, "base64"));
    report.viewports.push({
      ...viewport,
      errors,
      rows: rows.map((row) => ({
        dateX: Math.round(row.dateX),
        sourceX: Math.round(row.sourceX),
        titleX: Math.round(row.titleX),
        dateWidth: Math.round(row.dateWidth),
        dateLabel: row.dateLabel,
        ellipsis: row.scrollWidth > row.clientWidth + 1,
        fullNameKept: row.text === row.titleAttr,
        rowHeight: Math.round(row.rowHeight),
        text: row.text,
      })),
      screenshot: file,
    });
    console.log(viewport.name, errors.length ? errors.join(" | ") : "ok");
  }

  await writeFile(`${outDir}/feed-geometry.json`, JSON.stringify(report, null, 2));
  const failed = report.viewports.filter((item) => item.errors.length);
  if (failed.length) process.exitCode = 1;
  ws.close();
} finally {
  chrome.kill("SIGKILL");
}
