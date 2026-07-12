import { treaty } from "@elysiajs/eden";
import type { App } from "../../worker/index";

const origin =
  typeof window !== "undefined" ? window.location.origin : "http://localhost";

export const api = treaty<App>(origin);
