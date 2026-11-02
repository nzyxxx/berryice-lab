"use strict";

/**
 * iframe 画布只在和父页面同一套 color-scheme 时才透明。
 * 对不上的那一侧会被浏览器涂成不透明的白或黑。
 */
function applyDafeiyuScheme(scheme) {
  document.documentElement.style.colorScheme = scheme === "light" ? "light" : "dark";
}

applyDafeiyuScheme(new URLSearchParams(location.search).get("scheme"));

window.addEventListener("message", function (event) {
  if (event.origin !== location.origin) return;
  var data = event.data;
  if (!data || data.type !== "dafeiyu-scheme") return;
  applyDafeiyuScheme(data.scheme);
});
