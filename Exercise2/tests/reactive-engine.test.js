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
