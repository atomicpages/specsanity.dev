import YAML from "yaml";

/**
 * Prettify JSON text. Returns null if the input is not valid JSON.
 */
export function formatJson(text: string): string | null {
  try {
    const parsed = JSON.parse(text);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return null;
  }
}

/**
 * Prettify YAML text. Returns null if the input is not valid YAML.
 */
export function formatYaml(text: string): string | null {
  try {
    const parsed = YAML.parse(text);
    if (parsed == null) {
      return null;
    }
    return YAML.stringify(parsed, { indent: 2, lineWidth: 0 });
  } catch {
    return null;
  }
}
