// Восстанавливаем состояние при установке расширения
chrome.runtime.onInstalled.addListener(async () => {
  console.log("OIDC Redirector installed");
  
  // Устанавливаем дефолтные значения, если их нет
  const result = await chrome.storage.local.get(["enabled", "sourceUrl", "targetUrl"]);
  
  if (result.sourceUrl === undefined) {
    await chrome.storage.local.set({
      sourceUrl: "https://bonus.apps.k8s.stg.bonus.inno.tech",
      targetUrl: "http://localhost:3000"
    });
  }
  
  const isEnabled = result.enabled !== false;
  await applyRedirectRules(isEnabled, result.sourceUrl, result.targetUrl);
});

// Восстанавливаем состояние при запуске браузера
chrome.runtime.onStartup.addListener(async () => {
  console.log("Browser started, restoring OIDC Redirector state");
  const result = await chrome.storage.local.get(["enabled", "sourceUrl", "targetUrl"]);
  const isEnabled = result.enabled !== false;
  
  await applyRedirectRules(isEnabled, result.sourceUrl, result.targetUrl);
});

// Обработчик горячей клавиши Ctrl+Shift+9
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-redirect") {
    console.log("Hotkey pressed: Ctrl+Shift+9 - toggling redirect");

    const result = await chrome.storage.local.get(["enabled", "sourceUrl", "targetUrl"]);
    const currentState = result.enabled !== false;
    const newState = !currentState;

    await chrome.storage.local.set({ enabled: newState });
    await applyRedirectRules(newState, result.sourceUrl, result.targetUrl);

    console.log(`Redirects ${newState ? "enabled" : "disabled"}`);
    showNotification(newState);
  }
});

// Применяем правила редиректа
async function applyRedirectRules(enable, sourceUrl = null, targetUrl = null) {
  // Если URL не переданы, получаем из storage
  if (!sourceUrl || !targetUrl) {
    const result = await chrome.storage.local.get(["sourceUrl", "targetUrl"]);
    sourceUrl = result.sourceUrl || "https://bonus.apps.k8s.stg.bonus.inno.tech";
    targetUrl = result.targetUrl || "http://localhost:3000";
  }

  // Удаляем все существующие динамические правила
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingRuleIds = existingRules.map(rule => rule.id);
  
  if (existingRuleIds.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds
    });
  }

  if (enable) {
    // Создаем regex для sourceUrl
    const escapedSourceUrl = escapeRegex(sourceUrl);
    const regexFilter = `^${escapedSourceUrl}(/.*)?$`;
    
    console.log(`Creating redirect rule: ${sourceUrl} -> ${targetUrl}`);
    
    // Добавляем новое правило
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [
        {
          id: 1,
          priority: 1,
          action: {
            type: "redirect",
            redirect: {
              regexSubstitution: `${targetUrl}\\1`
            }
          },
          condition: {
            regexFilter: regexFilter,
            resourceTypes: ["main_frame"]
          }
        }
      ]
    });
  }
}

// Экранирование специальных символов для regex
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Функция для показа уведомления о переключении
function showNotification(isEnabled) {
  chrome.action.setBadgeText({
    text: isEnabled ? "ON" : "OFF",
  });
  chrome.action.setBadgeBackgroundColor({
    color: isEnabled ? "#4caf50" : "#f44336",
  });

  setTimeout(() => {
    chrome.action.setBadgeText({ text: "" });
  }, 2000);
}
