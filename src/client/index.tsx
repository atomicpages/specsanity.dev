import { Provider } from "jotai";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { assert } from "./assert";
import "./index.css";

const el = document.getElementById("root");
assert(el, "Root element not found");

const root = createRoot(el);

root.render(
  <Provider>
    <App />
  </Provider>,
);
