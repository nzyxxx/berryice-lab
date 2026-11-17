/** 首页动态行的几何验收。测量脚本和测试共用这一套，不靠一次截图。 */

export type FeedRowBox = {
  dateX: number;
  sourceX: number;
  titleX: number;
  dateWidth: number;
  clientWidth: number;
  scrollWidth: number;
  text: string;
  titleAttr: string;
  rowHeight: number;
  dateLabel: string;
};

/**
 * 浏览器 200% 缩放改的是布局视口：1440 CSS 像素的窗口在 200% 时大约是宽 720、deviceScaleFactor 2。
 * 把视口直接设成 180，只是更窄的布局，不是 200% 文字缩放。
 */
export const TEXT_ZOOM_NOTE =
  "200% 页面缩放是布局宽约 720、deviceScaleFactor 2。视口宽 180 是另一套更窄的布局，不能当成 200% 文字缩放。";

export function assessFeedRows(rows: readonly FeedRowBox[]): string[] {
  const errors: string[] = [];
  if (rows.length !== 8) errors.push(`行数是 ${rows.length}，要 8 行`);
  const rounded = (key: "dateX" | "sourceX" | "titleX") => new Set(rows.map((row) => Math.round(row[key])));
  for (const key of ["dateX", "sourceX", "titleX"] as const) {
    const values = [...rounded(key)];
    if (values.length !== 1) errors.push(`${key} 不在同一条线上：${values.join(", ")}`);
  }
  if (!rows.some((row) => row.scrollWidth > row.clientWidth + 1)) {
    errors.push("没有一行出现省略");
  }
  const dated = rows.filter((row) => row.dateLabel !== "时间未记");
  const undated = rows.filter((row) => row.dateLabel === "时间未记");
  if (undated.length < 1) errors.push("没有「时间未记」");
  const datedWidth = dated.length ? Math.max(...dated.map((row) => row.dateWidth)) : 0;
  for (const row of undated) {
    if (row.dateWidth > datedWidth + 0.5) errors.push("「时间未记」比有日期的格子更宽");
  }
  for (const row of rows) {
    if (row.text !== row.titleAttr) errors.push("完整标题不在链接的 title 上");
    if (row.rowHeight < 44) errors.push(`行高 ${row.rowHeight} 小于 44`);
  }
  return errors;
}
