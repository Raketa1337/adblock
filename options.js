chrome.storage.local.get(["apiKey"], (data) => {
  if (data.apiKey) document.getElementById("key").value = data.apiKey;
});

document.getElementById("save").addEventListener("click", () => {
  const key = document.getElementById("key").value.trim();
  chrome.storage.local.set({ apiKey: key }, () => {
    const status = document.getElementById("status");
    status.textContent = "Сохранено!";
    setTimeout(() => (status.textContent = ""), 2000);
  });
});
