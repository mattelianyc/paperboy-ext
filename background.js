let puppeteerScript = '';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'recordEvent') {
    console.log('Event recorded:', request.data);
    puppeteerScript += request.puppeteerLine;
  } else if (request.action === 'startNewScript') {
    puppeteerScript = '';
    console.log('Started a new script');
  } else if (request.action === 'downloadScript') {
    downloadPuppeteerScript(puppeteerScript);
  }
});

function downloadPuppeteerScript(script) {
  const scriptContent = [
    "",
    '',
    script,
    '',
  ].join('\n');

  const blob = new Blob([scriptContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = 'generated-puppeteer-script.js';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}
