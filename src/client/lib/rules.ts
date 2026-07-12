import type { Preset } from "../atoms/config";

export interface RuleDefinition {
  id: string;
  category: string;
  description: string;
}

export const ruleCategories = [
  "Structural",
  "Naming",
  "Documentation",
  "Security",
  "Best Practices",
] as const;

export type RuleCategory = (typeof ruleCategories)[number];

export const knownRules: RuleDefinition[] = [
  {
    id: "no-unresolved-refs",
    category: "Structural",
    description: "Ensures all $refs resolve",
  },
  {
    id: "no-enum-type-mismatch",
    category: "Structural",
    description: "Enum values match declared type",
  },
  {
    id: "spec",
    category: "Structural",
    description: "Validates against the OpenAPI spec",
  },
  {
    id: "no-unused-components",
    category: "Structural",
    description: "No unused component schemas",
  },

  {
    id: "operation-operationId",
    category: "Naming",
    description: "Operations must have operationId",
  },
  {
    id: "operation-operationId-unique",
    category: "Naming",
    description: "operationId must be unique",
  },
  {
    id: "path-not-include-query",
    category: "Naming",
    description: "Paths should not include query strings",
  },
  {
    id: "operation-operationId-url-safe",
    category: "Naming",
    description: "operationId must be URL-safe",
  },
  {
    id: "tag-description",
    category: "Naming",
    description: "Tags should have descriptions",
  },
  {
    id: "operation-singular-tag",
    category: "Naming",
    description: "Operations should have one tag",
  },

  {
    id: "operation-summary",
    category: "Documentation",
    description: "Operations should have summaries",
  },
  {
    id: "operation-description",
    category: "Documentation",
    description: "Operations should have descriptions",
  },
  {
    id: "info-contact",
    category: "Documentation",
    description: "Info should have contact",
  },
  {
    id: "info-license",
    category: "Documentation",
    description: "Info should have license",
  },
  {
    id: "info-license-url",
    category: "Documentation",
    description: "License should have URL",
  },

  {
    id: "security-defined",
    category: "Security",
    description: "Security schemes must be defined",
  },
  {
    id: "operation-4xx-response",
    category: "Security",
    description: "Operations should define 4xx responses",
  },

  {
    id: "no-ambiguous-paths",
    category: "Best Practices",
    description: "No ambiguous path templates",
  },
  {
    id: "no-identical-paths",
    category: "Best Practices",
    description: "No identical path templates",
  },
  {
    id: "no-path-trailing-slash",
    category: "Best Practices",
    description: "Paths should not end with slash",
  },
  {
    id: "path-segment-plural",
    category: "Best Practices",
    description: "Path segments should be plural",
  },
  {
    id: "no-http-verbs-in-paths",
    category: "Best Practices",
    description: "No HTTP verbs in paths",
  },
  {
    id: "path-declaration-must-exist",
    category: "Best Practices",
    description: "Path parameters must be declared",
  },
  {
    id: "paths-kebab-case",
    category: "Best Practices",
    description: "Paths should use kebab-case",
  },
];

export type Severity = "error" | "warn" | "off";

const presetDefaults: Record<Preset, Record<string, Severity>> = {
  minimal: {
    "no-unresolved-refs": "error",
    spec: "error",
    "no-enum-type-mismatch": "warn",
  },
  recommended: {
    "no-unresolved-refs": "error",
    "no-enum-type-mismatch": "error",
    spec: "error",
    "no-unused-components": "warn",
    "operation-operationId": "warn",
    "operation-operationId-unique": "error",
    "path-not-include-query": "warn",
    "operation-summary": "warn",
    "security-defined": "warn",
    "no-ambiguous-paths": "warn",
    "no-identical-paths": "error",
    "no-path-trailing-slash": "warn",
    "path-declaration-must-exist": "error",
  },
  "recommended-strict": {
    "no-unresolved-refs": "error",
    "no-enum-type-mismatch": "error",
    spec: "error",
    "no-unused-components": "error",
    "operation-operationId": "error",
    "operation-operationId-unique": "error",
    "path-not-include-query": "error",
    "operation-operationId-url-safe": "error",
    "tag-description": "warn",
    "operation-singular-tag": "warn",
    "operation-summary": "error",
    "operation-description": "warn",
    "info-contact": "warn",
    "info-license": "warn",
    "info-license-url": "warn",
    "security-defined": "error",
    "operation-4xx-response": "warn",
    "no-ambiguous-paths": "error",
    "no-identical-paths": "error",
    "no-path-trailing-slash": "error",
    "path-segment-plural": "warn",
    "no-http-verbs-in-paths": "error",
    "path-declaration-must-exist": "error",
    "paths-kebab-case": "warn",
  },
};

export function getDefaultSeverity(preset: Preset, ruleId: string): Severity {
  return presetDefaults[preset]?.[ruleId] ?? "off";
}

export function getRulesByCategory(category: string): RuleDefinition[] {
  return knownRules.filter((r) => r.category === category);
}

export const rulesByCategory = Object.fromEntries(
  ruleCategories.map((c) => [c, getRulesByCategory(c)]),
) as Record<RuleCategory, RuleDefinition[]>;
