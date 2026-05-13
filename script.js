const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyqbUL98I2sfBJR1v5KjhsgtMy_BALQ0QQfvZAhI_uEAngrShkWCrK1U0jhZfZtpoCu/exec";

const form = document.querySelector("#survey-form");
const statusNode = document.querySelector("#form-status");

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
