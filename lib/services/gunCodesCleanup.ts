import { cleanupOldGunCodes, ensureGunCodesTable } from "@/lib/repositories/gunCodesRepo";

export async function cleanupGunCodes(days = 30): Promise<number> {
  await ensureGunCodesTable();
  return cleanupOldGunCodes(days);
}
