import { siteIndex } from "@/lib/site-config";

/** 首页六栏。顺序和文案跟顶栏同一份 `siteIndex`。 */
export const homeChannels = siteIndex;

export type HomeChannelId = (typeof homeChannels)[number]["id"];
