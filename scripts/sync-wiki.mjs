#!/usr/bin/env node
/**
 * 把一批 Markdown 推进知识库。
 *
 * 复制到本机内容目录（仓库里的 content/wiki，或 --out）：
 *   node scripts/sync-wiki.mjs --dir /path/to/notes
 *
 * 推到正在跑的站点。这是 Bear 批量补录时用的路径，不必等 git push：
 *   WIKI_ADMIN_TOKEN=... node scripts/sync-wiki.mjs --ingest \
 *     --dir /path/to/notes --site https://berryice.cn
 *
 * 单篇：
 *   WIKI_ADMIN_TOKEN=... node scripts/sync-wiki.mjs --ingest \
 *     --file ./note.md --slug my-note --site https://berryice.cn
 *
 * slug 取文件名去掉 .md。字符只允许字母、数字、点、下划线、连字符。
 */

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SLUG = /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/;

function arg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) return null;
  return value;
}

function slugFromFilename(name) {
  const base = name.replace(/\.md$/i, "");
  if (!SLUG.test(base) || base.includes("..") || base.startsWith(".") || base.endsWith(".")) {
    throw new Error(`文件名不能当 slug：${name}`);
  }
  return base;
}

async function collect(dir, file, slugArg) {
  if (file) {
    const slug = slugArg || slugFromFilename(path.basename(file));
    return [{ slug, markdown: await readFile(file, "utf8") }];
  }
  if (!dir) {
    console.error("需要 --dir 或 --file。用法写在 scripts/sync-wiki.mjs 开头。");
    process.exit(1);
  }
  const names = (await readdir(dir)).filter((name) => name.endsWith(".md") && !name.startsWith("."));
  const notes = [];
  for (const name of names) {
    notes.push({
      slug: slugFromFilename(name),
      markdown: await readFile(path.join(dir, name), "utf8"),
    });
  }
  return notes;
}

async function copyNotes(notes, outDir) {
  await mkdir(outDir, { recursive: true });
  for (const note of notes) {
    const body = note.markdown.endsWith("\n") ? note.markdown : `${note.markdown}\n`;
    await writeFile(path.join(outDir, `${note.slug}.md`), body);
    console.log(`copied ${note.slug}`);
  }
}

async function ingestNotes(notes, site, token) {
  let failed = 0;
  for (const note of notes) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch(`${site}/api/wiki/ingest`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slug: note.slug, markdown: note.markdown }),
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.ok !== true) {
        failed += 1;
        console.error(`fail ${note.slug} ${response.status} ${payload.message ?? ""}`);
      } else {
        console.log(`ingested ${note.slug} created=${payload.created}`);
      }
    } catch (error) {
      failed += 1;
      console.error(`fail ${note.slug} ${error instanceof Error ? error.message : error}`);
    } finally {
      clearTimeout(timer);
    }
  }
  if (failed > 0) process.exit(1);
}

const ingest = process.argv.includes("--ingest");
const dir = arg("--dir");
const file = arg("--file");
const slugArg = arg("--slug");
const site = (arg("--site") || process.env.WIKI_SITE || "https://berryice.cn").replace(/\/$/, "");
const outDir = arg("--out") || path.join(process.cwd(), "content", "wiki");

try {
  const notes = await collect(dir, file, slugArg);
  if (notes.length === 0) {
    console.error("没有 .md 可同步");
    process.exit(1);
  }

  if (!ingest) {
    await copyNotes(notes, outDir);
  } else {
    const token = process.env.WIKI_ADMIN_TOKEN;
    if (!token) {
      console.error("ingest 需要环境变量 WIKI_ADMIN_TOKEN");
      process.exit(1);
    }
    await ingestNotes(notes, site, token);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
