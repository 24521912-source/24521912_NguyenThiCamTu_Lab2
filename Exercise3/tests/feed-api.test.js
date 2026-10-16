import test from "node:test";
import assert from "node:assert/strict";

import { fetchFeed } from "../src/feed-api.js";
import { INITIAL_STATE, transition, isViewState } from "../src/view-state.js";

test("T-02: success returns valid feed items with unique ids", async () => {
  const items = await fetchFeed({ delayMs: 0 });

  assert.ok(items.length > 0);

  for (const item of items) {
    assert.deepEqual(Object.keys(item).sort(), ["id", "summary", "title"]);
    assert.ok(Object.values(item).every((value) => typeof value === "string"));
  }

  assert.equal(new Set(items.map((item) => item.id)).size, items.length);
});

test("T-02: success data fits the SUCCESS state", async () => {
  const data = await fetchFeed({ delayMs: 0 });
  const loading = transition(INITIAL_STATE, { type: "START" });

  assert.ok(isViewState(transition(loading, { type: "RESOLVE", data })));
});

test("T-02: empty mode resolves with an empty array", async () => {
  assert.deepEqual(await fetchFeed({ mode: "empty", delayMs: 0 }), []);
});

test("T-02: error mode rejects with an Error", async () => {
  await assert.rejects(fetchFeed({ mode: "error", delayMs: 0 }), {
    name: "Error",
    message: /network failure/,
  });
});

test("T-02: invalid options reject with TypeError", async () => {
  for (const options of [{ mode: "slow" }, { delayMs: -1 }, { delayMs: "5" }]) {
    await assert.rejects(fetchFeed(options), TypeError);
  }
});

test("T-02: each call returns fresh copies", async () => {
  const first = await fetchFeed({ delayMs: 0 });
  first[0].title = "changed";
  first.pop();

  const second = await fetchFeed({ delayMs: 0 });

  assert.notEqual(second[0].title, "changed");
  assert.equal(second.length, first.length + 1);
});

test("T-02: resolves only after the delay", async () => {
  const startedAt = Date.now();
  await fetchFeed({ delayMs: 30 });

  // Timers may fire a millisecond early on some platforms.
  assert.ok(Date.now() - startedAt >= 25);
});

test("T-02: feed contains the XSS probe as plain data", async () => {
  const items = await fetchFeed({ delayMs: 0 });

  assert.ok(items.some((item) => item.title.includes("<img")));
});
