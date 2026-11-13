export const PLAYLIST_STORAGE_KEY = "berryice-playlist-draft-v1";
export const PLAYLIST_MAX_ITEMS = 24;
const TEXT_MAX = 40;
const URL_MAX = 300;

export type PlaylistTrack = {
  id: string;
  title: string;
  artist: string;
  url: string;
};

export type PlaylistDraft = {
  title: string;
  artist: string;
  url: string;
};

export type PlaylistRejection = "empty" | "long" | "url" | "full";

const HTTPS_URL = /^https:\/\/[^\s]+$/i;

export function normalizePlaylistField(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function validatePlaylistDraft(
  draft: PlaylistDraft,
  count: number
): { ok: true; track: Omit<PlaylistTrack, "id"> } | { ok: false; reason: PlaylistRejection } {
  if (count >= PLAYLIST_MAX_ITEMS) return { ok: false, reason: "full" };
  const title = normalizePlaylistField(draft.title);
  const artist = normalizePlaylistField(draft.artist);
  const url = draft.url.trim();
  if (!title || !artist || !url) return { ok: false, reason: "empty" };
  if (title.length > TEXT_MAX || artist.length > TEXT_MAX || url.length > URL_MAX) {
    return { ok: false, reason: "long" };
  }
  if (!HTTPS_URL.test(url) || url.startsWith("https://https://")) {
    return { ok: false, reason: "url" };
  }
  return { ok: true, track: { title, artist, url } };
}

export function parsePlaylist(raw: string | null): PlaylistTrack[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const tracks: PlaylistTrack[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const record = item as Record<string, unknown>;
      if (
        typeof record.id !== "string" ||
        typeof record.title !== "string" ||
        typeof record.artist !== "string" ||
        typeof record.url !== "string"
      ) {
        continue;
      }
      const check = validatePlaylistDraft(
        { title: record.title, artist: record.artist, url: record.url },
        tracks.length
      );
      if (!check.ok) continue;
      tracks.push({ id: record.id.slice(0, 80), ...check.track });
      if (tracks.length >= PLAYLIST_MAX_ITEMS) break;
    }
    return tracks;
  } catch {
    return [];
  }
}

export function movePlaylistTrack(tracks: readonly PlaylistTrack[], id: string, direction: -1 | 1) {
  const index = tracks.findIndex((track) => track.id === id);
  const next = index + direction;
  if (index < 0 || next < 0 || next >= tracks.length) return tracks;
  const copy = tracks.slice();
  const [item] = copy.splice(index, 1);
  copy.splice(next, 0, item);
  return copy;
}

export function removePlaylistTrack(tracks: readonly PlaylistTrack[], id: string) {
  return tracks.filter((track) => track.id !== id);
}
