
import test from "node:test";
import assert from "node:assert/strict";

import {
  createTextElement,
  createElement,
} from "../src/mini-react.js";

// =====================================
// T-01.1: createTextElement() Tests
// =====================================

test("T-01.1: converts string to TEXT_ELEMENT", () => {
  const vnode = createTextElement("Hello");

  assert.equal(vnode.type, "TEXT_ELEMENT");
  assert.equal(vnode.props.nodeValue, "Hello");
  assert.deepEqual(vnode.props.children, []);
});

test("T-01.1: converts number to string", () => {
  const vnode = createTextElement(123);

  assert.equal(vnode.props.nodeValue, "123");
  assert.equal(typeof vnode.props.nodeValue, "string");
});

test("T-01.1: preserves numeric zero", () => {
  const vnode = createTextElement(0);

  assert.equal(vnode.props.nodeValue, "0");
});

test("T-01.1: rejects null input", () => {
  assert.throws(
    () => createTextElement(null),
    TypeError
  );
});

test("T-01.1: text node has empty children", () => {
  const vnode = createTextElement("Test");

  assert.ok(Array.isArray(vnode.props.children));
  assert.equal(vnode.props.children.length, 0);
});

test("T-01.1: preserves empty string", () => {
  const vnode = createTextElement("");

  assert.equal(vnode.props.nodeValue, "");
});

test("T-01.1: rejects unsupported values", () => {
  assert.throws(() => createTextElement(true), TypeError);
  assert.throws(() => createTextElement({}), TypeError);
  assert.throws(() => createTextElement(undefined), TypeError);
});

// =====================================
// T-01.2: createElement() Tests
// =====================================

test("T-01.2: creates h1 with null props", () => {
  const vnode = createElement("h1", null, "Hello");

  assert.equal(vnode.type, "h1");
  assert.equal(vnode.props.children.length, 1);
  assert.equal(
    vnode.props.children[0].props.nodeValue,
    "Hello"
  );
});

test("T-01.2: supports multiple children", () => {
  const vnode = createElement(
    "p",
    null,
    "A",
    "B",
    123
  );

  assert.equal(vnode.props.children.length, 3);

  assert.deepEqual(
    vnode.props.children.map(
      (child) => child.props.nodeValue
    ),
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
    vnode.props.children.map(
      (child) => child.props.nodeValue
    ),
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
  assert.equal(
    vnode.props.children[0].props.nodeValue,
    "Visible"
  );
});

test("T-01.2: preserves number zero", () => {
  const vnode = createElement("p", null, 0);

  assert.equal(
    vnode.props.children[0].props.nodeValue,
    "0"
  );
});

test("T-01.2: preserves existing VNodes", () => {
  const child = createTextElement("Hello");
  const vnode = createElement("p", null, child);

  assert.strictEqual(
    vnode.props.children[0],
    child
  );
});

test("T-01.2: rejects unsupported children", () => {
  assert.throws(
    () => createElement("p", null, true),
    TypeError
  );

  assert.throws(
    () => createElement("p", null, {}),
    TypeError
  );

  assert.throws(
    () => createElement("p", null, () => {}),
    TypeError
  );
});

test("T-01.2: does not mutate input props", () => {
  const props = {
    id: "title",
    className: "hero",
  };

  const vnode = createElement("h1", props, "Hello");

  assert.deepEqual(props, {
    id: "title",
    className: "hero",
  });

  assert.notStrictEqual(vnode.props, props);
  assert.equal(vnode.props.id, "title");
});

test("T-01.2: rejects invalid HTML type", () => {
  assert.throws(
    () => createElement("", null),
    TypeError
  );

  assert.throws(
    () => createElement(123, null),
    TypeError
  );
});

test("T-01.2: preserves empty string", () => {
  const vnode = createElement("p", null, "");

  assert.equal(vnode.props.children.length, 1);
  assert.equal(
    vnode.props.children[0].props.nodeValue,
    ""
  );
});

test("T-01.2: rejects malformed VNodes", () => {
  const invalidVNode = {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: 123,
      children: [],
    },
  };

  assert.throws(
    () => createElement("p", null, invalidVNode),
    TypeError
  );
});

// =====================================
// Additional Contract Tests
// =====================================

test("T-01: accepts undefined props", () => {
  const vnode = createElement(
    "main",
    undefined,
    "Content"
  );

  assert.equal(vnode.type, "main");
  assert.equal(vnode.props.children.length, 1);
});

test("T-01: rejects invalid props", () => {
  assert.throws(
    () => createElement("p", "invalid"),
    TypeError
  );

  assert.throws(
    () => createElement("p", []),
    TypeError
  );
});

test("T-01: preserves child order", () => {
  const vnode = createElement(
    "section",
    null,
    "First",
    ["Second", ["Third"]],
    "Fourth"
  );

  assert.deepEqual(
    vnode.props.children.map(
      (child) => child.props.nodeValue
    ),
    ["First", "Second", "Third", "Fourth"]
  );
});
