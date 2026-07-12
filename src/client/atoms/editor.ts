import { atom } from "jotai";

export const goToLineAtom = atom<{ line: number; col: number } | null>(null);

/** Increment to trigger a format action in the editor. */
export const formatTriggerAtom = atom(0);

/** Incremented after a format action completes, so dependents can re-validate. */
export const formatCompleteAtom = atom(0);
