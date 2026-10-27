export function DeltaStatRow({
  weapons,
  codes,
  streamers,
  season,
}: {
  weapons: number;
  codes: number;
  streamers: number;
  season: string;
}) {
  const items = [
    { label: "武器", value: String(weapons) },
    { label: "枪码", value: String(codes) },
    { label: "主播", value: String(streamers) },
    { label: "赛季", value: season },
  ];
  return (
    <ul className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <li
          key={item.label}
          className="rounded-3xl border border-white/10 bg-white/[0.06] px-5 py-5 backdrop-blur-lg"
        >
          <p className="text-3xl font-semibold tracking-[-0.04em] text-lab-ink">{item.value}</p>
          <p className="mt-1 text-sm text-lab-ink-subtle">{item.label}</p>
        </li>
      ))}
    </ul>
  );
}
