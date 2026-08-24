import gunsJson from "@/data/guns.json";
import type { Gun } from "@/lib/types/gun";

/** 构建时打包的枪械目录（由同步脚本写入 data/guns.json） */
export const guns: Gun[] = gunsJson as Gun[];

export function getGunByIdSync(id: string): Gun | undefined {
  return guns.find((g) => g.id === id);
}
