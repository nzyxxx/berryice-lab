"use client";

import { PassportCard } from "@/components/stickers/kitchen/passport-card";
import { SourceIntake } from "@/components/stickers/kitchen/source-intake";
import type { useStickerKitchen } from "@/components/stickers/kitchen/use-sticker-kitchen";

const SAMPLE_URL = "/stickers/demo/leiden-hop.gif";

export function KitchenBench({
  kitchen,
  saving,
  onSave,
}: {
  kitchen: ReturnType<typeof useStickerKitchen>;
  saving: boolean;
  onSave: () => void;
}) {
  const { state, intakeFile, intakeUrl, convert, setTitle, toggleTag, reset } = kitchen;
  const busy = state.phase === "reading" || state.phase === "converting" || saving;

  return (
    <div className="flex flex-col gap-5">
      <SourceIntake
        busy={busy}
        onFile={intakeFile}
        onUrl={(url) => intakeUrl(url, url === SAMPLE_URL ? "蕾登蹦一下" : undefined)}
        sampleUrl={SAMPLE_URL}
      />
      {state.error && !state.source ? <p className="text-sm text-lab-error">{state.error}</p> : null}
      <PassportCard
        state={state}
        saving={saving}
        onTitle={setTitle}
        onToggleTag={toggleTag}
        onConvert={convert}
        onSave={onSave}
        onReset={reset}
      />
    </div>
  );
}
