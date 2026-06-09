// Фоновый скрипт: делает скриншот и отправляет в Gemini AI Studio
const GEMINI_API_KEY = "AQ.Ab8RN6Ku0exg5FLEYLLQKghO2IFTdyhNPrgJU2rP74HMUYAmYA"; 

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "ask-ai") return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  // 1. Командуем контентному скрипту включить желтый огонек (процесс пошел)
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "START_CAPTURE" });
  } catch (e) {
    return; // Игнорируем служебные страницы браузера
  }

  // 2. Делаем скриншот видимой области текущей вкладки
  chrome.tabs.captureVisibleTab(tab.windowId, { format: "jpeg", quality: 80 }, async (dataUrl) => {
    if (!dataUrl) return;

    // Извлекаем чистый Base64 код картинки из DataURL
    const base64Data = dataUrl.split(",")[1];

    try {
      // 3. Отправляем картинку в Gemini
      const answer = await askGemini(GEMINI_API_KEY, base64Data);
      
      // 4. Передаем ответ обратно на страницу для отображения
      chrome.tabs.sendMessage(tab.id, { type: "SHOW_ANSWER", answer: answer });
    } catch (e) {
      // В случае сбоя сбрасываем статус в фоновом режиме
    }
  });
});

async function askGemini(apiKey, base64Image) {
  // Используем быструю и точную мультимодальную модель gemini-2.5-flash
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: "Ты — ассистент по разбору тестов Moodle и H5P. Перед тобой скриншот экрана с вопросом теста. Найди на этом изображении текущий вопрос и варианты ответов (они могут быть на латышском или русском языке). Определи правильный ответ и выведи ТОЛЬКО текст самого этого правильного ответа (слово, фразу или числовое значение). Тебе категорически запрещено писать вводные фразы, пояснения, точки или буквы вариантов (A, B, C, D). Выводи строго чистый текст правильного ответа на языке оригинала."
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1 // Минимальная температура для точности
      }
    })
  });

  if (!response.ok) {
    throw new Error("Gemini API Error");
  }

  const json = await response.json();
  
  if (json.candidates && json.candidates[0].content.parts[0].text) {
    return json.candidates[0].content.parts[0].text.trim();
  }
  
  return "Ответ не распознан";
}