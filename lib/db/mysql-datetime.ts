/**
 * MySQL DATETIME 不接受带 `T`、毫秒和 `Z` 的 ISO 时间。
 * 改枪码的 `posted_at` 是 DATETIME。把能解析的时间收成 `YYYY-MM-DD HH:MM:SS`（UTC）。
 * 空的或解析不了的返回 null，让这一行照常写入，而不是整条改枪码被跳过。
 */
export function mysqlDateTime(value: string | null | undefined): string | null {
  const raw = value?.trim() ?? "";
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)) return raw;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 19).replace("T", " ");
}
