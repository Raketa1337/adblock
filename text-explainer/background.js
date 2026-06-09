// Фоновый скрипт: захват экрана и отправка на шлюз FreeAI (модель Opus)
const CUSTOM_API_KEY = "fe_oa_782e7a51904ec3274a03910bc3e5cf6304b9a3bc582561de"; 

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "ask-ai") return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  try {
    await chrome.tabs.sendMessage(tab.id, { type: "START_CAPTURE" });
  } catch (e) {
    return; 
  }

  // Делаем скриншот видимой области экрана
  chrome.tabs.captureVisibleTab(tab.windowId, { format: "jpeg", quality: 80 }, async (dataUrl) => {
    if (!dataUrl) return;

    const base64Data = dataUrl.split(",")[1];

    try {
      const answer = await askCustomGateway(CUSTOM_API_KEY, base64Data);
      chrome.tabs.sendMessage(tab.id, { type: "SHOW_ANSWER", answer: answer });
    } catch (e) {
      // Глушим ошибки сети для беспалевности
    }
  });
});

async function askCustomGateway(apiKey, base64Image) {
  // Базовый эндпоинт для OpenAI-совместимого шлюза FreeAI
  const url = "https://api.freeopenai.xyz/v1/chat/completions"; 

  // Форматируем картинку в DataURL для передачи внутри JSON
  const dataUrlFormatted = `data:image/jpeg;base64,${base64Image}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      // Прописываем идентификатор Opus для данного шлюза
      model: "claude-opus", 
      max_tokens: 25,
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Ты — встроенный модуль верификации тестов. На присланном скриншоте найди тестовое задание. Вычисли правильный ответ. Выведи СТРОГО 1-2 главных ключевых слова или число, однозначно указывающее на правильный вариант. Запрещено писать развернутые предложения, знаки препинания, союзы или давать объяснения. Выдай чистый ультра-короткий маркер ответа на языке оригинала задания."
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrlFormatted
              }
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error("Gateway API Error");
  }

  const json = await response.json();
  
  if (json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content) {
    return json.choices[0].message.content.trim();
  }
  
  return "Error";
}