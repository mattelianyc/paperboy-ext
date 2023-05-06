export function getPath(element) {
  if (!element) {
    return '';
  }

  let path = [];

  while (element.nodeType === Node.ELEMENT_NODE) {
    let selector = element.nodeName.toLowerCase();

    const stableAttributes = ['id', 'role', 'type', 'placeholder'];
    Array.from(element.attributes).forEach((attr) => {
      if (stableAttributes.includes(attr.name)) {
        selector += `[${attr.name}="${attr.value}"]`;
      }
    });

    if (element === document.body) {
      path.unshift(selector);
      break;
    }

    let index = 1;
    let sibling = element.previousSibling;
    while (sibling) {
      if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === element.nodeName) {
        index++;
      }
      sibling = sibling.previousSibling;
    }

    if (index > 1) {
      selector += `:nth-of-type(${index})`;
    }

    path.unshift(selector);
    element = element.parentNode;
  }

  return path.slice(-5).join(' > ');
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