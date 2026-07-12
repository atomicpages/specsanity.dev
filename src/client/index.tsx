import { Provider } from "jotai";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./App";
import { assert } from "./assert";
import "./index.css";

const el = document.getElementById("root");
assert(el, "Root element not found");

const tree = (
  <Provider>
    <App />
  </Provider>
);

if (el.hasChildNodes()) {
  hydrateRoot(el, tree);
} else {
  createRoot(el).render(tree);
}
