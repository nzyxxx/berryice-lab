"use client";

import { cn } from "@/lib/utils";

/** OriginKit — Weight Hover：指针靠近时字重加重 https://www.originkit.dev */
export function WeightHover({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex", className)} aria-label={text}>
      {Array.from(text).map((char, index) => (
        <span
          key={`${char}-${index}`}
          className="inline-block cursor-default transition-[font-weight,transform,color] duration-200 hover:-translate-y-0.5 hover:font-semibold hover:text-lab-primary"
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}
