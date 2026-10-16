
import test from "node:test";
import assert from "node:assert/strict";

import {
  createTextElement,
  createElement,
} from "../src/mini-react.js";

// T-01.1: Text VNode

test("T-01.1: converts string", () => {
  const vnode = createTextElement("Hello");

  assert.equal(vnode.type, "TEXT_ELEMENT");
  assert.equal(vnode.props.nodeValue, "Hello");
  assert.deepEqual(vnode.props.children, []);
});

test("T-01.1: converts number", () => {
  const vnode = createTextElement(123);

  assert.equal(vnode.props.nodeValue, "123");
});

test("T-01.1: preserves zero", () => {
  assert.equal(
    createTextElement(0).props.nodeValue,
    "0"
  );
});

test("T-01.1: preserves empty string", () => {
  assert.equal(
    createTextElement("").props.nodeValue,
    ""
  );
});

test("T-01.1: rejects invalid input", () => {
  for (const value of [null, undefined, true, {}]) {
    assert.throws(
      () => createTextElement(value),
      TypeError
    );
  }
});

// T-01.2: Element VNode

test("T-01.2: supports null props", () => {
  const vnode = createElement("h1", null, "Hello");

  assert.equal(vnode.type, "h1");
  assert.equal(vnode.props.children[0].props.nodeValue, "Hello");
});

test("T-01.2: supports undefined props", () => {
  const vnode = createElement("main", undefined);

  assert.deepEqual(vnode.props.children, []);
});

test("T-01.2: supports multiple children", () => {
  const vnode = createElement("p", null, "A", "B", 123);

  assert.deepEqual(
    vnode.props.children.map((child) => child.props.nodeValue),
    ["A", "B", "123"]
  );
});

test("T-01.2: flattens nested arrays", () => {
  const vnode = createElement(
    "section",
    null,
    ["A", ["B", ["C"]]]
  );

  assert.deepEqual(
    vnode.props.children.map((child) => child.props.nodeValue),
    ["A", "B", "C"]
  );
});

test("T-01.2: filters ignored children", () => {
  const vnode = createElement(
    "p",
    null,
    null,
    undefined,
    false,
    "Visible"
  );

  assert.equal(vnode.props.children.length, 1);
});

test("T-01.2: preserves zero and empty string", () => {
  const vnode = createElement("p", null, 0, "");

  assert.deepEqual(
    vnode.props.children.map((child) => child.props.nodeValue),
    ["0", ""]
  );
});

test("T-01.2: preserves existing VNode", () => {
  const child = createTextElement("Hello");
  const vnode = createElement("p", null, child);

  assert.strictEqual(vnode.props.children[0], child);
});

test("T-01.2: rejects unsupported children", () => {
  for (const value of [true, {}, () => {}]) {
    assert.throws(
      () => createElement("p", null, value),
      TypeError
    );
  }
});

test("T-01.2: rejects malformed VNode", () => {
  const invalid = {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: 123,
      children: [],
    },
  };

  assert.throws(
    () => createElement("p", null, invalid),
    TypeError
  );
});

test("T-01.2: rejects invalid element type", () => {
  for (const type of ["script", "img", "", 123]) {
    assert.throws(
      () => createElement(type, null),
      TypeError
    );
  }
});

test("T-01.2: rejects invalid props", () => {
  assert.throws(
    () => createElement("p", []),
    TypeError
  );

  assert.throws(
    () => createElement("p", "invalid"),
    TypeError
  );
});

test("T-01.2: does not mutate props", () => {
  const props = { id: "title", className: "hero" };

  const vnode = createElement("h1", props, "Hello");

  assert.deepEqual(props, {
    id: "title",
    className: "hero",
  });

  assert.notStrictEqual(vnode.props, props);
});

test("T-01.2: preserves child order", () => {
  const vnode = createElement(
    "section",
    null,
    "First",
    ["Second", ["Third"]],
    "Fourth"
  );

  assert.deepEqual(
    vnode.props.children.map((child) => child.props.nodeValue),
    ["First", "Second", "Third", "Fourth"]
  );
});

test("T-01.2: rejects nested malformed VNodes", () => {
  const invalid = {
    type: "section",
    props: {
      children: [
        {
          type: "p",
          props: {
            children: [{}],
          },
        },
      ],
    },
  };

  assert.throws(
    () => createElement("main", null, invalid),
    TypeError
  );
});
