import { atom } from "jotai";

export interface ValidationProblem {
  severity: "error" | "warn";
  message: string;
  ruleId: string;
  line: number;
  col: number;
  endLine?: number;
  endCol?: number;
  suggest?: string[];
}

export const validationResultsAtom = atom<ValidationProblem[]>([]);
export const isValidatingAtom = atom(false);
export const hasValidatedAtom = atom(false);
