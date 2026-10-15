/**
 * 把页面上的复制次数收成可写入 MySQL / Postgres INT 的非负整数。
 *
 * 武器详情页把上线日期和次数放在同一个单元格：
 *   <span>2026-09-05</span><span class="copy-count">8402</span>
 * cheerio 的 .text() 会拼成 "2026-09-058402"。旧实现把非数字全部剥掉，
 * 得到 202609058402，超过 INT 上限 2147483647，strict mode 下整批 INSERT 失败。
 *
 * 先去掉日期和时间，再只认一处数字（可带 万/w、千/k、亿），
 * 不把不相干的数字串在一起。超出 INT 的结果夹紧，垃圾文本记 0。
 * 列保持 INT，不扩成 BIGINT：线上真实次数是几千到几万，超限的是拼出来的脏值。
 */
export const COPY_COUNT_MAX = 2_147_483_647;

const COUNT_TOKEN =
  /(\d{1,3}(?:[,，]\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)\s*([亿万wWkK])?/g;

export function clampCopyCount(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const rounded = Math.round(value);
  if (rounded > COPY_COUNT_MAX) return COPY_COUNT_MAX;
  return rounded;
}

function unitMultiplier(unit: string | undefined): number {
  if (!unit) return 1;
  if (unit === "亿") return 100_000_000;
  const lower = unit.toLowerCase();
  if (lower === "万" || lower === "w") return 10_000;
  if (lower === "k") return 1_000;
  return 1;
}

function stripNonCountTokens(raw: string): string {
  return raw
    .replace(/\u00a0/g, " ")
    .replace(/\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日/g, " ")
    .replace(/\d{4}[-/.]\d{2}[-/.]\d{2}/g, " ")
    .replace(/\d{1,2}:\d{2}(?::\d{2})?/g, " ");
}

export function parseCopyCount(raw: string): number {
  const matches = [...stripNonCountTokens(raw).matchAll(COUNT_TOKEN)];
  if (matches.length === 0) return 0;

  const withUnit = matches.filter((match) => match[2]);
  const chosen = withUnit.length > 0 ? withUnit[withUnit.length - 1] : matches[matches.length - 1];
  const numeric = Number.parseFloat(chosen[1].replace(/[,，]/g, ""));
  if (!Number.isFinite(numeric)) return 0;

  const scaled = numeric * unitMultiplier(chosen[2]);
  if (scaled > COPY_COUNT_MAX) {
    console.warn(
      `复制次数超出 INT，已夹紧为 ${COPY_COUNT_MAX}: ${JSON.stringify(raw)}`
    );
  }
  return clampCopyCount(scaled);
}
