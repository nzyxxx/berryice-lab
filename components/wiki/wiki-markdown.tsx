import {
  parseWikiBlocks,
  parseWikiInlines,
  type BlockNode,
  type InlineNode,
} from "@/lib/content/wiki-markdown";
import { WikiTableScroll } from "@/components/wiki/wiki-table-scroll";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

function WikiInlines({ nodes }: { nodes: InlineNode[] }) {
  return nodes.map((node, index) => {
    if (node.type === "text") return <span key={index}>{node.text}</span>;
    if (node.type === "break") return <br key={index} />;
    if (node.type === "image") {
      return (
        // 站内小图标。宽高写死，避免加载前后把表格撑跳。
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={index}
          src={node.src}
          alt={node.alt}
          width={32}
          height={32}
          loading="lazy"
          decoding="async"
          className="mx-0.5 inline-block size-8 align-middle"
        />
      );
    }
    if (node.type === "code") {
      return (
        <code
          key={index}
          className="break-all rounded-md bg-lab-surface-3 px-1.5 py-0.5 font-mono text-[0.92em] text-lab-ink"
        >
          {node.text}
        </code>
      );
    }
    if (node.type === "strong") {
      return (
        <strong key={index} className="font-medium text-lab-ink">
          <WikiInlines nodes={node.children} />
        </strong>
      );
    }
    if (node.type === "em") {
      return (
        <em key={index}>
          <WikiInlines nodes={node.children} />
        </em>
      );
    }
    const external = node.href.startsWith("http");
    return (
      <a
        key={index}
        href={node.href}
        className="break-all text-lab-primary underline decoration-lab-primary/35 underline-offset-[3px] transition-colors hover:decoration-lab-primary"
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        <WikiInlines nodes={node.children} />
      </a>
    );
  });
}

function WikiBlock({ block }: { block: BlockNode }) {
  if (block.type === "heading") {
    const Tag = `h${block.level}` as "h2" | "h3" | "h4" | "h5" | "h6";
    return (
      <Tag
        className={cn(
          "text-balance font-semibold tracking-tight text-lab-ink",
          block.level === 2
            ? "mt-10 text-[1.375rem] leading-snug first:mt-0"
            : "mt-8 text-lg leading-snug first:mt-0"
        )}
      >
        <WikiInlines nodes={block.children} />
      </Tag>
    );
  }

  if (block.type === "table") {
    return (
      <WikiTableScroll>
        <table className="w-max border-collapse text-sm text-lab-ink">
          <thead>
            <tr>
              {block.header.map((cell, index) => (
                <th
                  key={index}
                  style={{ textAlign: block.align[index] ?? "left" }}
                  className="border-b border-lab-hairline px-2 py-2 align-middle font-medium"
                >
                  <WikiInlines nodes={cell} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, index) => (
                  <td
                    key={index}
                    style={{ textAlign: block.align[index] ?? "left" }}
                    className="border-b border-lab-hairline px-2 py-2 align-middle"
                  >
                    <WikiInlines nodes={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </WikiTableScroll>
    );
  }

  if (block.type === "paragraph") {
    return (
      <p className="text-[15px] leading-7 text-lab-ink-muted">
        <WikiInlines nodes={block.children} />
      </p>
    );
  }

  if (block.type === "code") {
    return (
      <pre className="overflow-x-auto rounded-xl border border-lab-hairline bg-lab-surface-2 px-4 py-3 font-mono text-[13px] leading-relaxed text-lab-ink">
        <code>{block.text}</code>
      </pre>
    );
  }

  if (block.type === "hr") {
    return <hr className="border-lab-hairline" />;
  }

  if (block.type === "quote") {
    return (
      <blockquote className="border-l border-lab-hairline-strong pl-4 text-lab-ink-subtle">
        <div className="flex flex-col gap-3">
          {block.blocks.map((child, index) => (
            <WikiBlock key={index} block={child} />
          ))}
        </div>
      </blockquote>
    );
  }

  const ListTag = block.ordered ? "ol" : "ul";
  return (
    <ListTag
      className={cn(
        "space-y-2 pl-5 text-[15px] leading-7 text-lab-ink-muted marker:text-lab-ink-subtle",
        block.ordered ? "list-decimal" : "list-disc"
      )}
    >
      {block.items.map((item, index) => (
        <li key={index}>
          <WikiInlines nodes={item.children} />
          {item.blocks.length > 0 ? (
            <div className="mt-2 flex flex-col gap-2">
              {item.blocks.map((child, childIndex) => (
                <WikiBlock key={childIndex} block={child} />
              ))}
            </div>
          ) : null}
        </li>
      ))}
    </ListTag>
  );
}

function plainText(nodes: InlineNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === "text" || node.type === "code") return node.text;
      if (node.type === "image") return node.alt;
      if (node.type === "break") return "";
      if ("children" in node) return plainText(node.children);
      return "";
    })
    .join("");
}

export function WikiMarkdown({ source }: { source: string }) {
  const blocks = parseWikiBlocks(source);
  if (blocks.length === 0) return null;
  const sourceFrom = blocks.findIndex(
    (block) => block.type === "heading" && plainText(block.children).trim() === "来源"
  );
  return (
    <div className="flex min-w-0 max-w-full flex-col gap-5">
      {blocks.map((block, index) => (
        <div key={index} className={sourceFrom !== -1 && index >= sourceFrom ? "text-sm text-lab-ink-subtle" : undefined}>
          <WikiBlock block={block} />
        </div>
      ))}
    </div>
  );
}

export function WikiInline({ text }: { text: string }) {
  const lines = text.split("\n");
  const rendered: ReactNode[] = lines.map((line, index) => (
    <span key={index} className={index === 0 ? undefined : "mt-1 block"}>
      <WikiInlines nodes={parseWikiInlines(line)} />
    </span>
  ));
  return <>{rendered}</>;
}
