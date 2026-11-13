"use client";

import { PlaylistBoard } from "@/components/music/playlist-board";
import {
  movePlaylistTrack,
  parsePlaylist,
  PLAYLIST_STORAGE_KEY,
  removePlaylistTrack,
  validatePlaylistDraft,
  type PlaylistDraft as Draft,
  type PlaylistRejection,
  type PlaylistTrack,
} from "@/lib/music/playlist-draft";
import { useEffect, useRef, useState } from "react";

const REASONS: Record<PlaylistRejection, string> = {
  empty: "曲名、歌手和链接都要有。",
  long: "有一项太长了。",
  url: "只接受以 https:// 开头的官方链接。",
  full: "最多 24 条。先删掉再加。",
};

export function PlaylistDraft() {
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const lock = useRef(false);

  useEffect(() => {
    try {
      setTracks(parsePlaylist(localStorage.getItem(PLAYLIST_STORAGE_KEY)));
    } catch {
      setTracks([]);
    }
  }, []);

  const persist = (next: readonly PlaylistTrack[]) => {
    setTracks([...next]);
    try {
      localStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(next));
    } catch {
      setMessage("这台浏览器没有把列表写进去。刷新后可能消失。");
    }
  };

  const run = (work: () => void) => {
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    try {
      work();
    } finally {
      lock.current = false;
      setPending(false);
    }
  };

  return (
    <PlaylistBoard
      tracks={tracks}
      pending={pending}
      message={message}
      onAdd={(draft: Draft) => {
        let added = false;
        run(() => {
          const check = validatePlaylistDraft(draft, tracks.length);
          if (!check.ok) {
            setMessage(REASONS[check.reason]);
            return;
          }
          const id =
            typeof crypto.randomUUID === "function"
              ? crypto.randomUUID()
              : `track-${Date.now()}`;
          persist([...tracks, { id, ...check.track }]);
          setMessage("已记在这台浏览器。");
          added = true;
        });
        return added;
      }}
      onRemove={(id) => {
        run(() => {
          persist(removePlaylistTrack(tracks, id));
          setMessage("已从这台浏览器删掉。");
        });
      }}
      onMove={(id, direction) => {
        run(() => {
          persist(movePlaylistTrack(tracks, id, direction));
        });
      }}
    />
  );
}
