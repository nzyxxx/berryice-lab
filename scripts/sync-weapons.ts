import { scrapeAndSaveWeapons } from "../lib/services/weaponsScraper";

const result = await scrapeAndSaveWeapons();
console.log(`Synced ${result.count} weapons → ${result.path}`);
