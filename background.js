const DYNAMIC_RULE_ID = 1;

// Применяет динамическое правило на основе активного пресета
async function applyActivePresetRule() {
  const result = await chrome.storage.local.get(["presets", "activePresetId"]);
  const presets = result.presets || [];
  const active = presets.find((p) => p.id === result.activePresetId);

  if (!active) {
    await removeDynamicRule();
    return;
  }

  const hostname = active.url.replace(/^https?:\/\//, "");
  const escapedHostname = hostname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const rule = {
    id: DYNAMIC_RULE_ID,
    priority: 1,
    action: {
      type: "redirect",
      redirect: {
        regexSubstitution: "http://localhost:" + active.port + "\\1",
      },
    },
    condition: {
      regexFilter: "^https?://" + escapedHostname + "(/.*)?" + "$",
      resourceTypes: ["main_frame"],
    },
  };

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [DYNAMIC_RULE_ID],
    addRules: [rule],
  });
}

// Удаляет динамическое правило
async function removeDynamicRule() {
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [DYNAMIC_RULE_ID],
    addRules: [],
  });
}

// Восстанавливает состояние: отключает статические правила, применяет динамические
async function restoreState() {
  // Отключаем статические правила — используем только динамические
  try {
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: [],
      disableRulesetIds: ["redirect_rules"],
    });
  } catch (e) {
    // Статические правила могут отсутствовать
  }

  const result = await chrome.storage.local.get(["enabled"]);
  const isEnabled = result.enabled !== false;

  if (isEnabled) {
    await applyActivePresetRule();
  } else {
    await removeDynamicRule();
  }
}

// При установке расширения
chrome.runtime.onInstalled.addListener(async () => {
  console.log("OIDC Redirector installed");
  await restoreState();
});

// При запуске браузера
chrome.runtime.onStartup.addListener(async () => {
  console.log("Browser started, restoring OIDC Redirector state");
  await restoreState();
});

// Горячая клавиша Ctrl+Shift+9
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-redirect") {
    console.log("Hotkey pressed: Ctrl+Shift+9 - toggling redirect");

    const result = await chrome.storage.local.get(["enabled"]);
    const currentState = result.enabled !== false;
    const newState = !currentState;

    await chrome.storage.local.set({ enabled: newState });

    if (newState) {
      await applyActivePresetRule();
      console.log("Redirects enabled");
    } else {
      await removeDynamicRule();
      console.log("Redirects disabled");
    }

    showNotification(newState);
  }
});

// Badge-уведомление
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
