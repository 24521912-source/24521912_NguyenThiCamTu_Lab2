/**
 * Exercise 3 - T-02: View State Machine (pure, no DOM)
 *
 * @typedef {{ id: string, title: string, summary: string }} FeedItem
 * @typedef {{ status: 'IDLE' } | { status: 'LOADING' }
 *   | { status: 'SUCCESS', data: FeedItem[] }
 *   | { status: 'ERROR', error: string }} ViewState
 * @typedef {{ type: 'START' } | { type: 'RESOLVE', data: FeedItem[] }
 *   | { type: 'REJECT', error: string }} FeedEvent
 */

export const STATUS = Object.freeze({
  IDLE: "IDLE",
  LOADING: "LOADING",
  SUCCESS: "SUCCESS",
  ERROR: "ERROR",
});

export const INITIAL_STATE = Object.freeze({ status: STATUS.IDLE });

const LOADING_STATE = Object.freeze({ status: STATUS.LOADING });

/**
 * Return the next state, or the same state object if the event is not
 * allowed from here (F4), so useState skips the re-render.
 * @param {ViewState} state
 * @param {FeedEvent} event
 * @returns {ViewState}
 */
export function transition(state, event) {
  switch (event?.type) {
    case "START":
      // F6: no second request while one is running.
      return state.status === STATUS.LOADING ? state : LOADING_STATE;

    case "RESOLVE":
      if (!Array.isArray(event.data)) {
        throw new TypeError("RESOLVE needs an array of feed items");
      }

      return state.status === STATUS.LOADING
        ? Object.freeze({
            status: STATUS.SUCCESS,
            data: Object.freeze([...event.data]),
          })
        : state;

    case "REJECT":
      if (typeof event.error !== "string" || event.error === "") {
        throw new TypeError("REJECT needs a non-empty error message");
      }

      return state.status === STATUS.LOADING
        ? Object.freeze({ status: STATUS.ERROR, error: event.error })
        : state;

    default:
      throw new TypeError(`Unknown event: ${event?.type}`);
  }
}

/**
 * F2: runtime check that a value is one of the four allowed shapes.
 */
export function isViewState(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const keys = Object.keys(value).sort().join();

  switch (value.status) {
    case STATUS.IDLE:
    case STATUS.LOADING:
      return keys === "status";
    case STATUS.SUCCESS:
      return keys === "data,status" && Array.isArray(value.data);
    case STATUS.ERROR:
      return (
        keys === "error,status" &&
        typeof value.error === "string" &&
        value.error !== ""
      );
    default:
      return false;
  }
}
