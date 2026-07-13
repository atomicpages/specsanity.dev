import { describe, expect, it } from "bun:test";
import { getFriendlyMessage } from "./friendly-messages";

describe("getFriendlyMessage", () => {
  describe("no-unresolved-refs", () => {
    it("rewrites $ref resolution failures with path", () => {
      expect(
        getFriendlyMessage(
          "no-unresolved-refs",
          "Can't resolve $ref: #/components/schemas/Pet",
        ),
      ).toBe(
        "Reference to 'Pet' not found. Check for typos or missing definitions.",
      );
    });

    it("rewrites bare $ref failure", () => {
      expect(
        getFriendlyMessage("no-unresolved-refs", "Can't resolve $ref"),
      ).toBe("Broken reference ($ref). The target doesn't exist.");
    });

    it("rewrites parse failures", () => {
      expect(
        getFriendlyMessage(
          "no-unresolved-refs",
          "Failed to parse: unexpected token",
        ),
      ).toBe("Could not parse this file: unexpected token");
    });
  });

  describe("spec (struct)", () => {
    it("rewrites unexpected property", () => {
      expect(
        getFriendlyMessage("spec", "Property `basePath` is not expected here."),
      ).toBe("'basePath' is not a valid OpenAPI field at this location.");
    });

    it("rewrites field not allowed", () => {
      expect(
        getFriendlyMessage("spec", "The field `foo` is not allowed here."),
      ).toBe("'foo' is not allowed here.");
    });

    it("rewrites field must be present", () => {
      expect(
        getFriendlyMessage(
          "spec",
          "The field `responses` must be present on this level.",
        ),
      ).toBe("Missing required field 'responses'.");
    });

    it("rewrites must contain at least one of", () => {
      expect(
        getFriendlyMessage(
          "spec",
          "Must contain at least one of the following fields: content, schema.",
        ),
      ).toBe("At least one of these fields is required: content, schema.");
    });

    it("rewrites type mismatch", () => {
      expect(
        getFriendlyMessage("spec", "Expected type `string` but got `number`."),
      ).toBe("Wrong type: expected string, got number.");
    });

    it("rewrites object type mismatch", () => {
      expect(
        getFriendlyMessage(
          "spec",
          "Expected type `Schema` (object) but got `string`",
        ),
      ).toBe("Expected an object here, got string.");
    });

    it("rewrites array type mismatch", () => {
      expect(
        getFriendlyMessage(
          "spec",
          "Expected type `SecurityRequirement` (array) but got `object`",
        ),
      ).toBe("Expected an array here, got object.");
    });

    it("rewrites minimum value constraint", () => {
      expect(
        getFriendlyMessage(
          "spec",
          "The value of the minItems field must be greater than or equal to 0",
        ),
      ).toBe("'minItems' must be at least 0.");
    });

    it("rewrites missing required field (object should contain)", () => {
      expect(
        getFriendlyMessage("spec", "Info object should contain `title` field."),
      ).toBe("Missing required field 'title' in Info.");
    });

    it("rewrites non-empty string requirement", () => {
      expect(
        getFriendlyMessage(
          "spec",
          "Info object `title` must be non-empty string.",
        ),
      ).toBe("'title' cannot be empty.");
    });

    it("rewrites enum-style validation", () => {
      expect(
        getFriendlyMessage(
          "spec",
          '`in` can be one of the following only: "query", "header", "path", "cookie".',
        ),
      ).toBe(
        'Invalid value for \'in\'. Allowed: "query", "header", "path", "cookie".',
      );
    });

    it("rewrites invalid value", () => {
      expect(
        getFriendlyMessage("spec", '`type` "foo" is not a valid value.'),
      ).toBe("'foo' is not a valid value for 'type'.");
    });
  });

  describe("security-defined", () => {
    it("rewrites missing operation security", () => {
      expect(
        getFriendlyMessage(
          "security-defined",
          "Every operation should have security defined on it or on the root level.",
        ),
      ).toBe(
        "No authentication defined for this endpoint. Add a security requirement here or at the root level.",
      );
    });

    it("rewrites undefined security scheme", () => {
      expect(
        getFriendlyMessage(
          "security-defined",
          "There is no `bearerAuth` security scheme defined.",
        ),
      ).toBe(
        "Security scheme 'bearerAuth' is referenced but never defined in components/securitySchemes.",
      );
    });
  });

  describe("no-enum-type-mismatch", () => {
    it("rewrites type mismatch with expected/received", () => {
      expect(
        getFriendlyMessage(
          "no-enum-type-mismatch",
          'All values of `enum` field must be of the same type as the `type` field: expected "string" but received "integer".',
        ),
      ).toBe("Enum value has wrong type: expected string, got integer.");
    });

    it("rewrites enum value must be of allowed types", () => {
      expect(
        getFriendlyMessage(
          "no-enum-type-mismatch",
          "Enum value `active` must be of allowed types: `integer`.",
        ),
      ).toBe("Enum value 'active' doesn't match the declared type 'integer'.");
    });
  });

  describe("no-schema-type-mismatch", () => {
    it("rewrites object with items", () => {
      expect(
        getFriendlyMessage(
          "no-schema-type-mismatch",
          "Schema type mismatch: 'object' type should not contain 'items' field.",
        ),
      ).toBe("Objects don't use 'items' — that's for arrays.");
    });

    it("rewrites array with properties", () => {
      expect(
        getFriendlyMessage(
          "no-schema-type-mismatch",
          "Schema type mismatch: 'array' type should not contain 'properties' field.",
        ),
      ).toBe("Arrays don't use 'properties' — that's for objects.");
    });
  });

  describe("path rules", () => {
    it("rewrites trailing slash", () => {
      expect(
        getFriendlyMessage(
          "no-path-trailing-slash",
          "`/users/` should not have a trailing slash.",
        ),
      ).toBe("Remove the trailing '/' from '/users/'.");
    });

    it("rewrites kebab-case", () => {
      expect(
        getFriendlyMessage(
          "paths-kebab-case",
          "`/userAccounts` does not use kebab-case.",
        ),
      ).toBe(
        "'/userAccounts' should use kebab-case (lowercase words separated by hyphens).",
      );
    });

    it("rewrites http verbs in path", () => {
      expect(
        getFriendlyMessage(
          "no-http-verbs-in-paths",
          "path `/getUsers` should not contain http verb get",
        ),
      ).toBe(
        "Don't include 'get' in the path — the HTTP method already conveys this.",
      );
    });

    it("rewrites path segment plural", () => {
      expect(
        getFriendlyMessage(
          "path-segment-plural",
          "path segment `user` should be plural.",
        ),
      ).toBe("Use the plural form of 'user'.");
    });

    it("rewrites query in path", () => {
      expect(
        getFriendlyMessage(
          "path-not-include-query",
          "Don't put query string items in the path, they belong in parameters with `in: query`.",
        ),
      ).toBe(
        "Query parameters belong in the 'parameters' section, not the URL path.",
      );
    });

    it("rewrites ambiguous paths", () => {
      expect(
        getFriendlyMessage(
          "no-ambiguous-paths",
          "Paths should resolve unambiguously. Found two ambiguous paths: `/users/{id}` and `/users/{userId}`.",
        ),
      ).toBe(
        "Ambiguous paths: '/users/{id}' and '/users/{userId}' could match the same request.",
      );
    });

    it("rewrites identical paths", () => {
      expect(
        getFriendlyMessage(
          "no-identical-paths",
          "The path already exists which differs only by path parameter name(s): `/pets/{petId}` and `/pets/{id}`.",
        ),
      ).toBe(
        "Duplicate path: '/pets/{petId}' and '/pets/{id}' are the same route with different parameter names.",
      );
    });

    it("rewrites undefined path parameter", () => {
      expect(
        getFriendlyMessage(
          "path-params-defined",
          "The operation does not define the path parameter `{userId}` expected by path `/users/{userId}`.",
        ),
      ).toBe(
        "Path has '{userId}' placeholder but the operation doesn't define that parameter.",
      );
    });
  });

  describe("naming rules", () => {
    it("rewrites duplicate operationId", () => {
      expect(
        getFriendlyMessage(
          "operation-operationId-unique",
          "Every operation must have a unique `operationId`.",
        ),
      ).toBe("Duplicate operationId. Each endpoint needs a unique identifier.");
    });

    it("rewrites url-unsafe operationId", () => {
      expect(
        getFriendlyMessage(
          "operation-operationId-url-safe",
          "Operation `operationId` should not have URL invalid characters.",
        ),
      ).toBe("operationId contains characters that aren't safe in URLs.");
    });

    it("rewrites singular tag", () => {
      expect(
        getFriendlyMessage(
          "operation-singular-tag",
          "Operation `tags` object should have only one tag.",
        ),
      ).toBe("Use only one tag per operation.");
    });
  });

  describe("documentation rules", () => {
    it("rewrites info-contact", () => {
      expect(
        getFriendlyMessage(
          "info-contact",
          "Info object should contain `contact` field.",
        ),
      ).toBe("Add contact info (name/email/URL) to your API's info section.");
    });

    it("rewrites info-license", () => {
      expect(
        getFriendlyMessage(
          "info-license",
          "Info object should contain `license` field.",
        ),
      ).toBe("Add a license to your API's info section.");
    });
  });

  describe("oas3-specific", () => {
    it("rewrites unused component", () => {
      expect(
        getFriendlyMessage(
          "no-unused-components",
          'Component: "PetSchema" is never used.',
        ),
      ).toBe("'PetSchema' is defined but never referenced anywhere.");
    });

    it("rewrites unused security scheme", () => {
      expect(
        getFriendlyMessage(
          "no-unused-components",
          'Security scheme: "oauth2" is never used.',
        ),
      ).toBe("Security scheme 'oauth2' is defined but never used.");
    });

    it("rewrites no-empty-servers", () => {
      expect(
        getFriendlyMessage("no-empty-servers", "Servers must be present."),
      ).toBe("Add at least one server URL.");
    });
  });

  describe("number constraints", () => {
    it("rewrites maximum/exclusiveMaximum conflict", () => {
      expect(
        getFriendlyMessage(
          "no-mixed-number-range-constraints",
          "Schema should not have both `maximum` and `exclusiveMaximum`. Use one or the other.",
        ),
      ).toBe("Use either 'maximum' or 'exclusiveMaximum', not both.");
    });

    it("rewrites minimum/exclusiveMinimum conflict", () => {
      expect(
        getFriendlyMessage(
          "no-mixed-number-range-constraints",
          "Schema should not have both `minimum` and `exclusiveMinimum`. Use one or the other.",
        ),
      ).toBe("Use either 'minimum' or 'exclusiveMinimum', not both.");
    });
  });

  describe("fallback behavior", () => {
    it("falls back to knownRules description for unmatched messages", () => {
      expect(
        getFriendlyMessage("operation-operationId", "some unknown message"),
      ).toBe(
        "This endpoint needs a unique ID (operationId) so tools can reference it.",
      );
    });

    it("returns null for completely unknown rules", () => {
      expect(
        getFriendlyMessage("some-nonexistent-rule", "whatever"),
      ).toBeNull();
    });
  });
});
