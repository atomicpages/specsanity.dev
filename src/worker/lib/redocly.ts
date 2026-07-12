import {
  createConfig,
  getLineColLocation,
  lintFromString,
} from "@redocly/openapi-core";

import { type Static, t } from "elysia";

export const Problem = t.Object({
  severity: t.UnionEnum(["error", "warn"]),
  message: t.String(),
  ruleId: t.String(),
  line: t.Number(),
  col: t.Number(),
  endLine: t.Optional(t.Number()),
  endCol: t.Optional(t.Number()),
  suggest: t.Array(t.String()),
});

export type TProblem = Static<typeof Problem>;

export async function validateSpec(
  spec: string,
  rawConfig: object,
): Promise<TProblem[]> {
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
    } satisfies TProblem;
  });
}
