import { atom } from "jotai";

export type Preset = "minimal" | "recommended" | "recommended-strict";

export const presetAtom = atom<Preset>("recommended");
export const configOverridesAtom = atom<Record<string, string>>({});
export const rawConfigAtom = atom<string>("");
