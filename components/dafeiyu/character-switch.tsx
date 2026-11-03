import { glassSurfaceClass } from "@/components/uiverse/glass-surface";
import { LAB_CHARACTERS, type LabCharacterId } from "@/lib/dafeiyu/characters";
import { cn } from "@/lib/utils";

export function CharacterSwitch({
  characterId,
  locked,
  xiaomeiReady,
  onSelect,
}: {
  characterId: LabCharacterId;
  locked: boolean;
  xiaomeiReady: boolean;
  onSelect: (id: LabCharacterId) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div
        role="radiogroup"
        aria-label="对照角色"
        aria-busy={locked}
        className={glassSurfaceClass("inline-flex rounded-full p-1")}
      >
        {LAB_CHARACTERS.map((character) => {
          const selected = character.id === characterId;
          return (
            <button
              key={character.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={character.id === "xiaomei" ? (xiaomeiReady ? "小莓" : "小莓，空包占位") : character.label}
              disabled={locked}
              className={cn(
                "min-h-11 cursor-pointer rounded-full px-4 text-sm motion-reduce:transition-none",
                "transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lab-primary",
                "disabled:cursor-default disabled:opacity-60",
                selected ? "bg-lab-primary/15 font-medium text-lab-ink" : "text-lab-ink-muted hover:text-lab-ink",
              )}
              onClick={() => onSelect(character.id)}
            >
              {character.label}
            </button>
          );
        })}
      </div>
      {characterId === "xiaomei" ? (
        <p className="text-sm text-lab-ink-subtle">{xiaomeiReady ? "可以拖一拖" : "空包占位"}</p>
      ) : null}
    </div>
  );
}
