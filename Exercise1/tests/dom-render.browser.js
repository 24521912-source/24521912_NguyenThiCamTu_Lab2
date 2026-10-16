
import {
  createElement,
  createTextElement,
  renderToDOM,
} from "../src/mini-react.js";

export function runDOMTests() {
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

  // 1. Text rendering
  const text = renderToDOM(createTextElement("Hello"));

  check(text.nodeType === Node.TEXT_NODE, "Text node");
  check(text.textContent === "Hello", "Text content");

  check(
    throwsTypeError(() =>
      renderToDOM({
        type: "TEXT_ELEMENT",
        props: {
          nodeValue: 123,
          children: [],
        },
      })
    ),
    "Reject malformed text VNode"
  );

  // 2. HTML element rendering
  const heading = renderToDOM(
    createElement(
      "h1",
      {
        id: "title",
        className: "hero",
        role: "heading",
        style: {
          color: "red",
          fontSize: "20px",
        },
      },
      "Mini React Engine"
    )
  );

  check(heading.tagName === "H1", "Create h1");
  check(heading.id === "title", "Apply id");
  check(heading.className === "hero", "Apply class");
  check(
    heading.getAttribute("role") === "heading",
    "Apply role"
  );
  check(heading.style.color === "red", "Apply color");
  check(
    heading.style.fontSize === "20px",
    "Apply font size"
  );
  check(
    heading.textContent === "Mini React Engine",
    "Render child text"
  );

  // 3. Recursive rendering
  const tree = renderToDOM(
    createElement(
      "main",
      { id: "test-main" },
      createElement(
        "section",
        null,
        createElement("h1", null, "Title"),
        createElement("p", null, "Description")
      )
    )
  );

  check(tree.tagName === "MAIN", "Create main");
  check(
    tree.querySelector("section") !== null,
    "Nested section"
  );
  check(
    tree.querySelector("h1").textContent === "Title",
    "Nested h1"
  );
  check(
    tree.querySelector("p").textContent === "Description",
    "Nested paragraph"
  );
  check(
    tree.querySelector("section").children[0].tagName === "H1" &&
      tree.querySelector("section").children[1].tagName === "P",
    "Preserve children order"
  );

  // 4. Click handling
  let clicks = 0;

  const button = renderToDOM(
    createElement(
      "button",
      {
        onClick: () => {
          clicks++;
        },
      },
      "Ping"
    )
  );

  button.click();

  check(clicks === 1, "onClick fires once");
  check(
    button.getAttribute("onclick") === null,
    "No inline onclick attribute"
  );

  check(
    throwsTypeError(() =>
      renderToDOM(
        createElement(
          "button",
          { onClick: "alert(1)" },
          "Bad"
        )
      )
    ),
    "Reject string-based event handler"
  );

  // 5. Invalid VNode
  check(
    throwsTypeError(() =>
      renderToDOM({
        type: "p",
        props: {
          children: [{}],
        },
      })
    ),
    "Reject malformed child"
  );

  // 6. XSS protection
  const payload1 = "<script>alert(1)</script>";
  const payload2 = "<img onerror=alert(1)> Safe Text";

  const safe = renderToDOM(
    createElement("section", null, payload1, payload2)
  );

  check(
    safe.textContent === payload1 + payload2,
    "Preserve XSS strings"
  );

  check(
    safe.querySelector("script, img") === null,
    "No injected HTML elements"
  );

  // 7. Repeated mounting
  const container = document.createElement("section");

  container.replaceChildren(renderToDOM(createElement("p", null, "A")));
  container.replaceChildren(renderToDOM(createElement("p", null, "A")));

  check(
    container.childNodes.length === 1,
    "replaceChildren does not duplicate nodes"
  );

  console.log(
    `DOM tests: ${passed} passed, 0 failed`
  );

  return passed;
}
