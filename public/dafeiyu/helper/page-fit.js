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

/** 还停在初始落点：没被拖过、甩过、也没在走。 */
function restingBeforeRelayout(sprite) {
  return !sprite.customPos && !sprite.dragState.active && sprite.throwRef == null && sprite.moveRef == null;
}

function installMenuViewportClamp() {
  if (typeof PetSprite === "undefined" || !PetSprite.prototype) return;
  PetSprite.prototype.visibleClampRect = function () {
    return menuViewportClamp(window.innerWidth, window.innerHeight);
  };
  var originalRelayout = PetSprite.prototype.relayout;
  if (typeof originalRelayout !== "function" || originalRelayout.__dafeiyuRest) return;
  function relayout(prevView) {
    var restore = restingBeforeRelayout(this);
    originalRelayout.call(this, prevView);
    if (!restore) return;
    if (this.dragState.active || this.throwRef != null || this.moveRef != null) return;
    // 舞台变窄时，上游会把「居中」夹成贴边，并写成用户落点。
    // 精灵拿的是拍平后的配置副本，边距要写回这只宠物再定位。
    var rest = window.__dafeiyuRestMargin;
    if (rest && this.pet && this.pet.position) {
      if (Number.isFinite(rest.marginX)) this.pet.position.marginX = rest.marginX;
      if (Number.isFinite(rest.marginY)) this.pet.position.marginY = rest.marginY;
    }
    this.customPos = null;
    this.position();
  }
  relayout.__dafeiyuRest = true;
  PetSprite.prototype.relayout = relayout;
}

if (typeof module === "object" && module.exports) {
  module.exports = {
    menuViewportClamp: menuViewportClamp,
    restingBeforeRelayout: restingBeforeRelayout,
    installMenuViewportClamp: installMenuViewportClamp,
  };
}
if (typeof window !== "undefined") {
  installMenuViewportClamp();
}
