const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyqbUL98I2sfBJR1v5KjhsgtMy_BALQ0QQfvZAhI_uEAngrShkWCrK1U0jhZfZtpoCu/exec";
const THEME_STORAGE_KEY = "desliga-te-theme";

const themeIcons = {
  reading: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="#ff8f1f"></circle>
      <circle cx="9" cy="10" r="1.1" fill="#fff7e8"></circle>
      <circle cx="15" cy="10" r="1.1" fill="#fff7e8"></circle>
      <path d="M8 14.2c1.1 1.4 2.4 2 4 2s2.9-.6 4-2" fill="none" stroke="#fff7e8" stroke-width="1.8" stroke-linecap="round"></path>
    </svg>
  `,
  screen: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" fill="#3f87ff"></circle>
      <circle cx="9" cy="10" r="1.1" fill="#eef6ff"></circle>
      <circle cx="15" cy="10" r="1.1" fill="#eef6ff"></circle>
      <path d="M8 16c1.1-1.4 2.4-2 4-2s2.9.6 4 2" fill="none" stroke="#eef6ff" stroke-width="1.8" stroke-linecap="round"></path>
    </svg>
  `,
};

const form = document.querySelector("#survey-form");
const statusNode = document.querySelector("#form-status");

const themeModes = {
  reading: {
    label: "Leitura",
    next: "Ativar filtro azul do ecrã",
  },
  screen: {
    label: "Ecrã",
    next: "Voltar ao modo quente de leitura",
  },
};

function setTheme(mode) {
  const safeMode = mode === "screen" ? "screen" : "reading";
  document.body.dataset.theme = safeMode;
  localStorage.setItem(THEME_STORAGE_KEY, safeMode);

  const switchButton = document.querySelector("#theme-switch");
  const modeNode = document.querySelector("#theme-switch-mode");

  if (switchButton && modeNode) {
    switchButton.querySelector(".theme-switch__swatch").innerHTML = themeIcons[safeMode];
    modeNode.textContent = themeModes[safeMode].label;
    switchButton.setAttribute("aria-label", themeModes[safeMode].next);
    switchButton.title = themeModes[safeMode].next;
  }
}

function toggleTheme() {
  const current = document.body.dataset.theme === "screen" ? "screen" : "reading";
  setTheme(current === "reading" ? "screen" : "reading");
}

function mountThemeSwitch() {
  if (!document.body || document.querySelector("#theme-switch")) {
    return;
  }

  const switchButton = document.createElement("button");
  switchButton.id = "theme-switch";
  switchButton.className = "theme-switch";
  switchButton.type = "button";
  switchButton.innerHTML = `
    <span class="theme-switch__swatch" aria-hidden="true">${themeIcons.reading}</span>
    <span class="theme-switch__label">
      <span class="theme-switch__mode" id="theme-switch-mode">${themeModes.reading.label}</span>
    </span>
  `;
  switchButton.addEventListener("click", toggleTheme);
  document.body.appendChild(switchButton);

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || "reading";
  setTheme(savedTheme);
}

mountThemeSwitch();

if (form && statusNode) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!APPS_SCRIPT_URL) {
      statusNode.textContent =
        "O questionário já está pronto. Para guardar respostas no Google Sheets, falta colar o URL do Google Apps Script em script.js.";
      return;
    }

    const formData = new FormData(form);
    const payload = new URLSearchParams();

    for (const [key, value] of formData.entries()) {
      payload.append(key, String(value));
    }

    payload.append("submitted_at", new Date().toISOString());
    payload.append("source_page", window.location.href);

    statusNode.textContent = "A enviar respostas...";

    try {
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: payload,
      });

      form.reset();
      statusNode.textContent =
        "Obrigado. As respostas foram enviadas com sucesso.";
    } catch (error) {
      statusNode.textContent =
        "Não foi possível enviar agora. Verifica o URL do Apps Script e a publicação do formulário.";
      console.error("Erro ao enviar formulário:", error);
    }
  });
}
