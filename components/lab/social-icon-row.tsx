"use client";

import { HoverBorderGradient } from "@/components/aceternity/hover-border-gradient";
import type { SocialIconId } from "@/lib/site-config";
import { Code2, Mail } from "lucide-react";
import type { ReactNode } from "react";

function KookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        fill="currentColor"
        d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2Zm2.832 14.4h-2.208c-.313 0-.583-.185-.712-.454l-.95-2.05H9.48l.95 2.05c.129.27.4.455.712.455h2.208c.313 0 .583-.186.712-.455l1.25-2.69a.833.833 0 0 0-.712-1.187h-2.208c-.313 0-.583.186-.712.455l-.95 2.05H9.48l.95-2.05c.129-.27.4-.455.712-.455h2.208c.313 0 .583.186.712.455l1.25 2.69a.833.833 0 0 0-.712 1.187h1.233Z"
      />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        fill="currentColor"
        d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.71.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.57 2.34 1.12 2.91.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 7.09c.85 0 1.71.12 2.51.35 1.91-1.32 2.75-1.05 2.75-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.38-.01 2.48-.01 2.82 0 .27.18.6.69.49A10.04 10.04 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        fill="currentColor"
        d="M14.23 10.16 21.2 2h-1.65l-6.06 7.12L8.65 2H2.5l7.32 10.91L2.5 22h1.65l6.4-7.52L15.35 22H21.5l-7.27-11.84Zm-2.26 2.66-.74-1.09L4.74 3.3h2.54l4.76 6.99.74 1.09 6.2 9.11h-2.54l-5.47-8.06Z"
      />
    </svg>
  );
}

function BilibiliIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        fill="currentColor"
        d="M5.4 6.2 3.7 4.5l1.1-1.1 2.2 2.2h10l2.2-2.2 1.1 1.1-1.7 1.7H21a1 1 0 0 1 1 1v11.5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.2a1 1 0 0 1 1-1h2.4Zm-1.4 1v10.5h16V7.2H4Zm4.2 2.4 2.4 2.1-2.4 2.1.9 1 3-2.6v-1l-3-2.6-.9 1Zm7.6 0-.9-1-3 2.6v1l3 2.6.9-1-2.4-2.1 2.4-2.1Z"
      />
    </svg>
  );
}

const ICONS: Record<SocialIconId, ReactNode> = {
  github: <GitHubIcon className="size-4" />,
  repo: <Code2 className="size-4" />,
  mail: <Mail className="size-4" />,
  x: <XIcon className="size-4" />,
  bilibili: <BilibiliIcon className="size-4" />,
  kook: <KookIcon className="size-4" />,
};

export function SocialIconRow({
  links,
}: {
  links: { id: SocialIconId; label: string; href: string }[];
}) {
  if (links.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center justify-center gap-2.5">
      {links.map((link) => {
        const external = link.href.startsWith("http");
        return (
          <li key={link.id}>
            <HoverBorderGradient
              as="a"
              href={link.href}
              aria-label={link.label}
              title={link.label}
              duration={1.2}
              containerClassName="rounded-full"
              className="flex size-11 items-center justify-center bg-lab-surface-1 p-0 text-lab-ink-subtle hover:text-lab-primary"
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {ICONS[link.id]}
            </HoverBorderGradient>
          </li>
        );
      })}
    </ul>
  );
}
