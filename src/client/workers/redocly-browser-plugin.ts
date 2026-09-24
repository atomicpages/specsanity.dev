import type { BunPlugin } from "bun";

export const redoclyBrowserPlugin: BunPlugin = {
  name: "redocly-browser-path",
  setup(builder) {
    builder.onResolve({ filter: /^(node:)?path$/ }, () => ({
      path: Bun.resolveSync("path-browserify", import.meta.dir),
    }));
  },
};
