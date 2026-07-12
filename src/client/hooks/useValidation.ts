import { useAtomValue, useSetAtom } from "jotai";
import { useAtomCallback } from "jotai/utils";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { api } from "../api/client";
import { configOverridesAtom, presetAtom } from "../atoms/config";
import { formatCompleteAtom } from "../atoms/editor";
import { specAtom } from "../atoms/spec";
import {
  hasValidatedAtom,
  isValidatingAtom,
  validationResultsAtom,
} from "../atoms/validation";
import { presets } from "../lib/presets";

export function useValidation() {
  const setIsValidating = useSetAtom(isValidatingAtom);
  const setValidationResults = useSetAtom(validationResultsAtom);
  const setHasValidated = useSetAtom(hasValidatedAtom);
  const isValidating = useAtomValue(isValidatingAtom);
  const hasValidated = useAtomValue(hasValidatedAtom);
  const formatComplete = useAtomValue(formatCompleteAtom);

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
          const { data, error } = await api.api.validate.post({
            spec,
            config,
          });

          if (error || !data || data instanceof Response) {
            toast.error("Validation failed", {
              description: error ? String(error) : "Unknown error",
            });
            return;
          }

          setValidationResults(data.problems);
          setHasValidated(true);
        } catch {
          toast.error("Validation failed");
        } finally {
          setIsValidating(false);
        }
      },
      [setIsValidating, setValidationResults, setHasValidated],
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
