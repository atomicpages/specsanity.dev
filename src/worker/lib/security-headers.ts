import { Elysia } from "elysia";

export const securityHeaders = new Elysia({
  name: "security-headers",
}).onAfterHandle(({ set }) => {
  set.headers["x-content-type-options"] = "nosniff";
  set.headers["x-frame-options"] = "DENY";
  set.headers["referrer-policy"] = "strict-origin-when-cross-origin";
  set.headers["permissions-policy"] =
    "camera=(), microphone=(), geolocation=()";
  set.headers["strict-transport-security"] =
    "max-age=31536000; includeSubDomains";
});
