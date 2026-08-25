import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-10 text-sm rounded-xl",
  md: "size-14 text-lg rounded-2xl",
  lg: "size-20 text-2xl rounded-2xl",
} as const;

export function StreamerAvatar({
  initial,
  accentColor,
  size = "md",
  className,
}: {
  initial: string;
  accentColor: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center font-bold text-lab-canvas",
        SIZES[size],
        className
      )}
      style={{
        backgroundColor: accentColor,
        boxShadow: `0 0 24px -6px ${accentColor}`,
      }}
    >
      {initial}
    </span>
  );
}
