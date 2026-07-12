import YAML from "yaml";
import type { Preset } from "../atoms/config";
import { presets } from "./presets";

export function configToYaml(
  preset: Preset,
  overrides: Record<string, string>,
): string {
  const config: Record<string, unknown> = {
    ...presets[preset],
  };

  if (Object.keys(overrides).length > 0) {
    config.rules = overrides;
  }

  return YAML.stringify(config);
}

export function yamlToConfig(
  yamlStr: string,
): { preset: Preset; overrides: Record<string, string> } | null {
  try {
    const parsed = YAML.parse(yamlStr);

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    let preset: Preset = "recommended";

    if (Array.isArray(parsed.extends) && parsed.extends.length > 0) {
      const ext = parsed.extends[0];
      if (
        ext === "minimal" ||
        ext === "recommended" ||
        ext === "recommended-strict"
      ) {
        preset = ext;
      }
    }

    const overrides: Record<string, string> = {};

    if (parsed.rules && typeof parsed.rules === "object") {
      for (const [key, value] of Object.entries(parsed.rules)) {
        if (typeof value === "string") {
          overrides[key] = value;
        }
      }
    }

    return { preset, overrides };
  } catch {
    return null;
  }
}
