export type CommunityCodeFields = {
  weapon: string;
  fullCode: string;
  description: string;
  valueText: string;
};

export type CommunityQuery = {
  q: string;
  category: string;
  weapon: string;
  sort: "hot" | "value";
};

/** 复制出去的就是这一串枪码，不另造。 */
export function communityCopyText(item: CommunityCodeFields): string {
  return item.fullCode;
}

function valueScore(raw: string): number {
  const match = raw.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

export function filterCommunityCodes<T extends CommunityCodeFields & { copyCount?: number }>(
  items: readonly T[],
  query: CommunityQuery,
  typeOf: (weapon: string) => string = () => "assault"
): T[] {
  const q = query.q.trim().toLowerCase();
  const list = items.filter((item) => {
    if (query.category !== "all" && typeOf(item.weapon) !== query.category) return false;
    if (query.weapon !== "all" && item.weapon !== query.weapon) return false;
    if (!q) return true;
    return (
      item.weapon.toLowerCase().includes(q) ||
      item.fullCode.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  });
  return list.sort((a, b) => {
    if (query.sort === "value") return valueScore(b.valueText) - valueScore(a.valueText);
    return (b.copyCount ?? 0) - (a.copyCount ?? 0);
  });
}
