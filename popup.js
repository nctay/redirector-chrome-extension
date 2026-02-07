const DYNAMIC_RULE_ID = 1;

const statusDiv = document.getElementById("status");
const toggleButton = document.getElementById("toggle");
const presetListDiv = document.getElementById("presetList");
const addForm = document.getElementById("addForm");
const showAddFormBtn = document.getElementById("showAddForm");
const cancelAddBtn = document.getElementById("cancelAdd");
const savePresetBtn = document.getElementById("savePreset");
const presetNameInput = document.getElementById("presetName");
const presetUrlInput = document.getElementById("presetUrl");
const presetPortInput = document.getElementById("presetPort");
const mappingDisplay = document.getElementById("mappingDisplay");
const toast = document.getElementById("toast");

// --- Init ---
loadState();

// --- Toggle redirect on/off ---
toggleButton.addEventListener("click", async () => {
  const result = await chrome.storage.local.get(["enabled"]);
  const currentState = result.enabled !== false;
  const newState = !currentState;

  await chrome.storage.local.set({ enabled: newState });

  if (newState) {
    await applyActivePresetRule();
  } else {
    await removeDynamicRule();
  }

  updateToggleUI(newState);
});

// --- Show / hide add form ---
showAddFormBtn.addEventListener("click", () => {
  addForm.classList.add("visible");
  showAddFormBtn.style.display = "none";
  presetNameInput.focus();
});

cancelAddBtn.addEventListener("click", () => {
  hideAddForm();
});

// --- Save new preset ---
savePresetBtn.addEventListener("click", async () => {
  const name = presetNameInput.value.trim();
  const url = presetUrlInput.value.trim();
  const port = parseInt(presetPortInput.value, 10);

  // Validate
  let valid = true;
  if (!name) {
    presetNameInput.style.borderColor = "#f44336";
    valid = false;
  } else {
    presetNameInput.style.borderColor = "";
  }
  if (!url) {
    presetUrlInput.style.borderColor = "#f44336";
    valid = false;
  } else {
    presetUrlInput.style.borderColor = "";
  }
  if (!port || port < 1 || port > 65535) {
    presetPortInput.style.borderColor = "#f44336";
    valid = false;
  } else {
    presetPortInput.style.borderColor = "";
  }
  if (!valid) return;

  const result = await chrome.storage.local.get(["presets", "activePresetId"]);
  const presets = result.presets || [];
  const id = Date.now().toString();

  presets.push({ id, name, url, port });

  // Если это первый пресет — сделать его активным
  const isFirst = presets.length === 1;
  const updates = { presets };
  if (isFirst) {
    updates.activePresetId = id;
  }

  await chrome.storage.local.set(updates);

  // Если стал активным и редиректы включены — применить правило
  if (isFirst) {
    const enabledResult = await chrome.storage.local.get(["enabled"]);
    if (enabledResult.enabled !== false) {
      await applyActivePresetRule();
    }
  }

  hideAddForm();
  showToast("Preset \"" + name + "\" saved");
  loadState();
});

// --- Functions ---

async function loadState() {
  const result = await chrome.storage.local.get(["enabled", "presets", "activePresetId"]);
  const isEnabled = result.enabled !== false;
  const presets = result.presets || [];
  const activeId = result.activePresetId || null;

  updateToggleUI(isEnabled);
  renderPresets(presets, activeId);
  updateMappingDisplay(presets, activeId);
}

function updateToggleUI(isEnabled) {
  if (isEnabled) {
    statusDiv.textContent = "Redirects enabled";
    statusDiv.className = "status active";
    toggleButton.textContent = "Disable redirects";
    toggleButton.className = "toggle-btn disable";
  } else {
    statusDiv.textContent = "Redirects disabled";
    statusDiv.className = "status inactive";
    toggleButton.textContent = "Enable redirects";
    toggleButton.className = "toggle-btn enable";
  }
}

function renderPresets(presets, activeId) {
  presetListDiv.innerHTML = "";

  if (presets.length === 0) {
    presetListDiv.innerHTML = '<div class="no-presets">No presets yet</div>';
    return;
  }

  presets.forEach((preset) => {
    const item = document.createElement("div");
    item.className = "preset-item" + (preset.id === activeId ? " active" : "");

    const radio = document.createElement("div");
    radio.className = "preset-radio";

    const info = document.createElement("div");
    info.className = "preset-info";

    const nameDiv = document.createElement("div");
    nameDiv.className = "preset-name";
    nameDiv.textContent = preset.name;

    const detailDiv = document.createElement("div");
    detailDiv.className = "preset-detail";
    detailDiv.textContent = preset.url + " -> :" + preset.port;

    info.appendChild(nameDiv);
    info.appendChild(detailDiv);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "preset-delete";
    deleteBtn.textContent = "\u00d7";
    deleteBtn.title = "Delete preset";

    // Клик по пресету — выбрать его активным
    const selectArea = document.createElement("div");
    selectArea.style.display = "contents";
    selectArea.appendChild(radio);
    selectArea.appendChild(info);
    selectArea.addEventListener("click", () => selectPreset(preset.id));

    // Клик по крестику — удалить
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deletePreset(preset.id, preset.name);
    });

    item.appendChild(selectArea);
    item.appendChild(deleteBtn);
    presetListDiv.appendChild(item);
  });
}

async function selectPreset(id) {
  await chrome.storage.local.set({ activePresetId: id });

  // Если редиректы включены — применить новое правило
  const result = await chrome.storage.local.get(["enabled"]);
  if (result.enabled !== false) {
    await applyActivePresetRule();
  }

  loadState();
}

async function deletePreset(id, name) {
  const result = await chrome.storage.local.get(["presets", "activePresetId", "enabled"]);
  let presets = result.presets || [];
  const wasActive = result.activePresetId === id;

  presets = presets.filter((p) => p.id !== id);

  const updates = { presets };

  if (wasActive) {
    // Переключиться на первый оставшийся или очистить
    if (presets.length > 0) {
      updates.activePresetId = presets[0].id;
    } else {
      updates.activePresetId = null;
    }
  }

  await chrome.storage.local.set(updates);

  // Обновить правило если нужно
  if (wasActive && result.enabled !== false) {
    if (presets.length > 0) {
      await applyActivePresetRule();
    } else {
      await removeDynamicRule();
    }
  }

  showToast("Preset \"" + name + "\" deleted");
  loadState();
}

function updateMappingDisplay(presets, activeId) {
  const active = presets.find((p) => p.id === activeId);
  if (active) {
    mappingDisplay.textContent = active.url + "\n-> http://localhost:" + active.port;
  } else {
    mappingDisplay.textContent = "No preset selected";
  }
}

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

async function removeDynamicRule() {
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [DYNAMIC_RULE_ID],
    addRules: [],
  });
}

function hideAddForm() {
  addForm.classList.remove("visible");
  showAddFormBtn.style.display = "";
  presetNameInput.value = "";
  presetUrlInput.value = "";
  presetPortInput.value = "";
  presetNameInput.style.borderColor = "";
  presetUrlInput.style.borderColor = "";
  presetPortInput.style.borderColor = "";
}

function showToast(msg) {
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 2000);
}
