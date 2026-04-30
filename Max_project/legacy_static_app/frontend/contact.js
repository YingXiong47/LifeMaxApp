import { loadState, saveState } from "../../core/utils/storage.js";

const form = document.getElementById("contact-form");
const statusEl = document.getElementById("contact-status");
const messagesEl = document.getElementById("contact-messages");

let state = loadState() || {
  session: {
    userId: `user-${Date.now()}`
  },
  history: [],
  latestRun: null,
  contactMessages: []
};

function renderMessages() {
  const messages = state.contactMessages || [];
  if (!messages.length) {
    messagesEl.innerHTML = `
      <article class="log-card">
        <strong>No saved messages yet</strong>
        <div class="meta">Use the form above to store one locally.</div>
      </article>
    `;
    return;
  }

  messagesEl.innerHTML = messages
    .slice()
    .reverse()
    .map(
      (message) => `
        <article class="log-card">
          <strong>${message.topic}</strong>
          <div class="meta">${message.name} • ${message.email} • ${new Date(message.createdAt).toLocaleString()}</div>
          <p>${message.message}</p>
        </article>
      `
    )
    .join("");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const message = Object.fromEntries(formData.entries());
  message.createdAt = new Date().toISOString();
  state.contactMessages = state.contactMessages || [];
  state.contactMessages.push(message);
  saveState(state);
  statusEl.textContent = "Message saved locally in this browser.";
  form.reset();
  renderMessages();
});

renderMessages();
