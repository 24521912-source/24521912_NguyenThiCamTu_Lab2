import "./style.css";
import { createElement, renderToDOM } from "./mini-react.js";

// T-03: Demo application (Lab 02 - Checkpoint 1)
const vApp = createElement(
  "main",
  { id: "root-view", role: "main" },
  createElement(
    "header",
    { className: "hero" },
    createElement("h1", null, "Mini React Engine"),
    createElement("p", null, "<img onerror=alert(1)> Safe Text"),
    createElement("p", null, "<script>alert(1)</script>")
  ),
  createElement("button", { onClick: () => console.log("Ping") }, "Click")
);

const root = document.getElementById("app");

root.replaceChildren(renderToDOM(vApp));

console.assert(root.querySelector("button") !== null, "Mount Failed");

// T-04: Browser DOM tests, dev server only (stripped from production build)
if (import.meta.env.DEV) {
  import("../tests/dom-render.browser.js").then(({ runDOMTests }) =>
    runDOMTests()
  );
}
