import {
  parseWikiBlocks,
  parseWikiInlines,
  type BlockNode,
  type InlineNode,
} from "@/lib/content/wiki-markdown";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

function WikiInlines({ nodes }: { nodes: InlineNode[] }) {
  return nodes.map((node, index) => {
    if (node.type === "text") return <span key={index}>{node.text}</span>;
    if (node.type === "code") {
      return (
        <code
          key={index}
          className="break-all rounded bg-lab-surface-2 px-1 py-0.5 font-mono text-[13px] text-lab-ink"
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
        className="break-all text-lab-primary underline decoration-lab-primary/40 underline-offset-2"
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
          "font-semibold tracking-tight text-lab-ink",
          block.level === 2 ? "mt-8 text-xl first:mt-0" : "mt-6 text-lg first:mt-0"
        )}
      >
        <WikiInlines nodes={block.children} />
      </Tag>
    );
  }

  if (block.type === "paragraph") {
    return (
      <p className="text-[15px] leading-relaxed text-lab-ink-muted">
        <WikiInlines nodes={block.children} />
      </p>
    );
  }

  if (block.type === "code") {
    return (
      <pre className="overflow-x-auto rounded-2xl bg-lab-surface-1 p-3 font-mono text-xs leading-relaxed text-lab-ink">
        <code>{block.text}</code>
      </pre>
    );
  }

  if (block.type === "hr") {
    return <hr className="border-white/10" />;
  }

  if (block.type === "quote") {
    return (
      <blockquote className="border-l border-lab-primary/40 pl-4 text-lab-ink-subtle">
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
        "space-y-2 pl-5 text-[15px] leading-relaxed text-lab-ink-muted marker:text-lab-ink-tertiary",
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

export function WikiMarkdown({ source }: { source: string }) {
  const blocks = parseWikiBlocks(source);
  if (blocks.length === 0) return null;
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block, index) => (
        <WikiBlock key={index} block={block} />
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
