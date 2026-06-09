const indicator = document.createElement('div');
indicator.id = 'stealth-tracker-dot';
indicator.style.cssText = `
  position: fixed;
  top: 5px;
  right: 5px;
  width: 3px;
  height: 3px;
  background-color: #555555;
  opacity: 0.3;
  z-index: 2147483647;
  pointer-events: none;
  border-radius: 50%;
`;
document.documentElement.appendChild(indicator);

function setIndicatorColor(color) {
  if (indicator) indicator.style.backgroundColor = color;
}

let mouseX = 0;
let mouseY = 0;
window.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_CAPTURE") {
    setIndicatorColor('#D4AC0D'); // Желтый — скриншот сделан и ушел в Claude
    if (sendResponse) sendResponse();
    return true;
  }

  if (message.type === "SHOW_ANSWER") {
    setIndicatorColor('#229954'); // Зеленый — Claude прислал ответ
    showMicroBadge(message.answer);
    if (sendResponse) sendResponse();
    return true;
  }
});

function showMicroBadge(msg) {
  const old = document.getElementById("text-explainer-micro-badge");
  if (old) old.remove();

  const badge = document.createElement("div");
  badge.id = "text-explainer-micro-badge";
  badge.textContent = msg;

  badge.style.cssText = `
    position: fixed;
    left: ${mouseX + 12}px;
    top: ${mouseY + 12}px;
    color: #555555;
    background: transparent;
    font-family: monospace;
    font-size: 11px;
    opacity: 0.35;
    z-index: 2147483647;
    pointer-events: none;
    user-select: none;
    border: none;
    padding: 0;
    margin: 0;
  `;

  document.body.appendChild(badge);

  setTimeout(() => {
    if (badge.parentNode) badge.remove();
    setIndicatorColor('#555555'); // Снова серый в углу
  }, 3500);
}