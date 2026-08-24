import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[13px] font-medium tracking-[0.04em] text-lab-primary uppercase",
        className
      )}
    >
      {children}
    </p>
  );
}
