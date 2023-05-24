export function getPath(element) {
  function getPathSegment(el) {
    const siblings = Array.from(el.parentNode.children);
    const sameTagSiblings = siblings.filter(sibling => sibling.tagName === el.tagName);
    const index = siblings.indexOf(el) + 1;

    let segment = el.tagName.toLowerCase();
    if (sameTagSiblings.length > 1) {
      segment += `:nth-child(${index})`;
    }

    // Add other attributes if available
    const attributes = ['type', 'name', 'href', 'alt', 'title'].filter(attr => el.hasAttribute(attr));
    if (attributes.length > 0) {
      segment += attributes.map(attr => `[${attr}="${el.getAttribute(attr)}"]`).join('');
    }

    return segment;
  }

  const path = [];
  let currentElement = element;
  while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
    path.unshift(getPathSegment(currentElement));
    currentElement = currentElement.parentNode;
  }

  return path.join(' > ');
}

/**
 * Generates a random delay between min and max values (inclusive).
 *
 * @param {number} min - The minimum delay value.
 * @param {number} max - The maximum delay value.
 * @returns {number} - A random delay value between min and max.
 */

export function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}