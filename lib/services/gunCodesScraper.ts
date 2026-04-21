import * as cheerio from "cheerio";

import { ensureGunCodesTable, upsertGunCodes } from "@/lib/repositories/gunCodesRepo";
import type { GunCodeRecord, UpsertSummary } from "@/lib/types/gunCode";

const SOURCE_URL = "https://g.aitags.cn/";

function detectGame(fullCode: string, weapon: string): string {
  // 烽火地带的码格式：武器名-烽火地带-CODE
  if (fullCode.includes("烽火地带") || weapon.includes("烽火地带")) {
    return "烽火地带";
  }
  return "三角洲行动";
}

function parseCopyCount(raw: string): number {
  const numbers = raw.replace(/[^\d]/g, "");
  return numbers ? Number(numbers) : 0;
}

function parseGunCodesFromHtml(html: string): GunCodeRecord[] {
  const $ = cheerio.load(html);
  const records: GunCodeRecord[] = [];

  // 找武器列表表格（含"改枪码"表头的那个）
  $("table").each((_, tableEl) => {
    const headers = $(tableEl).find("th").map((_, th) => $(th).text().trim()).get();
    const hasCodeCol = headers.some((h) => h.includes("改枪码") || h.includes("武器"));
    if (!hasCodeCol) return;

    $(tableEl).find("tr").slice(1).each((_, row) => {
      const tds = $(row).find("td");
      if (tds.length < 5) return;

      const weapon = $(tds[0]).text().trim();
      const fullCode = $(tds[1]).text().trim().replace(/`/g, "");
      const description = $(tds[2]).text().trim();
      // 第4列可能是价值，第5列复制次数（6列时第6列是"操作"，忽略）
      const valueText = $(tds[3]).text().trim();
      const copyCount = parseCopyCount($(tds[4]).text().trim());

      if (!weapon || !fullCode) return;

      const game = detectGame(fullCode, weapon);

      records.push({
        game,
        weapon,
        fullCode,
        description,
        valueText,
        copyCount,
        source: "g.aitags.cn",
      });
    });
  });

  return records;
}

export async function scrapeGunCodes(): Promise<{ parsed: number; summary: UpsertSummary }> {
  const response = await fetch(SOURCE_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh;q=0.9",
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`抓取来源站点失败: HTTP ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const records = parseGunCodesFromHtml(html);

  if (records.length === 0) {
    throw new Error("解析到 0 条改枪码，页面结构可能已变更");
  }

  await ensureGunCodesTable();
  const summary = await upsertGunCodes(records);

  return { parsed: records.length, summary };
}
