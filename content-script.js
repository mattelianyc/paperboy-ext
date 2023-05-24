// utils.js
function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function getPath(element) {
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

function handleClickEvent(event) {
  const eventData = {
    type: event.type,
    target: {
      id: event.target.id,
      tagName: event.target.tagName,
      querySelector: getPath(event.target),
    },
  };

  const actionDescription = `// User clicks on the element${eventData.target.id ? ' with ID "' + eventData.target.id + '"' : ''}\n`;
  const waitForSelectorLine = `try {
    let selector = await page.waitForSelector(\`${eventData.target.querySelector}\`, { timeout: 3000 });
    await cursor.move(\`${eventData.target.querySelector}\`);
    await cursor.click();
  } catch (error) {
    // Fallback to using x and y coordinates if selector is not found
    const x = ${event.clientX};
    const y = ${event.clientY};
    await cursor.moveTo({x:x,y:y});
    await cursor.click();
  }\n`;
  
  
  const waitForIdleLine = `await page.waitForFunction(() => {return (document.readyState === 'complete');});\n`;

  return actionDescription + waitForSelectorLine + waitForIdleLine;
}

function handleChangeEvent(event) {
  const eventData = {
    type: event.type,
    target: {
      id: event.target.id,
      tagName: event.target.tagName,
      querySelector: getPath(event.target),
    },
  };

  const actionDescription = `// User types "${event.target.value}" into the input element${eventData.target}\n`;
  const waitForSelectorLine = `await page.waitForSelector(\`${eventData.target.querySelector}\`);\n`;

  let inputLines = '';
  for (const char of event.target.value) {
    const delay = getRandomDelay(50, 150); // Random delay between 50ms to 150ms
    inputLines += `await page.type('${eventData.target.querySelector}', '${char}', { delay: ${delay} });\n`;
  }

  return actionDescription + waitForSelectorLine + inputLines;
}

function handleScrollEvent(event) {
  // Logic for the 'scroll' event handling
  const x = window.pageXOffset || document.documentElement.scrollLeft;
  const y = window.pageYOffset || document.documentElement.scrollTop;

  // const actionDescription = `//scroll::[${x},${y}]\n`;
  const scrollLines = `await page.evaluate(() => {window.scrollTo(0, ${y});});\n`;

  return scrollLines;
}

function handleMouseMoveEvent(event) {
  // Logic for the 'mousemove' event handling
  const x = event.clientX;
  const y = event.clientY;

  // const actionDescription = `//mouse::[${x},${y}];\n`;

  return;
}

function handlePopStateEvent(event) {
  const actionDescription = `// User navigates to "${document.location}"\n`;
  const waitForNavigationLine = `await page.waitForNavigation({ waitUntil: 'domcontentloaded' });\n`;
  return actionDescription + waitForNavigationLine;
}

function handleKeyEvent(event) {
  const eventData = {
    type: event.type,
    target: {
      id: event.target.id,
      tagName: event.target.tagName,
      querySelector: getPath(event.target),
    },
  };

  const actionDescription = `// User types "${event.key}" into the input element${eventData.target}\n`;
  const waitForSelectorLine = `await page.waitForSelector(\`${eventData.target.querySelector}\`);\n`;

  let inputLines = '';
  const delay = getRandomDelay(50, 150); // Random delay between 50ms to 150ms
  inputLines += `await page.type('${eventData.target.querySelector}', '${event.key}', { delay: ${delay} });\n`;

  return actionDescription + waitForSelectorLine + inputLines;
}

function handleSubmitEvent(event) {
  const eventData = {
    type: event.type,
    target: {
      id: event.target.id,
      tagName: event.target.tagName,
      querySelector: getPath(event.target),
    },
  };

  const actionDescription = `// User submits the form${eventData.target.id ? ' with ID "' + eventData.target.id + '"' : ''}\n`;
  const waitForSelectorLine = `await page.waitForSelector(\`${eventData.target.querySelector}\`);\n`;
  const submitLine = `await page.submit('${eventData.target.querySelector}');\n`;

  return actionDescription + waitForSelectorLine + submitLine;
}

function handleFocusEvent(event) {
  const eventData = {
    type: event.type,
    target: {
      id: event.target.id,
      tagName: event.target.tagName,
      querySelector: getPath(event.target),
    },
  };

  const actionDescription = `// User focuses on the element${eventData.target.id ? ' with ID "' + eventData.target.id + '"' : ''}\n`;
  const waitForSelectorLine = `await page.waitForSelector(\`${eventData.target.querySelector}\`);\n`;
  const focusLine = `await page.focus('${eventData.target.querySelector}');\n`;

  return actionDescription + waitForSelectorLine + focusLine;
}

function handleEvent(event) {
  let puppeteerLines = '';

  if (event.type === 'click') {
    puppeteerLines = handleClickEvent(event);
  } else if (event.type === 'change' && event.target.tagName.toLowerCase() === 'input') {
    puppeteerLines = handleChangeEvent(event);
  } else if (event.type === 'scroll') {
    puppeteerLines = handleScrollEvent(event);
  } else if (event.type === 'mousemove') {
    puppeteerLines = handleMouseMoveEvent(event);
  } else if (event.type === 'popstate') {
    puppeteerLines = handlePopStateEvent(event);
  }
  //  else if (event.type === 'submit') {
  //   puppeteerLines = handleSubmitEvent(event);
  // }

  if (puppeteerLines) {
    chrome.runtime.sendMessage({ action: 'recordEvent', data: null, puppeteerLine: puppeteerLines });
  }
}

/**
 * Start monitoring all events.
 */
function monitorAllEvents() {
  const events = [
    'mousedown', 'mouseup', 'click', 'dblclick',
    'mousemove', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave',
    'keydown', 'keypress', 'keyup',
    'submit', 'change', 'focus', 'blur',
    'scroll', 'resize',
    'popstate' // Add the 'popstate' event here
  ];

  events.forEach(eventType => {
    document.addEventListener(eventType, handleEvent, true);
  });

  // Monitor URL changes using MutationObserver
  const urlObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'href') {
        // Trigger handleEvent with a custom popstate event when URL changes
        handleEvent(new CustomEvent('popstate'));
      }
    });
  });

  // Observe changes to the window.location object
  urlObserver.observe(window.location, { attributes: true, attributeFilter: ['href'] });
}
// Start monitoring all events
monitorAllEvents();
