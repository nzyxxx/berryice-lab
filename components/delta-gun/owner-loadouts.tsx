"use client";

import { CodeMetaRow } from "@/components/delta-gun/code-meta-row";
import { GAME_MODES, type GameMode } from "@/lib/delta-gun/game-modes";
import { CURRENT_SEASON, FOCUS_TAGS, isStaleCode } from "@/lib/delta-gun/season";
import type { OwnerLoadout } from "@/lib/types/ownerLoadout";
import { Check, Copy, Pencil, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export interface WeaponOption {
  id: string;
  name: string;
}

const fieldClass =
  "h-11 w-full rounded-md border border-lab-hairline bg-lab-canvas px-3 text-sm text-lab-ink outline-none focus:border-lab-primary/50";

function emptyForm(weaponId: string): {
  title: string;
  weaponId: string;
  game: GameMode;
  code: string;
  notes: string;
  tags: string;
  focusTags: string[];
  recommendation: number;
  rankPosition: string;
  season: string;
  postedAt: string;
} {
  return {
    title: "",
    weaponId,
    game: "烽火",
    code: "",
    notes: "",
    tags: "",
    focusTags: ["稳定"],
    recommendation: 3,
    rankPosition: "",
    season: CURRENT_SEASON,
    postedAt: new Date().toISOString().slice(0, 10),
  };
}

export function OwnerLoadouts({ weapons }: { weapons: WeaponOption[] }) {
  const [items, setItems] = useState<OwnerLoadout[]>([]);
  const [admin, setAdmin] = useState(false);
  const [mode, setMode] = useState<GameMode | "all">("all");
  const [weaponFilter, setWeaponFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(() => emptyForm(weapons[0]?.id ?? ""));
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const load = async () => {
    const [listRes, sessionRes] = await Promise.all([
      fetch("/api/owner-loadouts", { cache: "no-store" }),
      fetch("/api/admin/session", { cache: "no-store" }),
    ]);
    const list = await listRes.json();
    const session = await sessionRes.json();
    if (!list.ok) throw new Error(list.message ?? "读取失败");
    setItems(list.data ?? []);
    setAdmin(Boolean(session.ok));
  };

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "读取失败");
    });
  }, []);

  const [showStale, setShowStale] = useState(false);
  const visible = useMemo(() => {
    return items.filter((item) => {
      if (mode !== "all" && item.game !== mode) return false;
      if (weaponFilter !== "all" && item.weaponId !== weaponFilter) return false;
      if (!showStale && isStaleCode(item)) return false;
      return true;
    });
  }, [items, mode, weaponFilter, showStale]);

  const unlock = async () => {
    setError("");
    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    setToken("");
    const json = await response.json();
    if (!response.ok || !json.ok) {
      setError(json.message ?? "口令不对");
      return;
    }
    setAdmin(true);
    setMessage("已打开录入");
  };

  const lock = async () => {
    await fetch("/api/admin/session", { method: "DELETE" });
    setAdmin(false);
    setEditingId(null);
  };

  const save = async () => {
    setError("");
    const payload = {
      title: form.title,
      weaponId: form.weaponId,
      game: form.game,
      code: form.code,
      notes: form.notes,
      tags: form.tags,
      focusTags: form.focusTags,
      recommendation: form.recommendation,
      rankPosition: form.rankPosition,
      season: form.season,
      postedAt: form.postedAt,
    };
    const response = await fetch(editingId ? `/api/owner-loadouts/${editingId}` : "/api/owner-loadouts", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await response.json();
    if (!response.ok || !json.ok) {
      setError(json.message ?? "保存失败");
      return;
    }
    setForm(emptyForm(weapons[0]?.id ?? ""));
    setEditingId(null);
    setMessage(editingId ? "已更新" : "已保存");
    await load();
  };

  const remove = async (id: number) => {
    const response = await fetch(`/api/owner-loadouts/${id}`, { method: "DELETE" });
    const json = await response.json();
    if (!response.ok || !json.ok) {
      setError(json.message ?? "删除失败");
      return;
    }
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const copy = async (item: OwnerLoadout) => {
    await navigator.clipboard.writeText(item.code);
    setCopiedId(item.id);
    window.setTimeout(() => setCopiedId(null), 1600);
  };

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] tracking-[0.22em] text-lab-ink-subtle">LOADOUTS</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-lab-ink">我的枪码</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-lab-ink-subtle">
            站长收藏的改枪码。谁都可以看和复制，只有站长能增删改。
          </p>
        </div>
        {admin ? (
          <button type="button" onClick={() => void lock()} className="inline-flex min-h-11 items-center text-sm text-lab-ink-subtle">
            退出录入
          </button>
        ) : (
          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void unlock();
            }}
          >
            <label className="sr-only" htmlFor="admin-token">管理口令</label>
            <input
              id="admin-token"
              type="password"
              autoComplete="current-password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="管理口令"
              className="h-11 w-40 rounded-md border border-lab-hairline bg-lab-canvas px-3 text-sm"
            />
            <button type="submit" className="inline-flex min-h-11 items-center rounded-md bg-lab-ink px-4 text-sm text-lab-canvas">
              录入
            </button>
          </form>
        )}
      </header>

      {message ? <p className="mt-4 text-sm text-lab-success">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-lab-error">{error}</p> : null}

      {admin ? (
        <form
          className="mt-8 grid gap-3 rounded-3xl border border-lab-hairline bg-lab-surface-1/80 p-5 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <input className={fieldClass} placeholder="标题" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          <select className={fieldClass} value={form.weaponId} onChange={(event) => setForm({ ...form, weaponId: event.target.value })}>
            {weapons.map((weapon) => (
              <option key={weapon.id} value={weapon.id}>{weapon.name}</option>
            ))}
          </select>
          <select className={fieldClass} value={form.game} onChange={(event) => setForm({ ...form, game: event.target.value as GameMode })}>
            {GAME_MODES.map((game) => (
              <option key={game} value={game}>{game}</option>
            ))}
          </select>
          <input className={fieldClass} placeholder="标签，用逗号分开" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} />
          <fieldset className="md:col-span-2">
            <legend className="mb-2 text-xs text-lab-ink-subtle">方向</legend>
            <div className="flex flex-wrap gap-2">
              {FOCUS_TAGS.map((tag) => {
                const on = form.focusTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        focusTags: on ? form.focusTags.filter((item) => item !== tag) : [...form.focusTags, tag],
                      })
                    }
                    className={`inline-flex min-h-11 items-center rounded-full border px-3 text-sm ${on ? "border-lab-primary/40 bg-lab-primary/15" : "border-lab-hairline"}`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <label className="text-xs text-lab-ink-subtle">
            推荐 1–5
            <input className={fieldClass} type="number" min={1} max={5} value={form.recommendation} onChange={(event) => setForm({ ...form, recommendation: Number(event.target.value) })} />
          </label>
          <label className="text-xs text-lab-ink-subtle">
            版本排行，可空
            <input className={fieldClass} inputMode="numeric" value={form.rankPosition} onChange={(event) => setForm({ ...form, rankPosition: event.target.value })} />
          </label>
          <label className="text-xs text-lab-ink-subtle">
            赛季
            <input className={fieldClass} value={form.season} onChange={(event) => setForm({ ...form, season: event.target.value })} />
          </label>
          <label className="text-xs text-lab-ink-subtle">
            发布日期
            <input className={fieldClass} type="date" value={form.postedAt} onChange={(event) => setForm({ ...form, postedAt: event.target.value })} />
          </label>
          <textarea className={`${fieldClass} h-24 md:col-span-2`} placeholder="枪码" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} required />
          <textarea className={`${fieldClass} h-20 md:col-span-2`} placeholder="备注" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          <div className="flex gap-3 md:col-span-2">
            <button type="submit" className="inline-flex min-h-11 items-center rounded-md bg-lab-primary px-5 text-sm text-lab-canvas">
              {editingId ? "更新" : "保存"}
            </button>
            {editingId ? (
              <button type="button" className="inline-flex min-h-11 items-center px-3 text-sm text-lab-ink-subtle" onClick={() => { setEditingId(null); setForm(emptyForm(weapons[0]?.id ?? "")); }}>
                取消编辑
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {(["all", ...GAME_MODES] as const).map((game) => (
          <button
            key={game}
            type="button"
            onClick={() => setMode(game)}
            className={`inline-flex min-h-11 items-center rounded-md border px-3 text-sm ${mode === game ? "border-lab-primary/40 bg-lab-primary/15 text-lab-ink" : "border-lab-hairline text-lab-ink-subtle"}`}
          >
            {game === "all" ? "全部模式" : game}
          </button>
        ))}
        <button type="button" onClick={() => setShowStale((value) => !value)} className="inline-flex min-h-11 items-center text-sm text-lab-ink-subtle">
          {showStale ? "隐藏过季" : "显示过季"}
        </button>
        <select value={weaponFilter} onChange={(event) => setWeaponFilter(event.target.value)} className="h-11 rounded-md border border-lab-hairline bg-lab-canvas px-3 text-sm">
          <option value="all">全部武器</option>
          {weapons.map((weapon) => (
            <option key={weapon.id} value={weapon.id}>{weapon.name}</option>
          ))}
        </select>
      </div>

      {visible.length === 0 ? (
        <p className="mt-10 text-sm text-lab-ink-subtle">还没有枪码。</p>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {visible.map((item) => (
            <li key={item.id} className="rounded-3xl border border-lab-hairline bg-lab-surface-1/80 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-medium tracking-tight text-lab-ink">{item.title}</h2>
                  <p className="mt-1 text-sm text-lab-ink-subtle">{item.weaponName} · {item.game}</p>
                </div>
                <button type="button" onClick={() => void copy(item)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-lab-hairline" aria-label="复制枪码">
                  {copiedId === item.id ? <Check className="size-4" /> : <Copy className="size-4" />}
                </button>
              </div>
              <p className="mt-4 break-all font-mono text-xs leading-relaxed text-lab-ink">{item.code}</p>
              <CodeMetaRow
                focusTags={item.focusTags}
                recommendation={item.recommendation}
                rank={item.rankPosition}
                mode={item.game}
                season={item.season}
                postedAt={item.postedAt}
                stale={isStaleCode(item)}
                code={item.code}
              />
              {item.notes ? <p className="mt-3 text-sm leading-relaxed text-lab-ink-subtle">{item.notes}</p> : null}
              {item.tags.length > 0 ? (
                <p className="mt-3 text-xs tracking-wide text-lab-ink-tertiary">{item.tags.join(" / ")}</p>
              ) : null}
              {admin ? (
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center gap-1 text-sm"
                    onClick={() => {
                      setEditingId(item.id);
                      setForm({
                        title: item.title,
                        weaponId: item.weaponId,
                        game: item.game === "大战场" ? "大战场" : "烽火",
                        code: item.code,
                        notes: item.notes,
                        tags: item.tags.join(", "),
                        focusTags: item.focusTags,
                        recommendation: item.recommendation,
                        rankPosition: item.rankPosition ? String(item.rankPosition) : "",
                        season: item.season,
                        postedAt: item.postedAt.slice(0, 10),
                      });
                    }}
                  >
                    <Pencil className="size-4" /> 编辑
                  </button>
                  <button type="button" className="inline-flex min-h-11 items-center gap-1 text-sm text-lab-error" onClick={() => void remove(item.id)}>
                    <Trash2 className="size-4" /> 删除
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
