import {
  createConfig,
  getLineColLocation,
  lintFromString,
} from "@redocly/openapi-core";

import type { ValidationProblem } from "../atoms/validation";

export type ValidateRequest = {
  spec: string;
  config: object;
};

export type ValidateResponse =
  | { problems: ValidationProblem[] }
  | { error: string };

self.onmessage = async (e: MessageEvent<ValidateRequest>) => {
  const { spec, config: rawConfig } = e.data;

  try {
    const config = await createConfig(rawConfig);
    const results = await lintFromString({ source: spec, config });

    const problems: ValidationProblem[] = results.map((problem) => {
      const loc = getLineColLocation(problem.location[0]);

      return {
        severity: problem.severity === "error" ? "error" : "warn",
        message: problem.message,
        ruleId: problem.ruleId,
        line: loc?.start?.line ?? 1,
        col: loc?.start?.col ?? 1,
        endLine: loc?.end?.line,
        endCol: loc?.end?.col,
        suggest: problem.suggest,
      };
    });

    self.postMessage({ problems } satisfies ValidateResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to parse spec";

    self.postMessage({ error: message } satisfies ValidateResponse);
  }
};
