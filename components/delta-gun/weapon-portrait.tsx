"use client";

import {
  inferWeaponType,
  weaponTypeShortLabel,
} from "@/lib/delta-gun/weapon-utils";
import type { GunType } from "@/lib/types/gun";
import { cn } from "@/lib/utils";
import {
  CircleDot,
  Crosshair,
  Focus,
  Layers,
  Target,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";

const TYPE_STYLE: Record<
  GunType,
  { gradient: string; icon: LucideIcon; iconClass: string }
> = {
  assault: {
    gradient: "from-lab-primary/40 via-lab-surface-2 to-lab-canvas",
    icon: Target,
    iconClass: "text-lab-primary",
  },
  smg: {
    gradient: "from-lab-accent-glow/35 via-lab-surface-2 to-lab-canvas",
    icon: Zap,
    iconClass: "text-lab-accent-glow",
  },
  sniper: {
    gradient: "from-sky-500/35 via-lab-surface-2 to-lab-canvas",
    icon: Focus,
    iconClass: "text-sky-400",
  },
  shotgun: {
    gradient: "from-amber-500/30 via-lab-surface-2 to-lab-canvas",
    icon: Crosshair,
    iconClass: "text-amber-400/90",
  },
  pistol: {
    gradient: "from-rose-400/25 via-lab-surface-2 to-lab-canvas",
    icon: CircleDot,
    iconClass: "text-rose-300/90",
  },
  lmg: {
    gradient: "from-emerald-500/30 via-lab-surface-2 to-lab-canvas",
    icon: Layers,
    iconClass: "text-emerald-400/90",
  },
  marksman: {
    gradient: "from-violet-500/30 via-lab-surface-2 to-lab-canvas",
    icon: Focus,
    iconClass: "text-violet-400/90",
  },
  special: {
    gradient: "from-fuchsia-500/25 via-lab-surface-2 to-lab-canvas",
    icon: Crosshair,
    iconClass: "text-fuchsia-300/90",
  },
};

const SIZE_MAP = {
  sm: {
    box: "size-12",
    icon: "size-4",
    text: "text-[10px] leading-tight",
  },
  md: {
    box: "size-16",
    icon: "size-5",
    text: "text-[11px] leading-tight",
  },
  lg: {
    box: "size-20",
    icon: "size-6",
    text: "text-xs leading-tight",
  },
} as const;

function TypeBadge({
  type,
  size,
}: {
  type: GunType;
  size: keyof typeof SIZE_MAP;
}) {
  const style = TYPE_STYLE[type];
  const Icon = style.icon;
  const label = weaponTypeShortLabel(type);
  const dim = SIZE_MAP[size];

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-1">
      <Icon className={cn(dim.icon, style.iconClass)} strokeWidth={1.75} aria-hidden />
      <span
        className={cn(
          "text-center font-medium text-lab-ink-muted",
          dim.text
        )}
      >
        {label}
      </span>
    </div>
  );
}

export function WeaponPortrait({
  name,
  type,
  imageUrl,
  size = "md",
  className,
}: {
  name: string;
  type?: GunType;
  imageUrl?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const resolvedType = type ?? inferWeaponType(name);
  const style = TYPE_STYLE[resolvedType];
  const dim = SIZE_MAP[size];

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-lg border border-lab-hairline bg-gradient-to-br",
        style.gradient,
        dim.box,
        className
      )}
      title={weaponTypeShortLabel(resolvedType)}
    >
      {imageUrl ? (
        <>
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover opacity-85"
            sizes="80px"
            unoptimized
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-lab-canvas via-lab-canvas/90 to-transparent px-1 pb-1 pt-4">
            <p className={cn("text-center font-medium text-lab-ink", dim.text)}>
              {weaponTypeShortLabel(resolvedType)}
            </p>
          </div>
        </>
      ) : (
        <TypeBadge type={resolvedType} size={size} />
      )}
    </div>
  );
}
