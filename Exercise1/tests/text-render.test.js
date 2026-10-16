
import test from "node:test";
import assert from "node:assert/strict";

import {
  createTextElement,
  renderToDOM,
} from "../src/mini-react.js";

test("T-02.1: creates a text node", () => {
  const originalDocument = globalThis.document;

  try {
    globalThis.document = {
      createTextNode(value) {
        return {
          nodeType: 3,
          textContent: value,
        };
      },
    };

    const vnode = createTextElement("Hello");
    const result = renderToDOM(vnode);

    assert.equal(result.nodeType, 3);
    assert.equal(result.textContent, "Hello");
  } finally {
    globalThis.document = originalDocument;
  }
});

test("T-02.1: preserves special characters", () => {
  const originalDocument = globalThis.document;

  try {
    globalThis.document = {
      createTextNode(value) {
        return {
          nodeType: 3,
          textContent: value,
        };
      },
    };

    const payload = "<script>alert(1)</script>";
    const result = renderToDOM(createTextElement(payload));

    assert.equal(result.textContent, payload);
  } finally {
    globalThis.document = originalDocument;
  }
});

test("T-02.1: rejects malformed text VNodes", () => {
  assert.throws(
    () =>
      renderToDOM({
        type: "TEXT_ELEMENT",
        props: {
          nodeValue: 123,
          children: [],
        },
      }),
    TypeError
  );

  assert.throws(
    () =>
      renderToDOM({
        type: "TEXT_ELEMENT",
        props: {
          nodeValue: "Hello",
          children: [createTextElement("Invalid")],
        },
      }),
    TypeError
  );
});
