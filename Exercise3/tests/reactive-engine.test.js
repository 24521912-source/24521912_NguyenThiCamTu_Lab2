import test from "node:test";
import assert from "node:assert/strict";

// Each test gets a fresh module instance, so state never leaks between tests.
let instance = 0;

function loadEngine() {
  instance++;
  return import(`../src/reactive-engine.js?case=${instance}`);
}

// T-02: stateStore and resetCursor engine

test("T-02: exports resetCursor and setRenderer", async () => {
  const engine = await loadEngine();

  assert.equal(typeof engine.resetCursor, "function");
  assert.equal(typeof engine.setRenderer, "function");
});

test("T-02: resetCursor returns nothing", async () => {
  const { resetCursor } = await loadEngine();

  assert.equal(resetCursor(), undefined);
});

test("T-02: setRenderer accepts a function", async () => {
  const { setRenderer } = await loadEngine();

  assert.doesNotThrow(() => setRenderer(() => {}));
});

test("T-02: setRenderer rejects non-functions", async () => {
  const { setRenderer } = await loadEngine();

  for (const value of [null, undefined, 1, "render", {}]) {
    assert.throws(() => setRenderer(value), TypeError);
  }
});

test("T-02: state is private to the module", async () => {
  const engine = await loadEngine();

  assert.equal(engine.stateStore, undefined);
  assert.equal(engine.cursor, undefined);
});

// T-03: useState dispatcher

// Simulates what renderApp will do: reset the cursor, then run the component.
function renderPass(engine, component) {
  engine.resetCursor();
  return component();
}

test("T-03: first render returns initialValue", async () => {
  const engine = await loadEngine();

  const [count] = renderPass(engine, () => engine.useState(10));

  assert.equal(count, 10);
});

test("T-03: resetCursor makes the next pass read slot 0 again", async () => {
  const engine = await loadEngine();
  const component = () => engine.useState("first");

  renderPass(engine, component);
  const [value, setValue] = renderPass(engine, component);

  setValue("changed");

  assert.equal(renderPass(engine, component)[0], "changed");
  assert.equal(value, "first");
});

test("T-03: two useState calls keep independent values", async () => {
  const engine = await loadEngine();
  const component = () => [engine.useState("A"), engine.useState("B")];

  const [[, setFirst]] = renderPass(engine, component);
  setFirst("A2");

  const [[first], [second]] = renderPass(engine, component);

  assert.equal(first, "A2");
  assert.equal(second, "B");
});

test("T-03: state is kept after re-render, initialValue is ignored", async () => {
  const engine = await loadEngine();
  let initial = 1;
  const component = () => engine.useState(initial);

  const [, setValue] = renderPass(engine, component);
  setValue(7);
  initial = 999;

  assert.equal(renderPass(engine, component)[0], 7);
});

test("T-03: 0, false, empty string and null are not re-initialised", async () => {
  for (const kept of [0, false, "", null]) {
    const engine = await loadEngine();
    const component = () => engine.useState("initial");

    const [, setValue] = renderPass(engine, component);
    setValue(kept);

    assert.equal(renderPass(engine, component)[0], kept);
  }
});

test("T-03: setState(value) stores it and re-renders once", async () => {
  const engine = await loadEngine();
  let renders = 0;
  engine.setRenderer(() => renders++);

  const [, setCount] = renderPass(engine, () => engine.useState(0));
  setCount(5);

  assert.equal(renders, 1);
  assert.equal(renderPass(engine, () => engine.useState(0))[0], 5);
});

test("T-03: functional updater receives the previous value", async () => {
  const engine = await loadEngine();
  const component = () => engine.useState(1);

  const [, setCount] = renderPass(engine, component);
  setCount((previous) => previous + 1);

  assert.equal(renderPass(engine, component)[0], 2);
});

test("T-03: two functional updates in a row both apply", async () => {
  const engine = await loadEngine();
  const component = () => engine.useState(0);

  const [, setCount] = renderPass(engine, component);
  setCount((previous) => previous + 1);
  setCount((previous) => previous + 1);

  assert.equal(renderPass(engine, component)[0], 2);
});

test("T-03: same value does not re-render (Object.is)", async () => {
  const engine = await loadEngine();
  let renders = 0;
  engine.setRenderer(() => renders++);
  const list = ["Review PR"];

  const [[, setCount], [, setList], [, setNumber]] = renderPass(
    engine,
    () => [engine.useState(3), engine.useState(list), engine.useState(NaN)]
  );

  setCount(3);
  setCount((previous) => previous);
  setList(list);
  setNumber(NaN);

  assert.equal(renders, 0);
});

test("T-03: new array with same content does re-render", async () => {
  const engine = await loadEngine();
  let renders = 0;
  engine.setRenderer(() => renders++);

  const [list, setList] = renderPass(engine, () =>
    engine.useState(["Review PR"])
  );
  setList([...list]);

  assert.equal(renders, 1);
});

test("T-03: setter from an earlier pass updates its own slot", async () => {
  const engine = await loadEngine();
  const component = () => [engine.useState("a"), engine.useState("b")];

  const [, [, oldSetSecond]] = renderPass(engine, component);
  renderPass(engine, component);
  renderPass(engine, component);

  oldSetSecond("b2");

  const [[first], [second]] = renderPass(engine, component);

  assert.equal(first, "a");
  assert.equal(second, "b2");
});
