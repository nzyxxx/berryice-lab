/** dsh-pet 默认桌宠宽度。高度由上游按 16:9 推。 */
export const DAFEIYU_DESKTOP_SIZE = 462;

export const DAFEIYU_GEOMETRY_MESSAGE = "dafeiyu-geometry";

/**
 * 窄舞台把鱼缩小到放得下，但不小于 280。
 * 素材宽 640。CSS 宽度超过 640/dpr 时，视网膜屏会把画面放大，边缘发虚、发锯齿。
 */
export function petSizeForStage(stageWidth: number, devicePixelRatio = 1): number {
  if (!Number.isFinite(stageWidth) || stageWidth < 64) return DAFEIYU_DESKTOP_SIZE;
  const fitted = Math.floor(stageWidth - 16);
  const dpr = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
  const native = Math.max(1, Math.floor(640 / dpr));
  return Math.min(DAFEIYU_DESKTOP_SIZE, Math.max(280, fitted), native);
}

/** 上游 applyDeskGeometry 要的单屏工作区。坐标是舞台内部的 CSS 像素。 */
export function dafeiyuWorkArea(width: number, height: number) {
  const area = { x: 0, y: 0, width, height };
  return {
    hull: { x: 0, y: 0, width, height },
    areas: [area],
    panels: [area],
    workAreas: [area],
    primaryIndex: 0,
    topInsetRatio: 0,
  };
}

export function dafeiyuHelperSrc(origin: string, width: number, height: number, devicePixelRatio = 1): string {
  const params = new URLSearchParams({
    configUrl: `${origin}/dsh-pet-7340/config`,
    scale: "1",
    petIndex: "0",
    petSize: String(petSizeForStage(width, devicePixelRatio)),
    workAreaX: "0",
    workAreaY: "0",
    workAreaW: String(Math.round(width)),
    workAreaH: String(Math.round(height)),
    topInsetRatio: "0",
  });
  return `/dafeiyu/helper/index.html?${params.toString()}`;
}
