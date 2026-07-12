import {
  createConfig,
  getLineColLocation,
  lintFromString,
} from "@redocly/openapi-core";

export interface Problem {
  severity: "error" | "warn";
  message: string;
  ruleId: string;
  line: number;
  col: number;
  endLine?: number;
  endCol?: number;
  suggest?: string[];
}

export async function validateSpec(
  spec: string,
  rawConfig: object,
): Promise<Problem[]> {
  const config = await createConfig(rawConfig);
  const results = await lintFromString({ source: spec, config });

  return results.map((problem) => {
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
}
