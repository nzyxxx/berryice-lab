import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Attachment } from "@/lib/types/gun";

interface Loadout {
  id: string;
  name: string;
  gunName: string;
  attachments: Attachment[];
  createdAt: string;
}

interface GunStore {
  selectedAttachments: Attachment[];
  savedLoadouts: Loadout[];

  addAttachment: (attachment: Attachment) => void;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;

  saveLoadout: (name: string, gunName: string) => void;
  deleteLoadout: (id: string) => void;
}

export const useGunStore = create<GunStore>()(
  persist(
    (set) => ({
      selectedAttachments: [],
      savedLoadouts: [],

      addAttachment: (attachment) =>
        set((state) => ({
          selectedAttachments: [...state.selectedAttachments, attachment],
        })),

      removeAttachment: (id) =>
        set((state) => ({
          selectedAttachments: state.selectedAttachments.filter((a) => a.id !== id),
        })),

      clearAttachments: () => set({ selectedAttachments: [] }),

      saveLoadout: (name, gunName) =>
        set((state) => ({
          savedLoadouts: [
            ...state.savedLoadouts,
            {
              id: Date.now().toString(),
              name,
              gunName,
              attachments: [...state.selectedAttachments],
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      deleteLoadout: (id) =>
        set((state) => ({
          savedLoadouts: state.savedLoadouts.filter((l) => l.id !== id),
        })),
    }),
    { name: "berryice-delta-gun-store" }
  )
);