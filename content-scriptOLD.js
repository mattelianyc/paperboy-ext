function getPath(element) {
  if (!element) {
    return '';
  }

  let path = [];

  while (element.nodeType === Node.ELEMENT_NODE) {
    let selector = element.nodeName.toLowerCase();

    const stableAttributes = ['role', 'type', 'placeholder'];
    Array.from(element.attributes).forEach((attr) => {
      if (stableAttributes.includes(attr.name)) {
        selector += `[${attr.name}="${attr.value}"]`;
      }
    });

    path.unshift(selector);
    element = element.parentNode;
  }

  return path.join(' > ');
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
let lastScrollPosition = { x: 0, y: 0 };
let scrollTimeout;

function handleEvent(event) {

  if (window.location.pathname !== currentUrlPath) {
    // URL path has changed, wait for page to fully load before continuing
    puppeteerLines = 'await page.waitForNavigation({ waitUntil: "networkidle0" });\n';
    console.log(puppeteerLines); // log the generated puppeteer line to check if it's correct
    chrome.runtime.sendMessage({ action: 'recordEvent', data: null, puppeteerLine: puppeteerLines }, function(response) {
      console.log('Response:', response); // log the response from the receiving function to check if it's processing the message correctly
    });
    // Update the current URL path
    currentUrlPath = window.location.pathname;
  }

  const eventData = {
    type: event.type,
    target: {
      tagName: event.target.tagName,
      id: event.target.id,
      className: event.target.className,
      querySelector: getPath(event.target),
    },
  };

  let puppeteerLines = '';
  let actionDescription = '';
  
  // function addScrollLine() {
  //   const scrollLines = `await page.evaluate(() => {
  //     window.scrollTo(${lastScrollPosition.x}, ${lastScrollPosition.y});
  //   });\n`;
  //   puppeteerLines += scrollLines;
  // }
  
  if (event.type === 'click') {
    // Describe the click action
    actionDescription = `// User clicks on the element${eventData.target.id ? ' with ID "' + eventData.target.id + '"' : ''}\n`;
    // Generate the 'waitForSelector' and 'click' lines for the click event
    const waitForSelectorLine = `await page.waitForSelector('${eventData.target.querySelector}');\n`;
    const clickLine = `await page.click('${eventData.target.querySelector}');\n`;
    // Add a 1500ms wait time after the click event
    const waitFor = 'await page.waitFor(1500);\n';
    puppeteerLines = actionDescription + waitForSelectorLine + clickLine + waitFor;
  } else if (event.type === 'change' && event.target.tagName.toLowerCase() === 'input') {
    // Describe the input action
    actionDescription = `// User types "${event.target.value}" into the input element${eventData.target.id ? ' with ID "' + eventData.target.id + '"' : ''}\n`;

    // Generate the 'waitForSelector' line for the input event
    const waitForSelectorLine = `await page.waitForSelector('${eventData.target.querySelector}');\n`;

    // Generate human-like typing lines for the input event
    let inputLines = '';
    for (const char of event.target.value) {
      const delay = getRandomDelay(50, 150); // Random delay between 50ms to 150ms
      inputLines += `await page.type('${eventData.target.querySelector}', '${char}', { delay: ${delay} });\n`;
    }

    puppeteerLines = actionDescription + waitForSelectorLine + inputLines;
  }
  // else if (event.type === 'scroll') {
  //   // User scrolls the window or document
  //   actionDescription = '// User scrolls the window or document\n';
  //   // Get the current scroll position
  //   const scrollX = window.scrollX;
  //   const scrollY = window.scrollY;
  //   // Update the last scroll position
  //   lastScrollPosition = { x: scrollX, y: scrollY };
  
  //   // Clear any existing scroll timeout
  //   clearTimeout(scrollTimeout);
  //   // Set a new timeout to add the scroll line after a delay
  //   scrollTimeout = setTimeout(() => {
  //     addScrollLine();
  //     if (puppeteerLines) {
  //       chrome.runtime.sendMessage({ action: 'recordEvent', data: eventData, puppeteerLine: puppeteerLines });
  //     }
  //   }, 300); // Wait 300ms before executing the function
  else if (event.type === 'mousemove') {
    const x = event.clientX;
    const y = event.clientY;

    if (!mouseStartedMoving) {
      mouseStartedMoving = true;
    } else {
      endingCoordinates = [x, y];
      mouseStoppedMoving = true;
    }

    console.log('Mouse coordinates:', x, y);
  }

  if (eventData && puppeteerLines) {
    chrome.runtime.sendMessage({ action: 'recordEvent', data: eventData, puppeteerLine: puppeteerLines });
  }

  clearTimeout(movementTimeout);
  movementTimeout = setTimeout(() => {
    if (mouseStartedMoving && mouseStoppedMoving) {
      // Describe the mouse movement action
      actionDescription = `//cursor::[${endingCoordinates[0]},${endingCoordinates[1]}]\n`;
      // Reset the mouse movement tracking variables
      mouseStartedMoving = false;
      mouseStoppedMoving = false;

      chrome.runtime.sendMessage({ action: 'recordEvent', data: null, puppeteerLine: actionDescription });
    }
  }, 500); // 100ms without a new mousemove event is considered the end of the movement

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