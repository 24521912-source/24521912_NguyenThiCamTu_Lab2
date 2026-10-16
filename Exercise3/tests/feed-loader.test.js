import test from "node:test";
import assert from "node:assert/strict";

import { loadFeed, LOAD_ERROR_MESSAGE } from "../src/feed-loader.js";
import { INITIAL_STATE, isViewState } from "../src/view-state.js";

const ITEMS_A = [{ id: "a", title: "A", summary: "old" }];
const ITEMS_B = [{ id: "b", title: "B", summary: "new" }];

// Minimal stand-in for useState: functional updater + history of states.
function makeStore(initial = INITIAL_STATE) {
  const history = [initial];
  const setState = (updater) => history.push(updater(history.at(-1)));
  return { history, setState, get: () => history.at(-1) };
}

// A Promise we resolve or reject by hand, to control completion order.
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// The loader logs failures with console.warn; keep test output clean.
test.beforeEach(() => {
  console.warn = () => {};
});

test("T-02: success goes IDLE -> LOADING -> SUCCESS", async () => {
  const store = makeStore();

  await loadFeed(store.get(), store.setState, async () => ITEMS_A);

  assert.deepEqual(
    store.history.map((state) => state.status),
    ["IDLE", "LOADING", "SUCCESS"]
  );
  assert.deepEqual(store.get().data, ITEMS_A);
});

test("T-02: failure goes to ERROR with the fixed message, never err.message", async () => {
  const store = makeStore();

  const result = loadFeed(store.get(), store.setState, async () => {
    throw new Error("HTTP 503 at /internal/feed\n    at stack line");
  });

  await assert.doesNotReject(result);
  assert.deepEqual(store.get(), { status: "ERROR", error: LOAD_ERROR_MESSAGE });
});

test("T-02: invalid data from the server ends in ERROR", async () => {
  const store = makeStore();

  await loadFeed(store.get(), store.setState, async () => "not an array");

  assert.equal(store.get().status, "ERROR");
});

test("T-02: Retry from ERROR goes through LOADING to SUCCESS", async () => {
  const store = makeStore();

  await loadFeed(store.get(), store.setState, async () => {
    throw new Error("down");
  });
  await loadFeed(store.get(), store.setState, async () => ITEMS_B);

  assert.deepEqual(
    store.history.map((state) => state.status),
    ["IDLE", "LOADING", "ERROR", "LOADING", "SUCCESS"]
  );
});

test("T-02: every stored state is a valid ViewState", async () => {
  const store = makeStore();

  await loadFeed(store.get(), store.setState, async () => ITEMS_A);
  await loadFeed(store.get(), store.setState, async () => {
    throw new Error("x");
  });

  assert.ok(store.history.every(isViewState));
});

// T-06: race conditions

test("T-06: START while LOADING does not call the fetcher again", async () => {
  const store = makeStore();
  const pending = deferred();
  let calls = 0;
  const fetcher = () => {
    calls++;
    return pending.promise;
  };

  const first = loadFeed(store.get(), store.setState, fetcher);
  const second = loadFeed(store.get(), store.setState, fetcher); // state is LOADING
  pending.resolve(ITEMS_A);
  await Promise.all([first, second]);

  assert.equal(calls, 1);
  assert.equal(store.get().status, "SUCCESS");
});

test("T-06: old request resolving after the new one does not overwrite it", async () => {
  const store = makeStore();
  const requestA = deferred();
  const requestB = deferred();
  const idle = store.get();

  // Both started from a stale IDLE view, so F6 does not block B; F7 must.
  const a = loadFeed(idle, store.setState, () => requestA.promise);
  const b = loadFeed(idle, store.setState, () => requestB.promise);

  requestB.resolve(ITEMS_B);
  await b;
  requestA.resolve(ITEMS_A);
  await a;

  assert.deepEqual(store.get(), { status: "SUCCESS", data: ITEMS_B });
});

// F4 alone cannot catch this: the stale result arrives while state is still LOADING.
test("T-06: old request finishing while the new one is loading is dropped", async () => {
  const store = makeStore();
  const requestA = deferred();
  const requestB = deferred();
  const idle = store.get();

  const a = loadFeed(idle, store.setState, () => requestA.promise);
  const b = loadFeed(idle, store.setState, () => requestB.promise);

  requestA.resolve(ITEMS_A);
  await a;
  assert.equal(store.get().status, "LOADING", "stale success must not land");

  requestB.resolve(ITEMS_B);
  await b;
  assert.deepEqual(store.get(), { status: "SUCCESS", data: ITEMS_B });
});

test("T-06: old request failing while the new one is loading is dropped", async () => {
  const store = makeStore();
  const requestA = deferred();
  const requestB = deferred();
  const idle = store.get();

  const a = loadFeed(idle, store.setState, () => requestA.promise);
  const b = loadFeed(idle, store.setState, () => requestB.promise);

  requestA.reject(new Error("stale failure"));
  await a;
  assert.equal(store.get().status, "LOADING", "stale error must not land");

  requestB.resolve(ITEMS_B);
  await b;
  assert.deepEqual(store.get(), { status: "SUCCESS", data: ITEMS_B });
});

test("T-06: old request failing after the new one succeeded is ignored", async () => {
  const store = makeStore();
  const requestA = deferred();
  const requestB = deferred();
  const idle = store.get();

  const a = loadFeed(idle, store.setState, () => requestA.promise);
  const b = loadFeed(idle, store.setState, () => requestB.promise);

  requestB.resolve(ITEMS_B);
  await b;
  requestA.reject(new Error("late failure"));
  await a;

  assert.deepEqual(store.get(), { status: "SUCCESS", data: ITEMS_B });
});

test("T-06: old request succeeding after the new one failed is ignored", async () => {
  const store = makeStore();
  const requestA = deferred();
  const requestB = deferred();
  const idle = store.get();

  const a = loadFeed(idle, store.setState, () => requestA.promise);
  const b = loadFeed(idle, store.setState, () => requestB.promise);

  requestB.reject(new Error("new failure"));
  await b;
  requestA.resolve(ITEMS_A);
  await a;

  assert.equal(store.get().status, "ERROR");
});
