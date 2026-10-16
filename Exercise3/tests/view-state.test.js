import test from "node:test";
import assert from "node:assert/strict";

import {
  STATUS,
  INITIAL_STATE,
  transition,
  isViewState,
} from "../src/view-state.js";

const ITEMS = [{ id: "1", title: "Review PR", summary: "Check the diff" }];
const START = { type: "START" };
const RESOLVE = { type: "RESOLVE", data: ITEMS };
const REJECT = { type: "REJECT", error: "Network down" };

// One state of each kind, reached only through transition().
const idle = INITIAL_STATE;
const loading = transition(idle, START);
const success = transition(loading, RESOLVE);
const error = transition(loading, REJECT);

test("T-02: initial state is IDLE and frozen", () => {
  assert.deepEqual(INITIAL_STATE, { status: "IDLE" });
  assert.ok(Object.isFrozen(INITIAL_STATE));
});

test("T-02: IDLE + START -> LOADING", () => {
  assert.deepEqual(loading, { status: "LOADING" });
});

test("T-02: LOADING + RESOLVE -> SUCCESS with the data", () => {
  assert.deepEqual(success, { status: "SUCCESS", data: ITEMS });
});

test("T-02: LOADING + RESOLVE([]) -> SUCCESS with empty data", () => {
  assert.deepEqual(transition(loading, { type: "RESOLVE", data: [] }), {
    status: "SUCCESS",
    data: [],
  });
});

test("T-02: LOADING + REJECT -> ERROR with the message", () => {
  assert.deepEqual(error, { status: "ERROR", error: "Network down" });
});

test("T-02: Retry (ERROR + START) and Reload (SUCCESS + START) -> LOADING", () => {
  assert.equal(transition(error, START).status, STATUS.LOADING);
  assert.equal(transition(success, START).status, STATUS.LOADING);
});

test("T-02: disallowed transitions return the same object", () => {
  const ignored = [
    [idle, RESOLVE],
    [idle, REJECT],
    [loading, START],
    [success, RESOLVE],
    [success, REJECT],
    [error, RESOLVE],
    [error, REJECT],
  ];

  for (const [state, event] of ignored) {
    assert.strictEqual(
      transition(state, event),
      state,
      `${state.status} + ${event.type}`
    );
  }
});

test("T-02: invalid events throw TypeError", () => {
  const invalid = [
    undefined,
    {},
    { type: "FINISH" },
    { type: "RESOLVE", data: "items" },
    { type: "RESOLVE" },
    { type: "REJECT", error: "" },
    { type: "REJECT", error: new Error("x") },
  ];

  for (const event of invalid) {
    assert.throws(() => transition(loading, event), TypeError);
  }
});

test("T-02: transition does not mutate input; states are frozen", () => {
  const data = [...ITEMS];
  const result = transition(loading, { type: "RESOLVE", data });

  assert.deepEqual(loading, { status: "LOADING" });
  assert.notStrictEqual(result.data, data);
  assert.ok(Object.isFrozen(result) && Object.isFrozen(result.data));
  assert.ok(Object.isFrozen(error) && Object.isFrozen(loading));
});

test("T-02: isViewState accepts the four shapes", () => {
  for (const state of [idle, loading, success, error]) {
    assert.ok(isViewState(state), state.status);
  }
});

test("T-02: isViewState rejects invalid shapes", () => {
  const invalid = [
    null,
    [],
    "IDLE",
    { status: "DONE" },
    { status: "SUCCESS" },
    { status: "SUCCESS", data: "x" },
    { status: "ERROR" },
    { status: "ERROR", error: "" },
    { status: "LOADING", data: [] },
    { status: "IDLE", isLoading: true },
  ];

  for (const value of invalid) {
    assert.equal(isViewState(value), false, JSON.stringify(value));
  }
});
