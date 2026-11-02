/** dsh-pet 默认桌宠宽度。高度由上游按 16:9 推。 */
export const DAFEIYU_DESKTOP_SIZE = 462;

/** 上游发布的播放素材就是这一档。2160 的中间帧不在 Release 里，放大只会糊。 */
export const DAFEIYU_ASSET_WIDTH = 640;

export const DAFEIYU_GEOMETRY_MESSAGE = "dafeiyu-geometry";

export const DAFEIYU_SCHEME_MESSAGE = "dafeiyu-scheme";

/**
 * 窄舞台把鱼缩小到放得下，但不小于 280。
 * CSS 宽度超过 640/dpr 会把画面放大，边缘发虚。结果再收成整数设备像素，
 * 避免 1.25 / 1.5 倍屏落在半像素上，被浏览器多滤一圈。
 */
export function petSizeForStage(stageWidth: number, devicePixelRatio = 1): number {
  if (!Number.isFinite(stageWidth) || stageWidth < 64) return DAFEIYU_DESKTOP_SIZE;
  const dpr = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
  const fitted = Math.floor(stageWidth - 16);
  const desired = Math.min(DAFEIYU_DESKTOP_SIZE, Math.max(280, fitted), DAFEIYU_ASSET_WIDTH / dpr);
  let device = Math.min(DAFEIYU_ASSET_WIDTH, Math.max(1, Math.round(desired * dpr)));
  if (device / dpr > DAFEIYU_DESKTOP_SIZE) device = Math.min(device, Math.floor(DAFEIYU_DESKTOP_SIZE * dpr));
  return device / dpr;
}

/** 没被拖走过时，鱼站在舞台下沿居中，而不是贴在左下角。 */
export function dafeiyuRestMargin(width: number, height: number, petSize: number) {
  const frameH = (petSize * 9) / 16;
  const maxX = Math.max(8, Math.floor(width - petSize - 8));
  const maxY = Math.max(8, Math.floor(height - frameH - 8));
  return {
    marginX: Math.min(maxX, Math.max(28, Math.round((width - petSize) / 2))),
    marginY: Math.min(maxY, Math.max(36, Math.round(Math.min(96, height * 0.1)))),
  };
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

export function dafeiyuHelperSrc(
  origin: string,
  width: number,
  height: number,
  devicePixelRatio = 1,
  scheme: "dark" | "light" = "dark",
): string {
  const petSize = petSizeForStage(width, devicePixelRatio);
  const rest = dafeiyuRestMargin(width, height, petSize);
  const params = new URLSearchParams({
    configUrl: `${origin}/dsh-pet-7340/config`,
    scale: "1",
    petIndex: "0",
    petSize: String(petSize),
    marginX: String(rest.marginX),
    marginY: String(rest.marginY),
    scheme,
    workAreaX: "0",
    workAreaY: "0",
    workAreaW: String(Math.round(width)),
    workAreaH: String(Math.round(height)),
    topInsetRatio: "0",
  });
  return `/dafeiyu/helper/index.html?${params.toString()}`;
}
