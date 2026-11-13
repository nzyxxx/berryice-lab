const SENTENCE_END = /[。！？]/;
const CLAUSE_BREAK = /[，、；：/]/;

/**
 * 首页摘要停在完整的一句或一个分句上。
 * 不在字中间截断，也不加省略号。正文不改。
 */
export function homeNoteLine(summary: string): string {
  const plain = summary.replace(/\s+/g, " ").trim();
  if (!plain) return "";
  const end = plain.search(SENTENCE_END);
  const sentence = (end === -1 ? plain : plain.slice(0, end)).trim();
  if (sentence.length <= 42) return sentence;
  const window = sentence.slice(0, 42);
  const breakAt = window.search(CLAUSE_BREAK);
  if (breakAt >= 8) return window.slice(0, breakAt).trim();
  return sentence;
}
