/**
 * Exercise 3 - T-02 / T-06: Async feed loader with stale-response guard
 */

import { STATUS, transition } from "./view-state.js";

// F8: fixed, user-facing text. Technical details stay in the console.
export const LOAD_ERROR_MESSAGE =
  "We couldn't load the feed. Check your connection, then select Retry Connection.";

// F7: id of the most recent request. Only that request may update state.
let latestRequestId = 0;

/**
 * Run one load: IDLE/SUCCESS/ERROR -> LOADING -> SUCCESS | ERROR.
 * Never rejects; every failure ends in the ERROR state.
 * @param {import("./view-state.js").ViewState} state  state seen by the caller
 * @param {(updater: Function) => void} setState       useState setter
 * @param {() => Promise<unknown>} fetcher             e.g. () => fetchFeed({ mode })
 */
export async function loadFeed(state, setState, fetcher) {
  // F6: a request is already running, do not start a second one.
  if (state.status === STATUS.LOADING) {
    return;
  }

  const requestId = ++latestRequestId;
  setState((current) => transition(current, { type: "START" }));

  try {
    const data = await fetcher();

    // F7: a newer request was started, drop this result.
    if (requestId !== latestRequestId) {
      return;
    }

    // Non-array data makes transition() throw, which lands in catch -> ERROR.
    setState((current) => transition(current, { type: "RESOLVE", data }));
  } catch (error) {
    if (requestId !== latestRequestId) {
      return;
    }

    console.warn("Feed request failed:", error);
    setState((current) =>
      transition(current, { type: "REJECT", error: LOAD_ERROR_MESSAGE })
    );
  }
}
