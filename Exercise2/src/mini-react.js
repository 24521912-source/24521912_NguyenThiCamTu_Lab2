
/**
 * Exercise 1 - Mini React VNode & Mounting Engine
 * T-01: Virtual DOM Factory
 * T-02: DOM Renderer
 * Exercise 2 - T-04: event props are handled by the root delegation hub
 */

const HTML_TAGS = new Set([
  "main",
  "header",
  "section",
  "h1",
  "h2",
  "h3",
  "p",
  "button",
  "div",
  "span",
  "ul",
  "li",
]);

// Handler props read by the delegation hub (src/events.js).
const EVENT_PROPS = new Set(["onClick", "onInput", "onKeydown"]);

const BUTTON_TYPES = new Set(["button", "submit", "reset"]);

function isValidHTMLType(type) {
  return typeof type === "string" && HTML_TAGS.has(type);
}

/**
 * T-01.1: Create a Text VNode.
 */
export function createTextElement(text) {
  if (
    typeof text !== "string" &&
    typeof text !== "number"
  ) {
    throw new TypeError("Text must be a string or number");
  }

  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: String(text),
      children: [],
    },
  };
}

/**
 * Validate a VNode recursively.
 * Internal helper, not an additional engine feature.
 */
function isValidVNode(value, ancestors = new Set()) {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    ancestors.has(value)
  ) {
    return false;
  }

  const { type, props } = value;

  if (
    props === null ||
    typeof props !== "object" ||
    Array.isArray(props) ||
    !Array.isArray(props.children)
  ) {
    return false;
  }

  if (type === "TEXT_ELEMENT") {
    return (
      typeof props.nodeValue === "string" &&
      props.children.length === 0
    );
  }

  if (!isValidHTMLType(type)) {
    return false;
  }

  ancestors.add(value);

  const valid = props.children.every((child) =>
    isValidVNode(child, ancestors)
  );

  ancestors.delete(value);

  return valid;
}

/**
 * T-01.2: Create an Element VNode.
 */
export function createElement(type, props, ...children) {
  if (!isValidHTMLType(type)) {
    throw new TypeError("Invalid HTML element type");
  }

  if (
    props != null &&
    (typeof props !== "object" || Array.isArray(props))
  ) {
    throw new TypeError("Props must be an object or null");
  }

  const normalizedProps = { ...(props ?? {}) };

  const normalizedChildren = children
    .flat(Infinity)
    .filter(
      (child) =>
        child !== null &&
        child !== undefined &&
        child !== false
    )
    .map((child) => {
      if (
        typeof child === "string" ||
        typeof child === "number"
      ) {
        return createTextElement(child);
      }

      if (isValidVNode(child)) {
        return child;
      }

      throw new TypeError("Invalid VNode child");
    });

  return {
    type,
    props: {
      ...normalizedProps,
      children: normalizedChildren,
    },
  };
}

/**
 * T-02: Convert a VNode into a native DOM Node.
 */
export function renderToDOM(vNode) {
  if (!isValidVNode(vNode)) {
    throw new TypeError("Invalid or malformed VNode");
  }

  return renderNode(vNode);
}

/**
 * Internal recursive renderer.
 */
function renderNode(vNode) {
  const { type, props } = vNode;

  // T-02.1: Text rendering
  if (type === "TEXT_ELEMENT") {
    return document.createTextNode(props.nodeValue);
  }

  // T-02.2: HTML element rendering
  const element = document.createElement(type);

  // T-04: the delegation hub finds handlers through this reference.
  element.__vnode = vNode;

  for (const [key, value] of Object.entries(props)) {
    if (key === "children") {
      continue;
    }

    if (key === "id" || key === "role" || key === "title") {
      if (typeof value !== "string") {
        throw new TypeError(`Invalid ${key} value`);
      }

      element.setAttribute(key, value);
      continue;
    }

    if (key === "className") {
      if (typeof value !== "string") {
        throw new TypeError("Invalid className");
      }

      element.setAttribute("class", value);
      continue;
    }

    if (key === "style") {
      if (
        value === null ||
        typeof value !== "object" ||
        Array.isArray(value)
      ) {
        throw new TypeError("Style must be an object");
      }

      for (const [property, cssValue] of Object.entries(value)) {
        if (
          !/^[a-zA-Z][a-zA-Z0-9]*$/.test(property) ||
          (typeof cssValue !== "string" &&
            typeof cssValue !== "number")
        ) {
          throw new TypeError("Invalid style property");
        }

        if (
          /url\s*\(|expression\s*\(|@import/i.test(
            String(cssValue)
          )
        ) {
          throw new TypeError("Unsafe CSS value");
        }

        element.style[property] = cssValue;
      }

      continue;
    }

    // T-04: no listener on the element; the root hub calls the handler.
    if (EVENT_PROPS.has(key)) {
      if (typeof value !== "function") {
        throw new TypeError(`${key} must be a function`);
      }

      continue;
    }

    if (key === "type") {
      if (type !== "button" || !BUTTON_TYPES.has(value)) {
        throw new TypeError("Invalid type value");
      }

      element.setAttribute("type", value);
      continue;
    }

    if (
      /^(aria-[a-z-]+|data-[a-z-]+)$/.test(key) &&
      (typeof value === "string" ||
        typeof value === "number")
    ) {
      element.setAttribute(key, String(value));
      continue;
    }

    throw new TypeError(`Unsupported DOM property: ${key}`);
  }

  // Render and append children in order
  for (const child of props.children) {
    element.appendChild(renderNode(child));
  }

  return element;
}
