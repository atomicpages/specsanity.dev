import { dequal } from "dequal";
import { atom } from "jotai";
import { configOverridesAtom, type Preset, presetAtom } from "./config";
import { specAtom } from "./spec";

export const shareIdAtom = atom<string | null>(null);
export const isOwnerAtom = atom(false);
export const isSharingAtom = atom(false);
export const isSavingAtom = atom(false);

export const canSaveAtom = atom(
  (get) => get(shareIdAtom) !== null && get(isOwnerAtom),
);

export interface SavedSnapshot {
  spec: string;
  preset: Preset;
  overrides: Record<string, string>;
}

export const savedSnapshotAtom = atom<SavedSnapshot | null>(null);

export const isDirtyAtom = atom((get) => {
  const snapshot = get(savedSnapshotAtom);
  if (!snapshot) {
    return false;
  }

  const spec = get(specAtom);
  const preset = get(presetAtom);
  const overrides = get(configOverridesAtom);

  return (
    spec !== snapshot.spec ||
    preset !== snapshot.preset ||
    !dequal(overrides, snapshot.overrides)
  );
});
