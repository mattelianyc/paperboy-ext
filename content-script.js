function getPath(element) {
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
  const waitForSelectorLine = `await page.waitForSelector('${eventData.target.querySelector}');\n`;
  const moveLine = `await cursor.move('${eventData.target.querySelector}');\n`;
  const clickLine = `await cursor.click('${eventData.target.querySelector}');\n`;

  return actionDescription + waitForSelectorLine + moveLine + clickLine;
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
  const waitForSelectorLine = `await page.waitForSelector('${eventData.target.querySelector}');\n`;

  let inputLines = '';
  for (const char of event.target.value) {
    const delay = getRandomDelay(50, 150); // Random delay between 50ms to 150ms
    inputLines += `await page.type('${eventData.target.querySelector}', '${char}', { delay: ${delay} });\n`;
  }

  return actionDescription + waitForSelectorLine + inputLines;
}

// Add the 'handleScrollEvent' function
function handleScrollEvent(event) {
  // Logic for the 'scroll' event handling
  const x = window.pageXOffset || document.documentElement.scrollLeft;
  const y = window.pageYOffset || document.documentElement.scrollTop;

  // const actionDescription = `//scroll::[${x},${y}]\n`;
  const scrollLines = `await page.evaluate(() => {window.scrollTo(0, ${y});});\n`;

  return scrollLines;
}
// Add the 'handleMouseMoveEvent' function
function handleMouseMoveEvent(event) {
  // Logic for the 'mousemove' event handling
  const x = event.clientX;
  const y = event.clientY;

  // const actionDescription = `//mouse::[${x},${y}];\n`;

  return;
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
  }

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
    'scroll', 'resize'
  ];

  events.forEach(eventType => {
    document.addEventListener(eventType, handleEvent, true);
  });
}

// Start monitoring all events
monitorAllEvents();