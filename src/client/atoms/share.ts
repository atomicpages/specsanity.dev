import { atom } from "jotai";

export const shareIdAtom = atom<string | null>(null);
export const isOwnerAtom = atom(false);
export const isSharingAtom = atom(false);
export const isSavingAtom = atom(false);

export const canSaveAtom = atom(
  (get) => get(shareIdAtom) !== null && get(isOwnerAtom),
);
