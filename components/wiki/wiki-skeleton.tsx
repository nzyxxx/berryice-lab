import { cn } from "@/lib/utils";

function Bar({ className }: { className: string }) {
  return <div className={cn("animate-pulse rounded-md bg-lab-surface-3", className)} />;
}

export function WikiListSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">正在加载知识库</span>
      <Bar className="h-3 w-24" />
      <Bar className="mt-4 h-10 w-40" />
      <Bar className="mt-4 h-4 w-full max-w-sm" />
      <div className="mt-16 border-t border-lab-hairline">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="border-b border-lab-hairline py-6">
            <Bar className="h-3 w-24" />
            <Bar className="mt-3 h-5 w-4/5" />
            <Bar className="mt-3 h-4 w-full" />
            <Bar className="mt-2 h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function WikiArticleSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">正在加载笔记</span>
      <Bar className="h-3 w-20" />
      <Bar className="mt-5 h-9 w-full" />
      <Bar className="mt-2 h-9 w-3/4" />
      <Bar className="mt-5 h-4 w-56" />
      <div className="mt-12 space-y-3">
        <Bar className="h-4 w-full" />
        <Bar className="h-4 w-full" />
        <Bar className="h-4 w-5/6" />
        <Bar className="mt-8 h-4 w-full" />
        <Bar className="h-4 w-4/5" />
      </div>
    </div>
  );
}
