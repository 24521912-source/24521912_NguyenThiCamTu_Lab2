import { createElement, renderToDOM } from "../src/mini-react.js";
import { setupEventDelegation } from "../src/events.js";

export function runEventTests() {
  let passed = 0;

  function check(condition, message) {
    if (!condition) {
      throw new Error(`FAIL: ${message}`);
    }

    passed++;
    console.log(`PASS: ${message}`);
  }

  function throwsTypeError(callback) {
    try {
      callback();
      return false;
    } catch (error) {
      return error instanceof TypeError;
    }
  }

  function makeRoot() {
    const root = document.createElement("section");
    setupEventDelegation(root);
    return root;
  }

  // 1. Click on a button is handled once
  let clicks = 0;
  const root = makeRoot();

  root.replaceChildren(
    renderToDOM(createElement("button", { onClick: () => clicks++ }, "Add"))
  );
  root.querySelector("button").click();

  check(clicks === 1, "Click handled exactly once");

  // 2. No listener on the child itself: without a hub, nothing runs
  let orphanClicks = 0;
  const detached = renderToDOM(
    createElement("button", { onClick: () => orphanClicks++ }, "Orphan")
  );

  detached.click();

  check(orphanClicks === 0, "No listener attached to button child");
  check(detached.getAttribute("onclick") === null, "No inline onclick attribute");

  // 3. Event bubbles from a nested child to the nearest handler
  let nestedClicks = 0;
  const nestedRoot = makeRoot();

  nestedRoot.replaceChildren(
    renderToDOM(
      createElement(
        "button",
        { onClick: () => nestedClicks++ },
        createElement("span", null, "Inner")
      )
    )
  );
  nestedRoot.querySelector("span").click();

  check(nestedClicks === 1, "Click on nested span bubbles to button handler");

  // 4. Only the nearest handler runs, not the ancestors too
  const order = [];
  const parentRoot = makeRoot();

  parentRoot.replaceChildren(
    renderToDOM(
      createElement(
        "section",
        { onClick: () => order.push("section") },
        createElement("button", { onClick: () => order.push("button") }, "Go")
      )
    )
  );
  parentRoot.querySelector("button").click();

  check(
    order.length === 1 && order[0] === "button",
    "Only the nearest handler runs"
  );

  // 5. A button created after re-render still works with the old root listener
  let rerenderClicks = 0;
  const rerenderRoot = makeRoot();

  for (let pass = 0; pass < 3; pass++) {
    rerenderRoot.replaceChildren(
      renderToDOM(
        createElement("button", { onClick: () => rerenderClicks++ }, "Again")
      )
    );
  }
  rerenderRoot.querySelector("button").click();

  check(rerenderClicks === 1, "New button after re-render works, fires once");

  // 6. Calling setupEventDelegation twice does not double the listener
  let doubleClicks = 0;
  const doubleRoot = makeRoot();

  setupEventDelegation(doubleRoot);
  doubleRoot.replaceChildren(
    renderToDOM(createElement("button", { onClick: () => doubleClicks++ }, "X"))
  );
  doubleRoot.querySelector("button").click();

  check(doubleClicks === 1, "Root listener is not registered twice");

  // 7. keydown uses event.key, input event is delegated
  let pressedKey = "";
  let inputs = 0;
  const keyRoot = makeRoot();

  keyRoot.replaceChildren(
    renderToDOM(
      createElement(
        "section",
        { onInput: () => inputs++ },
        createElement(
          "button",
          { onKeydown: (event) => (pressedKey = event.key) },
          "Key"
        )
      )
    )
  );
  keyRoot
    .querySelector("button")
    .dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  keyRoot
    .querySelector("button")
    .dispatchEvent(new Event("input", { bubbles: true }));

  check(pressedKey === "Enter", "keydown handler receives event.key");
  check(inputs === 1, "input event is delegated");

  // 8. Validation
  check(
    throwsTypeError(() =>
      renderToDOM(createElement("button", { onClick: "alert(1)" }, "Bad"))
    ),
    "Reject string event handler"
  );
  check(
    throwsTypeError(() => setupEventDelegation(null)),
    "Reject missing root container"
  );
  check(
    renderToDOM(createElement("button", { type: "button" }, "T")).type ===
      "button",
    "Apply button type"
  );

  console.log(`Event tests: ${passed} passed, 0 failed`);

  return passed;
}
