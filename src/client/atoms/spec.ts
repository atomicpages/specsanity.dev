import { atom } from "jotai";

export type InputMode = "url" | "paste" | "upload";

export const specAtom = atom<string | null>(null);
export const hasSpecAtom = atom((get) => get(specAtom) !== null);
export const specNameAtom = atom<string | null>(null);
export const inputModeAtom = atom<InputMode>("url");
