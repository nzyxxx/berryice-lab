import { readFile } from "node:fs/promises";
import path from "node:path";

import gunsFallback from "@/data/guns.json";
import type { Gun } from "@/lib/types/gun";

async function readGunsFile(): Promise<Gun[]> {
  try {
    const filePath = path.join(process.cwd(), "data/guns.json");
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as Gun[];
    return parsed.length > 0 ? parsed : (gunsFallback as Gun[]);
  } catch {
    return gunsFallback as Gun[];
  }
}

export async function getGuns(): Promise<Gun[]> {
  return readGunsFile();
}

export async function getGunById(id: string): Promise<Gun | undefined> {
  const list = await readGunsFile();
  return list.find((g) => g.id === id);
}
