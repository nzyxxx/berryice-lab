/**
 * 笔记正文用的一小块 Markdown。
 * 只覆盖知识库实际会出现的结构：标题、段落、有序/无序列表（含缩进）、
 * 引用、代码、行内加粗/代码/链接。不渲染原始 HTML。
 */

export type InlineNode =
  | { type: "text"; text: string }
  | { type: "code"; text: string }
  | { type: "strong"; children: InlineNode[] }
  | { type: "em"; children: InlineNode[] }
  | { type: "link"; href: string; children: InlineNode[] };

export type ListItem = {
  children: InlineNode[];
  blocks: BlockNode[];
};

export type BlockNode =
  | { type: "heading"; level: 2 | 3 | 4 | 5 | 6; children: InlineNode[] }
  | { type: "paragraph"; children: InlineNode[] }
  | { type: "list"; ordered: boolean; items: ListItem[] }
  | { type: "code"; text: string }
  | { type: "quote"; blocks: BlockNode[] }
  | { type: "hr" };

const SAFE_HREF = /^(https?:|mailto:|\/(?!\/))/i;

export function safeWikiHref(href: string): string | null {
  const trimmed = href.trim();
  if (!SAFE_HREF.test(trimmed)) return null;
  return trimmed;
}

export function parseWikiInlines(input: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let text = "";
  let index = 0;

  const flush = () => {
    if (!text) return;
    nodes.push({ type: "text", text });
    text = "";
  };

  while (index < input.length) {
    if (input[index] === "`") {
      const end = input.indexOf("`", index + 1);
      if (end !== -1) {
        flush();
        nodes.push({ type: "code", text: input.slice(index + 1, end) });
        index = end + 1;
        continue;
      }
    }

    if (input.startsWith("**", index)) {
      const end = input.indexOf("**", index + 2);
      if (end !== -1) {
        flush();
        nodes.push({ type: "strong", children: parseWikiInlines(input.slice(index + 2, end)) });
        index = end + 2;
        continue;
      }
    }

    if (input[index] === "*" && !input.startsWith("**", index)) {
      const end = input.indexOf("*", index + 1);
      if (end !== -1) {
        flush();
        nodes.push({ type: "em", children: parseWikiInlines(input.slice(index + 1, end)) });
        index = end + 1;
        continue;
      }
    }

    if (input[index] === "[") {
      const labelEnd = input.indexOf("]", index + 1);
      if (labelEnd !== -1 && input[labelEnd + 1] === "(") {
        const hrefEnd = input.indexOf(")", labelEnd + 2);
        if (hrefEnd !== -1) {
          const label = input.slice(index + 1, labelEnd);
          const href = safeWikiHref(input.slice(labelEnd + 2, hrefEnd));
          flush();
          if (href) {
            nodes.push({ type: "link", href, children: parseWikiInlines(label) });
          } else {
            nodes.push(...parseWikiInlines(label));
          }
          index = hrefEnd + 1;
          continue;
        }
      }
    }

    text += input[index];
    index += 1;
  }

  flush();
  return nodes;
}

function indentOf(line: string): number {
  let count = 0;
  while (count < line.length && line[count] === " ") count += 1;
  return count;
}

function listMarker(trimmed: string): { ordered: boolean; text: string } | null {
  const match = trimmed.match(/^(-|\d+\.)\s+(.*)$/);
  if (!match) return null;
  return { ordered: match[1] !== "-", text: match[2] };
}

function isBlockStart(trimmed: string): boolean {
  return (
    trimmed.startsWith("```") ||
    /^#{1,6}\s+/.test(trimmed) ||
    /^(-|\d+\.)\s+/.test(trimmed) ||
    trimmed.startsWith(">") ||
    /^(-{3,}|\*{3,})$/.test(trimmed.trim())
  );
}

function parseLines(
  lines: string[],
  start: number,
  end: number,
  baseIndent: number
): { blocks: BlockNode[]; index: number } {
  const blocks: BlockNode[] = [];
  let index = start;

  while (index < end) {
    const line = lines[index];
    if (line.trim() === "") {
      index += 1;
      continue;
    }

    const indent = indentOf(line);
    if (indent < baseIndent) break;
    const trimmed = line.slice(indent);

    if (trimmed.startsWith("```")) {
      const code: string[] = [];
      index += 1;
      while (index < end && !lines[index].trim().startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      if (index < end) index += 1;
      blocks.push({ type: "code", text: code.join("\n") });
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading && indent === baseIndent) {
      const level = Math.max(2, heading[1].length) as 2 | 3 | 4 | 5 | 6;
      blocks.push({ type: "heading", level, children: parseWikiInlines(heading[2].trim()) });
      index += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(trimmed.trim()) && indent === baseIndent) {
      blocks.push({ type: "hr" });
      index += 1;
      continue;
    }

    if (trimmed.startsWith(">") && indent === baseIndent) {
      const quoted: string[] = [];
      while (index < end) {
        const current = lines[index];
        if (indentOf(current) !== baseIndent || !current.slice(baseIndent).startsWith(">")) break;
        quoted.push(current.slice(baseIndent).replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push({ type: "quote", blocks: parseLines(quoted, 0, quoted.length, 0).blocks });
      continue;
    }

    const marker = listMarker(trimmed);
    if (marker && indent === baseIndent) {
      const ordered = marker.ordered;
      const items: ListItem[] = [];
      while (index < end) {
        const current = lines[index];
        if (current.trim() === "") break;
        const currentIndent = indentOf(current);
        if (currentIndent !== baseIndent) break;
        const currentMarker = listMarker(current.slice(currentIndent));
        if (!currentMarker || currentMarker.ordered !== ordered) break;
        index += 1;
        const nestedStart = index;
        while (index < end) {
          const next = lines[index];
          if (next.trim() === "") break;
          if (indentOf(next) <= baseIndent) break;
          index += 1;
        }
        let nested: BlockNode[] = [];
        if (index > nestedStart) {
          const nestedIndent = Math.min(
            ...lines.slice(nestedStart, index).filter((item) => item.trim() !== "").map(indentOf)
          );
          nested = parseLines(lines, nestedStart, index, nestedIndent).blocks;
        }
        items.push({ children: parseWikiInlines(currentMarker.text), blocks: nested });
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    const paragraph = [trimmed];
    index += 1;
    while (index < end) {
      const next = lines[index];
      if (next.trim() === "") break;
      const nextIndent = indentOf(next);
      if (nextIndent !== baseIndent) break;
      const nextTrimmed = next.slice(nextIndent);
      if (isBlockStart(nextTrimmed)) break;
      paragraph.push(nextTrimmed);
      index += 1;
    }
    blocks.push({ type: "paragraph", children: parseWikiInlines(paragraph.join(" ")) });
  }

  return { blocks, index };
}

export function parseWikiBlocks(source: string): BlockNode[] {
  const lines = source
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/^\t+/, (tabs) => "  ".repeat(tabs.length)));
  return parseLines(lines, 0, lines.length, 0).blocks;
}
