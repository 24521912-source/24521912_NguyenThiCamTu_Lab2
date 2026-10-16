/**
 * Exercise 2 - T-04: Root Event Delegation Hub
 */

// Native event type -> VNode handler prop.
const SUPPORTED_EVENTS = {
  click: "onClick",
  input: "onInput",
  keydown: "onKeydown",
};

// Roots that already have listeners, so a second call adds nothing.
const delegatedRoots = new WeakSet();

/**
 * Attach one listener per supported event type to the root container.
 * Events bubble up to the root; the hub walks from event.target up to the root
 * and calls the first matching handler found in the VNode props.
 */
export function setupEventDelegation(rootContainer) {
  if (!(rootContainer instanceof Element)) {
    throw new TypeError("Root container must be a DOM element");
  }

  if (delegatedRoots.has(rootContainer)) {
    return;
  }

  delegatedRoots.add(rootContainer);

  for (const [eventType, handlerProp] of Object.entries(SUPPORTED_EVENTS)) {
    rootContainer.addEventListener(eventType, (nativeEvent) => {
      let target = nativeEvent.target;

      while (target && target !== rootContainer) {
        const handler = target.__vnode?.props[handlerProp];

        if (typeof handler === "function") {
          handler(nativeEvent);
          return;
        }

        target = target.parentElement;
      }
    });
  }
}
