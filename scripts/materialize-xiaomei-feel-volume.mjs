#!/usr/bin/env node
/**
 * Write volume rest webps into public/xiaomei/ from base64 JSON.
 * Kept as text so box agents can push without binary git auth.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assetsPath = join(root, "scripts/xiaomei-feel-volume-assets.json");
const outDir = join(root, "public/xiaomei");
const assets = JSON.parse(readFileSync(assetsPath, "utf8"));
mkdirSync(outDir, { recursive: true });
for (const [name, b64] of Object.entries(assets)) {
  const dest = join(outDir, `${name}.webp`);
  const buf = Buffer.from(b64, "base64");
  if (buf.subarray(0, 4).toString() !== "RIFF" || buf.subarray(8, 12).toString() !== "WEBP") {
    throw new Error(`feel_volume asset ${name} is not a webp`);
  }
  writeFileSync(dest, buf);
  if (!existsSync(dest)) throw new Error(`failed to write ${dest}`);
}
console.log(`materialized ${Object.keys(assets).length} feel_volume webps into public/xiaomei/`);
