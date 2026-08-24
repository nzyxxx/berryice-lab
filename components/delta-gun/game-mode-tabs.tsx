"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GAME_MODE_TABS,
  getGameModeThemeByValue,
} from "@/lib/delta-gun/game-mode-theme";
import type { GameMode } from "@/lib/delta-gun/game-modes";
import { cn } from "@/lib/utils";

export function GameModeTabs({
  value,
  onChange,
  className,
}: {
  value: GameMode;
  onChange: (mode: GameMode) => void;
  className?: string;
}) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as GameMode)} className={className}>
      <TabsList className="h-auto gap-1 border border-lab-hairline bg-lab-surface-2 p-1">
        {GAME_MODE_TABS.map(({ value: modeValue, label }) => {
          const theme = getGameModeThemeByValue(modeValue);
          return (
            <TabsTrigger
              key={modeValue}
              value={modeValue}
              className={cn(
                "h-auto rounded-md px-4 py-1.5 text-sm font-medium transition-all",
                theme.tabTrigger
              )}
            >
              {label}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
