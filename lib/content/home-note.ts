const SENTENCE = /[。！？]/;

/** 首页只留第一句里的一小段。正文不改。 */
export function homeNoteLine(summary: string): string {
  const plain = summary.replace(/\s+/g, " ").trim();
  if (!plain) return "";
  const sentence = plain.split(SENTENCE)[0]?.trim() ?? plain;
  const cap = 32;
  if (sentence.length <= cap) return sentence;
  return `${sentence.slice(0, cap).replace(/[，、：:；\s]+$/u, "")}…`;
}
