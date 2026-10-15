import assert from "node:assert/strict";
import test from "node:test";

import { COPY_COUNT_MAX, parseCopyCount } from "@/lib/delta-gun/parse-copy-count";
import { parseGunCodesFromHtml } from "@/lib/services/gunCodesScraper";

/** 旧实现：剥掉非数字后把剩下的数字串接起来。线上因此写出 202609058402。 */
function legacyParseCopyCount(raw: string): number {
  const numbers = raw.replace(/[^\d]/g, "");
  return numbers ? Number(numbers) : 0;
}

const WEAPON_FIXTURE = `
  <h2>汤姆逊冲锋枪改枪码</h2>
  <table>
    <tr>
      <th>改枪码（点击行可展开图片）</th>
      <th>描述</th>
      <th>价值</th>
      <th>上线时间</th>
      <th>点赞 / 反馈</th>
    </tr>
    <tr>
      <td><span class="code-chip">汤姆逊冲锋枪-烽火地带-6L6KLNO0AEK0SD1PJ432L</span></td>
      <td>满腰射</td>
      <td>12W</td>
      <td><span>2026-09-05</span><span class="copy-count hide-num">8402</span></td>
      <td>24</td>
    </tr>
    <tr><td>暂无图片</td></tr>
    <tr>
      <td><span class="code-chip">M4A1突击步枪-烽火地带-6HH8PD802AMR3AEE8LQVJ</span></td>
      <td>稳</td>
      <td>25W</td>
      <td><span>2026-10-01</span><span class="copy-count">1.2w</span></td>
      <td>1</td>
    </tr>
    <tr>
      <td><span class="code-chip">AKM突击步枪-烽火地带-6JQ3PG00FKLSP2R6J3NCE</span></td>
      <td></td>
      <td>30W</td>
      <td><span>2026-08-01</span><span class="copy-count">12万</span></td>
      <td>1</td>
    </tr>
    <tr>
      <td><span class="code-chip">SKS射手步枪-烽火地带-6ABCDEFGH1234567890</span></td>
      <td>日期和次数粘在一起，没有 copy-count class</td>
      <td>10W</td>
      <td>2026-09-058402</td>
      <td>0</td>
    </tr>
    <tr>
      <td><span class="code-chip">AWM狙击步枪-烽火地带-6ZZZZZZZ12345678</span></td>
      <td>垃圾次数</td>
      <td>8W</td>
      <td><span class="copy-count">不是数字</span></td>
      <td>0</td>
    </tr>
  </table>
`;

const HOME_FIXTURE = `
  <table>
    <tr>
      <th>武器</th><th>改枪码</th><th>描述</th><th>价值</th><th>复制次数</th><th>操作</th>
    </tr>
    <tr>
      <td>汤姆逊冲锋枪</td>
      <td><code>汤姆逊冲锋枪-烽火地带-6L6TJ2800MM0O09MEHVB9</code></td>
      <td>满腰射</td>
      <td>35W</td>
      <td><span>16591 次</span></td>
      <td>复制</td>
    </tr>
  </table>
`;

test("parseCopyCount 识别万/w、千/k、亿，不把日期和次数串起来", () => {
  assert.equal(parseCopyCount("8402"), 8402);
  assert.equal(parseCopyCount("16591 次"), 16591);
  assert.equal(parseCopyCount("16,591"), 16591);
  assert.equal(parseCopyCount("1,234,567"), 1_234_567);
  assert.equal(parseCopyCount("1.2w"), 12_000);
  assert.equal(parseCopyCount("1.2W"), 12_000);
  assert.equal(parseCopyCount("1.2w+"), 12_000);
  assert.equal(parseCopyCount("12万"), 120_000);
  assert.equal(parseCopyCount("1.2万"), 12_000);
  assert.equal(parseCopyCount("约12万"), 120_000);
  assert.equal(parseCopyCount("3.5k"), 3_500);
  assert.equal(parseCopyCount("3.5K"), 3_500);
  assert.equal(parseCopyCount("1.5亿"), 150_000_000);
  assert.equal(parseCopyCount("12.4"), 12);
  assert.equal(parseCopyCount("12.5"), 13);
  assert.equal(parseCopyCount("1,234.5"), 1235);
  assert.equal(parseCopyCount("2026-09-05 8402"), 8402);
  assert.equal(parseCopyCount("2026-09-058402"), 8402);
  assert.equal(parseCopyCount("2026年09月05日8402"), 8402);
  assert.equal(parseCopyCount("2026-09-05 12:00:00 8402"), 8402);
  assert.equal(parseCopyCount(""), 0);
  assert.equal(parseCopyCount("abc"), 0);
  assert.equal(parseCopyCount("复制"), 0);
  assert.equal(parseCopyCount("NaN"), 0);
  assert.equal(parseCopyCount("--"), 0);
  assert.equal(parseCopyCount("2,147,483,648"), COPY_COUNT_MAX);
  assert.equal(parseCopyCount("202609058402"), COPY_COUNT_MAX);
});

test("旧解析会超出 INT，新解析落在列范围内", () => {
  const concatenated = "2026-09-058402";
  assert.ok(legacyParseCopyCount(concatenated) > COPY_COUNT_MAX);
  assert.equal(legacyParseCopyCount(concatenated), 202_609_058_402);
  assert.equal(parseCopyCount(concatenated), 8402);
  assert.ok(parseCopyCount("1.2w") <= COPY_COUNT_MAX);
  assert.notEqual(parseCopyCount("1.2w"), legacyParseCopyCount("1.2w"));
});

test("武器详情页读取 .copy-count，不把上线日期写进 copy_count", () => {
  const records = parseGunCodesFromHtml(WEAPON_FIXTURE, "weapon");
  const byCode = new Map(records.map((record) => [record.fullCode, record.copyCount]));

  assert.equal(byCode.get("6L6KLNO0AEK0SD1PJ432L"), 8402);
  assert.equal(byCode.get("6HH8PD802AMR3AEE8LQVJ"), 12_000);
  assert.equal(byCode.get("6JQ3PG00FKLSP2R6J3NCE"), 120_000);
  assert.equal(byCode.get("6ABCDEFGH1234567890"), 8402);
  assert.equal(byCode.get("6ZZZZZZZ12345678"), 0);
  assert.equal(records.length, 5);
  for (const count of byCode.values()) {
    assert.ok(count >= 0 && count <= COPY_COUNT_MAX);
  }
});

test("首页复制次数列不被价值列的 35W 干扰", () => {
  const records = parseGunCodesFromHtml(HOME_FIXTURE, "home");
  assert.equal(records.length, 1);
  assert.equal(records[0]?.weapon, "汤姆逊冲锋枪");
  assert.equal(records[0]?.copyCount, 16591);
  assert.equal(records[0]?.valueText, "35W");
});
