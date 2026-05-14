const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyqbUL98I2sfBJR1v5KjhsgtMy_BALQ0QQfvZAhI_uEAngrShkWCrK1U0jhZfZtpoCu/exec";
const THEME_STORAGE_KEY = "desliga-te-theme";
const VISIT_TIMER_STORAGE_KEY = "desliga-te-visit-start";
const VISIT_TIMER_WARNING_SECONDS = 5 * 60;

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

const themeModes = {
  reading: {
    label: "Leitura",
    nextLabel: "Ecrã",
    nextAction: "Mudar para Ecrã",
  },
  screen: {
    label: "Ecrã",
    nextLabel: "Leitura",
    nextAction: "Mudar para Leitura",
  },
};

const form = document.querySelector("#survey-form");
const statusNode = document.querySelector("#form-status");

function formatVisitDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function mountVisitTimer() {
  if (!document.body || document.querySelector("#visit-timer")) {
    return;
  }

  let visitStart = Number(sessionStorage.getItem(VISIT_TIMER_STORAGE_KEY));

  if (!visitStart || Number.isNaN(visitStart)) {
    visitStart = Date.now();
    sessionStorage.setItem(VISIT_TIMER_STORAGE_KEY, String(visitStart));
  }

  const timerRoot = document.createElement("aside");
  timerRoot.id = "visit-timer";
  timerRoot.className = "visit-timer";
  timerRoot.innerHTML = `
    <div class="visit-timer__label">Tempo no site</div>
    <div class="visit-timer__time" id="visit-timer-time">00:00</div>
    <div class="visit-timer__track" aria-hidden="true">
      <span class="visit-timer__fill" id="visit-timer-fill"></span>
    </div>
  `;

  document.body.appendChild(timerRoot);

  const timeNode = timerRoot.querySelector("#visit-timer-time");
  const fillNode = timerRoot.querySelector("#visit-timer-fill");

  const updateTimer = () => {
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - visitStart) / 1000));
    timeNode.textContent = formatVisitDuration(elapsedSeconds);
    fillNode.style.width = `${((elapsedSeconds % 60) / 60) * 100}%`;
    timerRoot.classList.toggle("is-overlimit", elapsedSeconds >= VISIT_TIMER_WARNING_SECONDS);
  };

  updateTimer();
  window.setInterval(updateTimer, 1000);
}

function updateModeContent(mode) {
  document.querySelectorAll("[data-mode-visibility]").forEach((node) => {
    node.hidden = node.dataset.modeVisibility !== mode;
  });

  document.querySelectorAll("[data-mode-copy]").forEach((node) => {
    node.hidden = node.dataset.modeCopy !== mode;
  });
}

function setTheme(mode) {
  const safeMode = mode === "screen" ? "screen" : "reading";
  const switchRoot = document.querySelector("#mode-switch");
  const iconNode = document.querySelector("#mode-switch-icon");
  const labelNode = document.querySelector("#mode-switch-label");
  const hintNode = document.querySelector("#mode-switch-hint");

  document.body.dataset.theme = safeMode;
  localStorage.setItem(THEME_STORAGE_KEY, safeMode);

  if (switchRoot && iconNode && labelNode && hintNode) {
    switchRoot.dataset.mode = safeMode;
    iconNode.innerHTML = themeIcons[safeMode];
    labelNode.textContent = themeModes[safeMode].label;
    hintNode.textContent = themeModes[safeMode].nextAction;
    switchRoot.setAttribute("aria-label", themeModes[safeMode].nextAction);
  }

  updateModeContent(safeMode);
}

function mountThemeSwitch() {
  if (!document.body || document.querySelector("#mode-switch")) {
    return;
  }

  const switchRoot = document.createElement("section");
  switchRoot.id = "mode-switch";
  switchRoot.className = "mode-toggle";
  switchRoot.innerHTML = `
    <button class="mode-toggle__button" type="button" aria-label="Mudar para Ecrã">
      <span class="mode-toggle__glow" aria-hidden="true"></span>
      <span class="mode-toggle__icon" id="mode-switch-icon" aria-hidden="true">${themeIcons.reading}</span>
      <span class="mode-toggle__text">
        <strong id="mode-switch-label">Leitura</strong>
        <span id="mode-switch-hint">Mudar para Ecrã</span>
      </span>
    </button>
  `;

  const toggleButton = switchRoot.querySelector(".mode-toggle__button");
  toggleButton.addEventListener("click", () => {
    const currentMode = document.body.dataset.theme === "screen" ? "screen" : "reading";
    const nextMode = currentMode === "screen" ? "reading" : "screen";
    setTheme(nextMode);
  });

  document.body.appendChild(switchRoot);

  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || "reading";
  setTheme(savedTheme);
}

mountThemeSwitch();
mountVisitTimer();

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
      statusNode.textContent = "Obrigado. As respostas foram enviadas com sucesso.";
    } catch (error) {
      statusNode.textContent =
        "Não foi possível enviar agora. Verifica o URL do Apps Script e a publicação do formulário.";
      console.error("Erro ao enviar formulário:", error);
    }
  });
}
