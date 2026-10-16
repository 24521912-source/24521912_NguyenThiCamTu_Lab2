import { createElement } from "../src/mini-react.js";
import { setupEventDelegation } from "../src/events.js";
import { renderApp, useState } from "../src/reactive-engine.js";
import { TaskApp } from "../src/task-app.js";

export function runAppTests() {
  let passed = 0;

  function check(condition, message) {
    if (!condition) {
      throw new Error(`FAIL: ${message}`);
    }

    passed++;
    console.log(`PASS: ${message}`);
  }

  // The root must be in the document so focus can be tested.
  function mount(Component) {
    const root = document.createElement("section");
    document.body.append(root);
    setupEventDelegation(root);
    renderApp(Component, root);
    return root;
  }

  const titles = (root) =>
    [...root.querySelectorAll(".task__title")].map((node) => node.textContent);
  const count = (root) => root.querySelector("h2").textContent;
  const click = (root, selector) => root.querySelector(selector).click();

  // 1. Initial render
  const app = mount(TaskApp);

  check(count(app) === "Tasks: 2", "Initial count is Tasks: 2");
  check(
    titles(app).join() === "Review PR,Verify AST",
    "Initial tasks are rendered"
  );
  check(
    app.querySelector("#filter-ALL").getAttribute("aria-pressed") === "true",
    "ALL filter is pressed by default"
  );

  // 2. Add Task updates count and list
  click(app, "#add-task");

  check(count(app) === "Tasks: 3", "Add Task increases count");
  check(titles(app).length === 3, "New task appears in the list");

  // 3. Toggle done and filters
  click(app, "#toggle-1");

  check(
    app.querySelector("#toggle-1").getAttribute("aria-pressed") === "true",
    "Toggle marks task as done"
  );

  click(app, "#filter-ACTIVE");
  check(
    titles(app).join() === "Verify AST,New task 3",
    "ACTIVE shows only unfinished tasks"
  );
  check(
    app.querySelector("#filter-ACTIVE").getAttribute("aria-pressed") === "true" &&
      app.querySelector("#filter-ALL").getAttribute("aria-pressed") === "false",
    "aria-pressed follows the selected filter"
  );

  click(app, "#filter-COMPLETED");
  check(titles(app).join() === "Review PR", "COMPLETED shows only done tasks");

  click(app, "#toggle-1");
  check(
    app.querySelector(".empty") !== null && titles(app).length === 0,
    "Empty message when no task matches"
  );

  click(app, "#filter-ALL");
  check(titles(app).length === 3, "ALL shows every task again");

  // 4. Repeated interactions keep state consistent
  for (let index = 0; index < 3; index++) {
    click(app, "#add-task");
  }

  check(count(app) === "Tasks: 6", "Three more adds give Tasks: 6");
  check(
    new Set(titles(app)).size === 6,
    "Every task title stays unique"
  );

  // 5. Focus is restored after the subtree is replaced
  app.querySelector("#add-task").focus();
  click(app, "#add-task");

  check(document.activeElement.id === "add-task", "Focus stays on Add Task");

  app.querySelector("#filter-ACTIVE").focus();
  click(app, "#filter-ACTIVE");
  app.querySelector("#toggle-2").focus();
  click(app, "#toggle-2");

  check(
    document.activeElement.tagName === "BUTTON" &&
      app.contains(document.activeElement),
    "Focus falls back to a button when the focused task is filtered out"
  );

  app.remove();

  // 6. Same value does not re-render
  let renders = 0;
  const counter = mount(() => {
    renders++;
    const [filter, setFilter] = useState("ALL");
    return createElement(
      "button",
      { onClick: () => setFilter("ALL") },
      filter
    );
  });

  click(counter, "button");
  check(renders === 1, "Setting the same filter does not re-render");
  counter.remove();

  // 7. A conditional useState is reported (slide 19 bug)
  let setTick;
  let extraHook = false;
  let hookError = null;
  const conditional = mount(() => {
    const [tick, setTickState] = useState(0);
    setTick = setTickState;

    if (extraHook) {
      useState("extra");
    }

    return createElement("p", null, String(tick));
  });

  extraHook = true;

  try {
    setTick(1);
  } catch (error) {
    hookError = error;
  }

  check(
    hookError instanceof Error && hookError.message.includes("Hook count changed"),
    "Conditional useState throws a hook count error"
  );
  conditional.remove();

  // 8. XSS strings stay text
  const payloads = ["<script>alert(1)</script>", "<img src=x onerror=alert(1)>"];
  const xss = mount(() => {
    const [items] = useState(payloads);
    return createElement(
      "ul",
      null,
      items.map((item) => createElement("li", null, item))
    );
  });

  check(
    [...xss.querySelectorAll("li")].map((li) => li.textContent).join() ===
      payloads.join(),
    "XSS strings are shown as text"
  );
  check(
    xss.querySelector("script, img") === null,
    "No script or img element is created"
  );
  xss.remove();

  console.log(`App tests: ${passed} passed, 0 failed`);

  return passed;
}
