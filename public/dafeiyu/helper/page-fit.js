"use strict";

/**
 * 桌面助手把右键菜单夹在「只包住鱼的那扇系统窗」的局部坐标里。
 * 浏览器里菜单是 iframe 里的 position:fixed，点击坐标却是整块舞台的。
 * 局部坐标的 y 往往落在舞台下半截，菜单就被推到底角，下半截出了 iframe，页脚盖住，点不到。
 * 这里改成夹在 iframe 可视区域：贴着光标，整块留在舞台内。
 */
function menuViewportClamp(width, height) {
  var w = Math.round(Number(width) || 0);
  var h = Math.round(Number(height) || 0);
  if (w < 40 || h < 40) return null;
  return { x: 0, y: 0, w: w, h: h };
}

function installMenuViewportClamp() {
  if (typeof PetSprite === "undefined" || !PetSprite.prototype) return;
  PetSprite.prototype.visibleClampRect = function () {
    return menuViewportClamp(window.innerWidth, window.innerHeight);
  };
}

if (typeof module === "object" && module.exports) {
  module.exports = { menuViewportClamp: menuViewportClamp, installMenuViewportClamp: installMenuViewportClamp };
}
if (typeof window !== "undefined") {
  installMenuViewportClamp();
}
