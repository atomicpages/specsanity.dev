import { useAtomValue, useSetAtom } from "jotai";
import { useAtomCallback } from "jotai/utils";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { configOverridesAtom, presetAtom } from "../atoms/config";
import { formatCompleteAtom } from "../atoms/editor";
import { specAtom } from "../atoms/spec";
import {
  hasValidatedAtom,
  isValidatingAtom,
  validationResultsAtom,
} from "../atoms/validation";
import { presets } from "../lib/presets";
import type { ValidateResponse } from "../workers/validate.worker";

declare global {
  interface Window {
    __VALIDATE_WORKER_URL__?: string;
  }
}

function getWorkerUrl(): string {
  return window.__VALIDATE_WORKER_URL__ ?? "/validate.worker.js";
}

export function useValidation() {
  const setIsValidating = useSetAtom(isValidatingAtom);
  const setValidationResults = useSetAtom(validationResultsAtom);
  const setHasValidated = useSetAtom(hasValidatedAtom);
  const isValidating = useAtomValue(isValidatingAtom);
  const hasValidated = useAtomValue(hasValidatedAtom);
  const formatComplete = useAtomValue(formatCompleteAtom);
  const workerRef = useRef<Worker | null>(null);

  const getWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(getWorkerUrl(), { type: "module" });
    }
    return workerRef.current;
  }, []);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const validate = useAtomCallback(
    useCallback(
      async (get) => {
        const spec = get(specAtom);
        if (!spec) {
          return;
        }

        const preset = get(presetAtom);
        const overrides = get(configOverridesAtom);

        setIsValidating(true);
        try {
          const config = { ...presets[preset], rules: overrides };
          const worker = getWorker();

          const result = await new Promise<ValidateResponse>(
            (resolve, reject) => {
              worker.onmessage = (e: MessageEvent<ValidateResponse>) => {
                resolve(e.data);
              };

              worker.onerror = (e) => {
                reject(new Error(e.message));
              };

              worker.postMessage({ spec, config });
            },
          );

          if ("error" in result) {
            toast.error("Validation failed", { description: result.error });
            return;
          }

          setValidationResults(result.problems);
          setHasValidated(true);
        } catch {
          toast.error("Validation failed");
        } finally {
          setIsValidating(false);
        }
      },
      [setIsValidating, setValidationResults, setHasValidated, getWorker],
    ),
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: only react to format completion; including hasValidated/validate would loop
  useEffect(() => {
    if (formatComplete > 0 && hasValidated) {
      validate();
    }
  }, [formatComplete]);

  return { validate, isValidating };
}
