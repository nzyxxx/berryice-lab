/**
 * 笔记正文用的一小块 Markdown。
 * 覆盖标题、段落、有序/无序列表（含缩进）、引用、代码、行内加粗/代码/链接、
 * 同站图片、表格，以及表格里单独的 <br>。不渲染其它原始 HTML。
 */

export type InlineNode =
  | { type: "text"; text: string }
  | { type: "code"; text: string }
  | { type: "break" }
  | { type: "image"; alt: string; src: string }
  | { type: "strong"; children: InlineNode[] }
  | { type: "em"; children: InlineNode[] }
  | { type: "link"; href: string; children: InlineNode[] };

export type ListItem = {
  children: InlineNode[];
  blocks: BlockNode[];
};

export type TableAlign = "left" | "center" | "right";

export type BlockNode =
  | { type: "heading"; level: 2 | 3 | 4 | 5 | 6; children: InlineNode[] }
  | { type: "paragraph"; children: InlineNode[] }
  | { type: "list"; ordered: boolean; items: ListItem[] }
  | { type: "code"; text: string }
  | { type: "quote"; blocks: BlockNode[] }
  | { type: "hr" }
  | { type: "table"; align: TableAlign[]; header: InlineNode[][]; rows: InlineNode[][][] };

const SAFE_HREF = /^(https?:|mailto:|\/(?!\/))/i;

export function safeWikiHref(href: string): string | null {
  const trimmed = href.trim();
  if (!SAFE_HREF.test(trimmed)) return null;
  return trimmed;
}

/** 正文图片只收站内路径。中文文件名可以，远程地址、协议和上级目录不行。 */
export function safeWikiImageSrc(src: string): string | null {
  const trimmed = src.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  if (trimmed.includes("..") || /[\\?#\s:]/.test(trimmed)) return null;
  if (!/\.(?:webp|png|gif|jpe?g)$/i.test(trimmed)) return null;
  const parts = trimmed.slice(1).split("/");
  if (parts.some((part) => part === "" || part === "." || part === "..")) return null;
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

    const lineBreak = input.slice(index).match(/^<br\s*\/?>/i);
    if (lineBreak) {
      flush();
      nodes.push({ type: "break" });
      index += lineBreak[0].length;
      continue;
    }

    if (input.startsWith("![", index)) {
      const altEnd = input.indexOf("]", index + 2);
      if (altEnd !== -1 && input[altEnd + 1] === "(") {
        const srcEnd = input.indexOf(")", altEnd + 2);
        if (srcEnd !== -1) {
          const alt = input.slice(index + 2, altEnd);
          const src = safeWikiImageSrc(input.slice(altEnd + 2, srcEnd));
          flush();
          if (src) nodes.push({ type: "image", alt, src });
          else nodes.push({ type: "text", text: alt });
          index = srcEnd + 1;
          continue;
        }
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
    /^(-{3,}|\*{3,})$/.test(trimmed.trim()) ||
    trimmed.startsWith("|")
  );
}

function splitTableRow(line: string): string[] | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|") || trimmed.length < 2) return null;
  const body = trimmed.slice(1, -1);
  const cells: string[] = [];
  let current = "";
  for (let index = 0; index < body.length; index += 1) {
    if (body[index] === "\\" && body[index + 1] === "|") {
      current += "|";
      index += 1;
      continue;
    }
    if (body[index] === "|") {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += body[index];
  }
  cells.push(current.trim());
  return cells;
}

function tableAlign(line: string): TableAlign[] | null {
  const cells = splitTableRow(line);
  if (!cells || cells.length === 0) return null;
  const align: TableAlign[] = [];
  for (const cell of cells) {
    if (!/^:?-{3,}:?$/.test(cell)) return null;
    if (cell.startsWith(":") && cell.endsWith(":")) align.push("center");
    else if (cell.endsWith(":")) align.push("right");
    else align.push("left");
  }
  return align;
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

    const headerCells = indent === baseIndent ? splitTableRow(trimmed) : null;
    const align = headerCells && index + 1 < end ? tableAlign(lines[index + 1].trim()) : null;
    if (headerCells && align && headerCells.length === align.length) {
      const width = headerCells.length;
      const fit = (cells: string[]) =>
        Array.from({ length: width }, (_, cell) => parseWikiInlines(cells[cell] ?? ""));
      const rows: InlineNode[][][] = [];
      index += 2;
      while (index < end) {
        const current = lines[index];
        if (current.trim() === "") break;
        if (indentOf(current) !== baseIndent) break;
        const cells = splitTableRow(current.trim());
        if (!cells) break;
        rows.push(fit(cells));
        index += 1;
      }
      blocks.push({ type: "table", align, header: fit(headerCells), rows });
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
