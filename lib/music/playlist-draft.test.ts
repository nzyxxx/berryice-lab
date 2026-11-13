import assert from "node:assert/strict";
import test from "node:test";

import {
  movePlaylistTrack,
  parsePlaylist,
  PLAYLIST_MAX_ITEMS,
  removePlaylistTrack,
  validatePlaylistDraft,
} from "./playlist-draft.ts";

test("a track needs a name, an artist, and one https link", () => {
  assert.equal(
    validatePlaylistDraft({ title: "  夜  ", artist: "某人", url: "https://music.example/a" }, 0).ok,
    true
  );
  const empty = validatePlaylistDraft({ title: "夜", artist: "", url: "https://music.example/a" }, 0);
  assert.equal(empty.ok, false);
  if (!empty.ok) assert.equal(empty.reason, "empty");
  const blocked = validatePlaylistDraft({ title: "夜", artist: "某人", url: "http://music.example/a" }, 0);
  assert.equal(blocked.ok, false);
  if (!blocked.ok) assert.equal(blocked.reason, "url");
});

test("corrupt storage and non-https rows collapse to an empty list", () => {
  assert.deepEqual(parsePlaylist("not-json"), []);
  assert.deepEqual(
    parsePlaylist(JSON.stringify([{ id: "1", title: "夜", artist: "某人", url: "javascript:alert(1)" }])),
    []
  );
  const kept = parsePlaylist(
    JSON.stringify([{ id: "1", title: "夜", artist: "某人", url: "https://music.example/a" }])
  );
  assert.equal(kept.length, 1);
  assert.equal(kept[0]?.url, "https://music.example/a");
});

test("move and remove stay inside the list, and the cap is finite", () => {
  const tracks = [
    { id: "a", title: "一", artist: "甲", url: "https://music.example/a" },
    { id: "b", title: "二", artist: "乙", url: "https://music.example/b" },
  ];
  assert.deepEqual(movePlaylistTrack(tracks, "b", -1).map((track) => track.id), ["b", "a"]);
  assert.equal(movePlaylistTrack(tracks, "a", -1), tracks);
  assert.deepEqual(removePlaylistTrack(tracks, "a").map((track) => track.id), ["b"]);
  assert.equal(PLAYLIST_MAX_ITEMS, 24);
  const full = validatePlaylistDraft(
    { title: "满", artist: "甲", url: "https://music.example/z" },
    PLAYLIST_MAX_ITEMS
  );
  assert.equal(full.ok, false);
});
