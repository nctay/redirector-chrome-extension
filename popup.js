// Загружаем настройки при открытии popup
chrome.storage.local.get(["enabled", "sourceUrl", "targetUrl"], (result) => {
  const isEnabled = result.enabled !== false;
  const sourceUrl = result.sourceUrl || "https://bonus.apps.k8s.stg.bonus.inno.tech";
  const targetUrl = result.targetUrl || "http://localhost:3000";

  // Обновляем UI
  updateUI(isEnabled);
  updateMappingDisplay(sourceUrl, targetUrl);
  
  // Заполняем форму
  document.getElementById("sourceUrl").value = sourceUrl;
  document.getElementById("targetUrl").value = targetUrl;
});

// Обработчик кнопки toggle
document.getElementById("toggle").addEventListener("click", async () => {
  chrome.storage.local.get(["enabled"], async (result) => {
    const currentState = result.enabled !== false;
    const newState = !currentState;

    await chrome.storage.local.set({ enabled: newState });
    await applyRedirectRules(newState);
    updateUI(newState);
  });
});

// Обработчик кнопки сохранения настроек
document.getElementById("saveSettings").addEventListener("click", async () => {
  const sourceUrl = document.getElementById("sourceUrl").value.trim();
  const targetUrl = document.getElementById("targetUrl").value.trim();

  // Валидация
  if (!sourceUrl || !targetUrl) {
    alert("Please fill in both URLs");
    return;
  }

  if (!isValidUrl(sourceUrl) || !isValidUrl(targetUrl)) {
    alert("Please enter valid URLs");
    return;
  }

  // Сохраняем настройки
  await chrome.storage.local.set({ 
    sourceUrl: sourceUrl.replace(/\/$/, ""), // убираем trailing slash
    targetUrl: targetUrl.replace(/\/$/, "")
  });

  // Обновляем правила, если редирект включен
  chrome.storage.local.get(["enabled"], async (result) => {
    const isEnabled = result.enabled !== false;
    if (isEnabled) {
      await applyRedirectRules(true, sourceUrl, targetUrl);
    }
  });

  // Обновляем отображение
  updateMappingDisplay(sourceUrl, targetUrl);
  
  // Показываем feedback
  const saveBtn = document.getElementById("saveSettings");
  const originalText = saveBtn.textContent;
  saveBtn.textContent = "✓ Saved!";
  saveBtn.style.background = "#4caf50";
  setTimeout(() => {
    saveBtn.textContent = originalText;
    saveBtn.style.background = "";
  }, 1500);
});

// Применяем правила редиректа
async function applyRedirectRules(enable, customSourceUrl = null, customTargetUrl = null) {
  // Получаем URL из storage, если не переданы
  if (!customSourceUrl || !customTargetUrl) {
    const result = await chrome.storage.local.get(["sourceUrl", "targetUrl"]);
    customSourceUrl = result.sourceUrl || "https://bonus.apps.k8s.stg.bonus.inno.tech";
    customTargetUrl = result.targetUrl || "http://localhost:3000";
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
    const escapedSourceUrl = escapeRegex(customSourceUrl);
    const regexFilter = `^${escapedSourceUrl}(/.*)?$`;
    
    // Добавляем новое правило
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [
        {
          id: 1,
          priority: 1,
          action: {
            type: "redirect",
            redirect: {
              regexSubstitution: `${customTargetUrl}\\1`
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

// Валидация URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Обновление UI статуса
function updateUI(isEnabled) {
  const statusDiv = document.getElementById("status");
  const toggleButton = document.getElementById("toggle");

  if (isEnabled) {
    statusDiv.textContent = "✓ Redirects enabled";
    statusDiv.className = "status active";
    toggleButton.textContent = "Disable redirects";
    toggleButton.className = "disable";
  } else {
    statusDiv.textContent = "✗ Redirects disabled";
    statusDiv.className = "status inactive";
    toggleButton.textContent = "Enable redirects";
    toggleButton.className = "enable";
  }
}

// Обновление отображения текущего маппинга
function updateMappingDisplay(sourceUrl, targetUrl) {
  document.getElementById("fromUrl").textContent = sourceUrl;
  document.getElementById("toUrl").textContent = targetUrl;
}
