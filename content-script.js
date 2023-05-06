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

const events = [
  'mousedown', 'mouseup', 'click', 'dblclick',
  'mousemove', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave',
  'keydown', 'keypress', 'keyup',
  'submit', 'change', 'focus', 'blur',
  'scroll', 'resize'
];

let mouseMoveCoordinates = [];
let lastMouseMoveCoordinates = [];
let mouseStartedMoving = false;
let mouseStoppedMoving = false;
let movementTimeout;
let currentUrlPath = window.location.pathname;
let scrollStarted = false;
let scrollStopped = false;
let endingScrollPosition = { x: 0, y: 0 };
let scrollTimeout;

function handleEvent(event) {

  if (window.location.pathname !== currentUrlPath) {
    console.log('page changed');
    // URL path has changed, wait for page to fully load before continuing
    puppeteerLines = 'await page.waitForNavigation({ waitUntil: "networkidle0" });\n';
    console.log(puppeteerLines); // log the generated puppeteer line to check if it's correct
    chrome.runtime.sendMessage({ action: 'recordEvent', data: null, puppeteerLine: puppeteerLines }, function(response) {
      console.log('Response:', response); // log the response from the receiving function to check if it's processing the message correctly
    });
    currentUrlPath = window.location.pathname;
  }

  const eventData = {
    type: event.type,
    target: {
      id: event.target.id,
      tagName: event.target.tagName,
      // className: filterClassNames(event.target.classList),
      querySelector: getPath(event.target),
    },
  };  

  let puppeteerLines = '';
  let actionDescription = '';

  if (event.type === 'click') {
    // Describe the click action
    actionDescription = `// User clicks on the element${eventData.target.id ? ' with ID "' + eventData.target.id + '"' : ''}\n`;
    // Generate the 'waitForSelector' and 'click' lines for the click event
    const waitForSelectorLine = `await page.waitForSelector('${eventData.target.querySelector}');\n`;
    const moveLine = `await cursor.move('${eventData.target.querySelector}');\n`;
    const clickLine = `await cursor.click('${eventData.target.querySelector}');\n`;
    // Add a 1500ms wait time after the click event
    puppeteerLines = actionDescription + waitForSelectorLine + moveLine + clickLine;
  } else if (event.type === 'change' && event.target.tagName.toLowerCase() === 'input') {
    // Describe the input action
    actionDescription = `// User types "${event.target.value}" into the input element${eventData.target}\n`;
    // Generate the 'waitForSelector' line for the input event
    const waitForSelectorLine = `await page.waitForSelector('${eventData.target.querySelector}');\n`;
    // Generate human-like typing lines for the input event
    let inputLines = '';
    for (const char of event.target.value) {
      const delay = getRandomDelay(50, 150); // Random delay between 50ms to 150ms
      inputLines += `await page.type('${eventData.target.querySelector}', '${char}', { delay: ${delay} });\n`;
    }
    puppeteerLines = actionDescription + waitForSelectorLine + inputLines;
  } else if (event.type === 'scroll') {
    
    const x = window.pageXOffset || document.documentElement.scrollLeft;
    const y = window.pageYOffset || document.documentElement.scrollTop;
    if (!scrollStarted) {
      scrollStarted = true;
    } else {
      endingScrollPosition = { x, y };
      scrollStopped = true;
    }
    console.log('scroll coordinates:', x, y);
  } else if (event.type === 'mousemove') {
    const x = event.clientX;
    const y = event.clientY;
    if (!mouseStartedMoving) {
      mouseStartedMoving = true;
    } else {
      lastMouseMoveCoordinates = [x, y];
      mouseStoppedMoving = true;
    }
    console.log('mouse coordinates:', x, y);
  }
  
  if (eventData && puppeteerLines) {
    chrome.runtime.sendMessage({ action: 'recordEvent', data: eventData, puppeteerLine: puppeteerLines });
  }
  
  clearTimeout(movementTimeout);
  movementTimeout = setTimeout(() => {
    if (mouseStartedMoving && mouseStoppedMoving) {
      // Describe the mouse movement action
      actionDescription = `//mouse::[${lastMouseMoveCoordinates[0]},${lastMouseMoveCoordinates[1]}];\n`
      // Reset the mouse movement tracking variables
      mouseStartedMoving = false;
      mouseStoppedMoving = false;
      chrome.runtime.sendMessage({ action: 'recordEvent', data: null, puppeteerLine: actionDescription });
    }
    if (scrollStarted && scrollStopped) {
      // Describe the scroll action
      actionDescription = `//scroll::[${endingScrollPosition.x},${endingScrollPosition.y}]\n`;
      // Reset the scroll tracking variables
      scrollStarted = false;
      scrollStopped = false;
      const scrollLines = `await page.evaluate(() => {window.scrollTo(0, ${endingScrollPosition.y});});\n`;
      puppeteerLines += scrollLines;
      chrome.runtime.sendMessage({ action: 'recordEvent', data: null, puppeteerLine: actionDescription + puppeteerLines });
    }
  }, 150); // 100ms without a new event is considered the end of the movement
  
}
  
function monitorAllEvents() {
  events.forEach(eventType => {
    document.addEventListener(eventType, handleEvent, true);
  });
}

// Start monitoring all events
monitorAllEvents();

function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}