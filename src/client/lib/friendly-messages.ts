import { knownRules } from "./rules";

type Rewriter = (message: string) => string | null;

// --- Hoisted regexes (avoid re-creation per call) ---

const RE_CANT_RESOLVE_REF = /^Can't resolve \$ref: (.+)$/;
const RE_FAILED_TO_PARSE = /^Failed to parse: (.+)$/;

const RE_PROPERTY_NOT_EXPECTED = /^Property `(.+?)` is not expected here\.$/;
const RE_FIELD_NOT_ALLOWED = /^The field `(.+?)` is not allowed here\.$/;
const RE_FIELD_MUST_BE_PRESENT =
  /^The field `(.+?)` must be present on this level\.$/;
const RE_MUST_CONTAIN_ONE_OF =
  /^Must contain at least one of the following fields: (.+)\.$/;
const RE_TYPE_MISMATCH = /^Expected type `(.+?)` but got `(.+?)`\.$/;
const RE_TYPE_MISMATCH_OBJECT =
  /^Expected type `(.+?)` \(object\) but got `(.+?)`$/;
const RE_TYPE_MISMATCH_ARRAY =
  /^Expected type `(.+?)` \(array\) but got `(.+?)`$/;
const RE_VALUE_MIN =
  /^The value of the (.+?) field must be greater than or equal to (.+)$/;
const RE_OBJECT_SHOULD_CONTAIN =
  /^(.+?) object should contain `(.+?)` field\.$/;
const RE_OBJECT_NON_EMPTY = /^(.+?) object `(.+?)` must be non-empty string\.$/;
const RE_ONE_OF_ONLY = /^`(.+?)` can be one of the following only: (.+)\.$/;
const RE_NOT_VALID_VALUE = /^`(.+?)` "(.+?)" is not a valid value\.(.*)$/;

const RE_ENUM_EXPECTED_RECEIVED = /expected "(.+?)" but received "(.+?)"/;
const RE_ENUM_VALUE_ALLOWED =
  /^Enum value `(.+?)` must be of allowed types: `(.+?)`\.$/;

const RE_SECURITY_SCHEME = /^There is no `(.+?)` security scheme defined\.$/;

const RE_TRAILING_SLASH = /^`(.+?)` should not have a trailing slash\.$/;
const RE_KEBAB_CASE = /^`(.+?)` does not use kebab-case\.$/;
const RE_HTTP_VERB_IN_PATH = /^path `(.+?)` should not contain http verb (.+)$/;
const RE_SEGMENT_PLURAL = /^path segment `(.+?)` should be plural\.$/;
const RE_PATH_PARAM_UNDEFINED =
  /does not define the path parameter `\{(.+?)\}` expected by path `(.+?)`/;
const RE_AMBIGUOUS_PATHS = /Found two ambiguous paths: `(.+?)` and `(.+?)`/;
const RE_IDENTICAL_PATHS =
  /differs only by path parameter name\(s\): `(.+?)` and `(.+?)`/;
const RE_PARAMS_UNIQUE = /`in:(.+?)` \+ `name:(.+?)`/;

const RE_DUPLICATE_TAG = /Duplicate tag name found: '(.+?)'/;
const RE_UNUSED_COMPONENT = /^Component: "(.+?)" is never used\.$/;
const RE_UNUSED_SECURITY = /^Security scheme: "(.+?)" is never used\.$/;
const RE_SERVER_VAR_NOT_DEFINED = /`(.+?)` variable is not defined/;
const RE_SERVER_VAR_NOT_USED = /`(.+?)` variable is not used/;
const RE_REQUIRED_PROP_UNDEFINED = /Required property '(.+?)' is not defined/;

// --- Rewriters by ruleId ---

const rewriters: Record<string, Rewriter[]> = {
  "no-unresolved-refs": [
    (m) => {
      const match = m.match(RE_CANT_RESOLVE_REF);

      if (!match) {
        return null;
      }

      const ref = match[1];
      const name = ref.split("/").pop() ?? ref;

      return `Reference to '${name}' not found. Check for typos or missing definitions.`;
    },

    (m) => {
      if (m === "Can't resolve $ref") {
        return "Broken reference ($ref). The target doesn't exist.";
      }

      return null;
    },

    (m) => {
      const match = m.match(RE_FAILED_TO_PARSE);

      if (!match) {
        return null;
      }

      return `Could not parse this file: ${match[1]}`;
    },
  ],

  "spec-strict-refs": [
    (m) => {
      if (m === "Field $ref is not expected here.") {
        return "$ref is not allowed at this location.";
      }

      return null;
    },
  ],

  spec: [
    (m) => {
      const match = m.match(RE_PROPERTY_NOT_EXPECTED);

      if (!match) {
        return null;
      }

      return `'${match[1]}' is not a valid OpenAPI field at this location.`;
    },

    (m) => {
      const match = m.match(RE_FIELD_NOT_ALLOWED);

      if (!match) {
        return null;
      }

      return `'${match[1]}' is not allowed here.`;
    },

    (m) => {
      const match = m.match(RE_FIELD_MUST_BE_PRESENT);

      if (!match) {
        return null;
      }

      return `Missing required field '${match[1]}'.`;
    },

    (m) => {
      const match = m.match(RE_MUST_CONTAIN_ONE_OF);

      if (!match) {
        return null;
      }

      return `At least one of these fields is required: ${match[1]}.`;
    },

    (m) => {
      const match = m.match(RE_TYPE_MISMATCH);

      if (!match) {
        return null;
      }

      return `Wrong type: expected ${match[1]}, got ${match[2]}.`;
    },

    (m) => {
      const match = m.match(RE_TYPE_MISMATCH_OBJECT);

      if (!match) {
        return null;
      }

      return `Expected an object here, got ${match[2]}.`;
    },

    (m) => {
      const match = m.match(RE_TYPE_MISMATCH_ARRAY);

      if (!match) {
        return null;
      }

      return `Expected an array here, got ${match[2]}.`;
    },

    (m) => {
      const match = m.match(RE_VALUE_MIN);

      if (!match) {
        return null;
      }

      return `'${match[1]}' must be at least ${match[2]}.`;
    },

    (m) => {
      const match = m.match(RE_OBJECT_SHOULD_CONTAIN);

      if (!match) {
        return null;
      }

      return `Missing required field '${match[2]}' in ${match[1]}.`;
    },

    (m) => {
      const match = m.match(RE_OBJECT_NON_EMPTY);

      if (!match) {
        return null;
      }

      return `'${match[2]}' cannot be empty.`;
    },

    (m) => {
      const match = m.match(RE_ONE_OF_ONLY);

      if (!match) {
        return null;
      }

      return `Invalid value for '${match[1]}'. Allowed: ${match[2]}.`;
    },

    (m) => {
      const match = m.match(RE_NOT_VALID_VALUE);

      if (!match) {
        return null;
      }

      return `'${match[2]}' is not a valid value for '${match[1]}'.`;
    },
  ],

  "no-enum-type-mismatch": [
    (m) => {
      const match = m.match(RE_ENUM_EXPECTED_RECEIVED);

      if (!match) {
        return null;
      }

      return `Enum value has wrong type: expected ${match[1]}, got ${match[2]}.`;
    },

    (m) => {
      const match = m.match(RE_ENUM_VALUE_ALLOWED);

      if (!match) {
        return null;
      }

      return `Enum value '${match[1]}' doesn't match the declared type '${match[2]}'.`;
    },
  ],

  "no-schema-type-mismatch": [
    (m) => {
      if (m.includes("'object' type should not contain 'items' field")) {
        return "Objects don't use 'items' — that's for arrays.";
      }

      if (m.includes("'array' type should not contain 'properties' field")) {
        return "Arrays don't use 'properties' — that's for objects.";
      }

      return null;
    },
  ],

  "security-defined": [
    (m) => {
      if (m.startsWith("Every operation should have security")) {
        return "No authentication defined for this endpoint. Add a security requirement here or at the root level.";
      }

      const match = m.match(RE_SECURITY_SCHEME);

      if (match) {
        return `Security scheme '${match[1]}' is referenced but never defined in components/securitySchemes.`;
      }

      return null;
    },
  ],

  "operation-operationId-unique": [
    () => "Duplicate operationId. Each endpoint needs a unique identifier.",
  ],

  "operation-operationId-url-safe": [
    () => "operationId contains characters that aren't safe in URLs.",
  ],

  "operation-singular-tag": [() => "Use only one tag per operation."],

  "operation-tag-defined": [
    (m) => {
      if (m.includes("in global tags")) {
        return "This tag isn't listed in the top-level 'tags' array.";
      }

      return "Add a 'tags' array to the root of your spec.";
    },
  ],

  "no-path-trailing-slash": [
    (m) => {
      const match = m.match(RE_TRAILING_SLASH);

      if (!match) {
        return null;
      }

      return `Remove the trailing '/' from '${match[1]}'.`;
    },
  ],

  "paths-kebab-case": [
    (m) => {
      const match = m.match(RE_KEBAB_CASE);

      if (!match) {
        return null;
      }

      return `'${match[1]}' should use kebab-case (lowercase words separated by hyphens).`;
    },
  ],

  "no-http-verbs-in-paths": [
    (m) => {
      const match = m.match(RE_HTTP_VERB_IN_PATH);

      if (!match) {
        return null;
      }

      return `Don't include '${match[2]}' in the path — the HTTP method already conveys this.`;
    },
  ],

  "path-segment-plural": [
    (m) => {
      const match = m.match(RE_SEGMENT_PLURAL);

      if (!match) {
        return null;
      }

      return `Use the plural form of '${match[1]}'.`;
    },
  ],

  "path-not-include-query": [
    () =>
      "Query parameters belong in the 'parameters' section, not the URL path.",
  ],

  "path-declaration-must-exist": [
    (m) => {
      if (m.includes("`{}` is invalid")) {
        return "Empty path parameter '{}' is invalid. Name your path parameters.";
      }

      return null;
    },
  ],

  "path-params-defined": [
    (m) => {
      const match = m.match(RE_PATH_PARAM_UNDEFINED);

      if (!match) {
        return null;
      }

      return `Path has '{${match[1]}}' placeholder but the operation doesn't define that parameter.`;
    },
  ],

  "no-ambiguous-paths": [
    (m) => {
      const match = m.match(RE_AMBIGUOUS_PATHS);

      if (!match) {
        return null;
      }

      return `Ambiguous paths: '${match[1]}' and '${match[2]}' could match the same request.`;
    },
  ],

  "no-identical-paths": [
    (m) => {
      const match = m.match(RE_IDENTICAL_PATHS);

      if (!match) {
        return null;
      }

      return `Duplicate path: '${match[1]}' and '${match[2]}' are the same route with different parameter names.`;
    },
  ],

  "operation-parameters-unique": [
    (m) => {
      const match = m.match(RE_PARAMS_UNIQUE);

      if (!match) {
        return null;
      }

      return `Duplicate parameter: '${match[2]}' (in: ${match[1]}) is defined more than once.`;
    },
  ],

  "info-contact": [
    () => "Add contact info (name/email/URL) to your API's info section.",
  ],

  "info-license": [() => "Add a license to your API's info section."],

  "info-license-url": [
    () => "Add a URL to the license in your API's info section.",
  ],

  "parameter-description": [
    (m) => {
      if (m.includes("must be present")) {
        return "Add a description to this parameter.";
      }

      if (m.includes("non-empty")) {
        return "Parameter description cannot be empty.";
      }

      return null;
    },
  ],

  "scalar-property-missing-example": [
    () =>
      "Add an example value to this field so consumers know what to expect.",
  ],

  "tags-alphabetical": [() => "Sort your tags alphabetically."],

  "no-duplicated-tag-names": [
    (m) => {
      const match = m.match(RE_DUPLICATE_TAG);

      if (!match) {
        return null;
      }

      return `Tag '${match[1]}' is defined more than once.`;
    },
  ],

  "no-unused-components": [
    (m) => {
      const match = m.match(RE_UNUSED_COMPONENT);

      if (!match) {
        return null;
      }

      return `'${match[1]}' is defined but never referenced anywhere.`;
    },

    (m) => {
      const match = m.match(RE_UNUSED_SECURITY);

      if (!match) {
        return null;
      }

      return `Security scheme '${match[1]}' is defined but never used.`;
    },
  ],

  "no-server-trailing-slash": [
    () => "Remove the trailing slash from the server URL.",
  ],

  "no-server-example.com": [
    () => "Use a real server URL, not example.com or localhost.",
  ],

  "no-empty-servers": [() => "Add at least one server URL."],

  "no-undefined-server-variable": [
    (m) => {
      const match = m.match(RE_SERVER_VAR_NOT_DEFINED);

      if (match) {
        return `Server URL uses '${match[1]}' but it's not defined in 'variables'.`;
      }

      const match2 = m.match(RE_SERVER_VAR_NOT_USED);

      if (match2) {
        return `Variable '${match2[1]}' is defined but not used in the server URL.`;
      }

      return null;
    },
  ],

  "no-example-value-and-externalValue": [
    () => "Choose either 'value' or 'externalValue' for an example, not both.",
  ],

  "nullable-type-sibling": [() => "Add a 'type' when using 'nullable'."],

  "operation-4xx-response": [
    () => "Define at least one 4xx error response for this endpoint.",
  ],

  "operation-4xx-problem-details-rfc7807": [
    () =>
      "4xx errors should use 'application/problem+json' content type (RFC 7807).",
  ],

  "no-required-schema-properties-undefined": [
    (m) => {
      const match = m.match(RE_REQUIRED_PROP_UNDEFINED);

      if (!match) {
        return null;
      }

      return `'${match[1]}' is listed as required but doesn't exist in properties.`;
    },
  ],

  "no-mixed-number-range-constraints": [
    (m) => {
      if (m.includes("maximum")) {
        return "Use either 'maximum' or 'exclusiveMaximum', not both.";
      }

      if (m.includes("minimum")) {
        return "Use either 'minimum' or 'exclusiveMinimum', not both.";
      }

      return null;
    },
  ],

  "operation-operationId": [
    () =>
      "This endpoint needs a unique ID (operationId) so tools can reference it.",
  ],

  "operation-summary": [
    () => "Add a short summary describing what this endpoint does.",
  ],

  "operation-description": [
    () => "Add a description explaining this endpoint's behavior.",
  ],

  "tag-description": [() => "Add a description to this tag."],

  "path-http-verbs-order": [
    () =>
      "HTTP methods in this path should be in standard order (GET, POST, PUT, PATCH, DELETE).",
  ],

  "required-string-property-missing-min-length": [
    () =>
      "Required string properties should define a minLength to prevent empty values.",
  ],
};

// --- Fallback lookup ---

const knownRuleDescriptions = new Map(
  knownRules.map((r) => [r.id, r.description]),
);

export function getFriendlyMessage(
  ruleId: string,
  message: string,
): string | null {
  const ruleRewriters = rewriters[ruleId];

  if (ruleRewriters) {
    for (const rewrite of ruleRewriters) {
      const result = rewrite(message);

      if (result !== null) {
        return result;
      }
    }
  }

  return knownRuleDescriptions.get(ruleId) ?? null;
}
