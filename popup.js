document.addEventListener('DOMContentLoaded', () => {
  const startNewScriptButton = document.getElementById('startNewScript');

  startNewScriptButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'startNewScript' });
  });
});

document.getElementById('download-script').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'downloadScript' });
});