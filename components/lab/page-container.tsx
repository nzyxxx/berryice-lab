import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("mx-auto max-w-6xl px-6 pb-24 pt-10 md:pt-14", className)}>
      {children}
    </main>
  );
}
