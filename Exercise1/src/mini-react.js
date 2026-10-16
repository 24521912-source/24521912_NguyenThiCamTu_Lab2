
/**
 * T-01: Virtual DOM Factory
 * Exercise 1 - Mini React Engine
 */

/**
 * Convert a string or number into a Text VNode.
 *
 * @param {string | number} text
 * @returns {object}
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
 * Check whether a value is a valid VNode.
 *
 * This helper is private to the module.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
function isValidVNode(value) {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
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

  return (
    typeof type === "string" &&
    /^[a-z][a-z0-9-]*$/.test(type)
  );
}

/**
 * Create an Element VNode.
 *
 * @param {string} type
 * @param {object | null | undefined} props
 * @param {...unknown} children
 * @returns {object}
 */
export function createElement(type, props, ...children) {
  // 1. Validate HTML element type
  if (
    typeof type !== "string" ||
    !/^[a-z][a-z0-9-]*$/.test(type)
  ) {
    throw new TypeError("Invalid HTML element type");
  }

  // 2. Validate props
  if (
    props != null &&
    (
      typeof props !== "object" ||
      Array.isArray(props)
    )
  ) {
    throw new TypeError("Props must be an object or null");
  }

  // 3. Normalize props without mutation
  const normalizedProps = { ...(props ?? {}) };

  // 4. Flatten nested children arrays
  const flatChildren = children.flat(Infinity);

  // 5. Remove ignored children
  const filteredChildren = flatChildren.filter(
    (child) =>
      child !== null &&
      child !== undefined &&
      child !== false
  );

  // 6. Normalize and validate children
  const normalizedChildren = filteredChildren.map(
    (child) => {
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
    }
  );

  // 7. Return a new VNode
  return {
    type,
    props: {
      ...normalizedProps,
      children: normalizedChildren,
    },
  };
}
