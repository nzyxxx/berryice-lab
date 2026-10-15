import { revalidatePath } from "next/cache";

/** cron 写完主播库之后，让列表和详情在下一次访问时重渲染，不必干等 ISR 窗口。 */
export function revalidateStreamerPages() {
  revalidatePath("/delta-gun/streamers");
  revalidatePath("/delta-gun/streamers/[slug]", "page");
}
