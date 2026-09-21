const state = {
  messages: [],
  code: null,
  fileName: null,
  language: '',
  busy: false,
};

const $ = (selector) => document.querySelector(selector);
const messageInput = $('#message-input');
const sendButton = $('#send-button');
const messagesEl = $('#messages');
const welcomeState = $('#welcome-state');
const toast = $('#toast');

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  }[char]));
}

function renderMarkdown(text) {
  const blocks = [];
  let html = escapeHtml(text).replace(/```([\w#+.-]*)\n([\s\S]*?)```/g, (_, language, code) => {
    const index = blocks.length;
    blocks.push({ language: language || 'code', code: code.trimEnd() });
    return `@@CODE_BLOCK_${index}@@`;
  });
  html = html
    .replace(/^### (.*)$/gm, '<h4>$1</h4>')
    .replace(/^## (.*)$/gm, '<h3>$1</h3>')
    .replace(/^# (.*)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
  html = `<p>${html}</p>`;
  blocks.forEach((block, index) => {
    const codeHtml = escapeHtml(block.code);
    html = html.replace(
      `<p>@@CODE_BLOCK_${index}@@</p>`,
      `<div class="code-block"><div class="code-header"><span>${escapeHtml(block.language)}</span><button type="button" class="copy-button" data-copy="${encodeURIComponent(block.code)}">Copy code</button></div><pre><code>${codeHtml}</code></pre></div>`,
    );
  });
  return html.replace(/<p><\/p>/g, '');
}

function renderMessages() {
  if (!state.messages.length) {
    welcomeState.hidden = false;
    messagesEl.innerHTML = '';
    return;
  }
  welcomeState.hidden = true;
  messagesEl.innerHTML = state.messages.map((item) => {
    if (item.role === 'user') {
      return `<article class="message user-message"><div class="message-avatar user-avatar">You</div><div class="message-body"><div class="message-meta"><strong>You</strong><span>now</span></div><div class="message-content">${escapeHtml(item.content).replace(/\n/g, '<br>')}</div>${item.hasCode ? '<div class="attached-chip">{ } Code context attached</div>' : ''}</div></article>`;
    }
    return `<article class="message assistant-message"><div class="message-avatar assistant-avatar"><span></span><span></span><span></span></div><div class="message-body"><div class="message-meta"><strong>ForgeCode</strong><span>${item.demo ? 'Preview response' : 'AI response'}</span></div><div class="message-content assistant-content">${renderMarkdown(item.content)}</div></div></article>`;
  }).join('');
  messagesEl.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      await navigator.clipboard.writeText(decodeURIComponent(button.dataset.copy));
      button.textContent = 'Copied';
      setTimeout(() => { button.textContent = 'Copy code'; }, 1600);
    });
  });
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 2400);
}

function setBusy(busy) {
  state.busy = busy;
  sendButton.disabled = busy;
  sendButton.innerHTML = busy ? '<span class="spinner"></span><span>Thinking</span>' : '<span>Send</span><span aria-hidden="true">↗</span>';
}

async function sendMessage() {
  const content = messageInput.value.trim();
  if (!content || state.busy) return;
  state.messages.push({ role: 'user', content, hasCode: Boolean(state.code) });
  messageInput.value = '';
  messageInput.style.height = 'auto';
  renderMessages();
  setBusy(true);

  try {
    const response = await fetch('api/chat.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: state.messages.map(({ role, content: text }) => ({ role, content: text })),
        code: state.code,
        language: state.language || null,
      }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Unable to reach the assistant.');
    state.messages.push({ role: 'assistant', content: payload.message, demo: payload.demo });
    renderMessages();
  } catch (error) {
    state.messages.push({ role: 'assistant', content: `I couldn't complete that request.\n\n${error.message}` });
    renderMessages();
  } finally {
    setBusy(false);
  }
}

function usePrompt(prompt) {
  messageInput.value = prompt;
  messageInput.focus();
  messageInput.style.height = `${Math.min(messageInput.scrollHeight, 160)}px`;
}

document.querySelectorAll('[data-prompt]').forEach((button) => {
  button.addEventListener('click', () => usePrompt(button.dataset.prompt));
});

sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});
messageInput.addEventListener('input', () => {
  messageInput.style.height = 'auto';
  messageInput.style.height = `${Math.min(messageInput.scrollHeight, 160)}px`;
});

$('#new-chat').addEventListener('click', () => {
  state.messages = [];
  state.code = null;
  state.fileName = null;
  $('#context-preview').hidden = true;
  renderMessages();
  messageInput.focus();
});

$('#code-input').addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  state.code = await file.text();
  state.fileName = file.name;
  $('#context-name').textContent = file.name;
  $('#context-meta').textContent = `${state.code.split('\n').length} lines · ready to include`;
  $('#context-preview').hidden = false;
  showToast('Code context attached');
});

$('#remove-context').addEventListener('click', () => {
  state.code = null;
  state.fileName = null;
  $('#code-input').value = '';
  $('#context-preview').hidden = true;
});

$('#language-select').addEventListener('change', (event) => { state.language = event.target.value; });
$('#mobile-menu').addEventListener('click', () => $('#sidebar').classList.toggle('open'));

document.querySelectorAll('[data-action="focus-chat"]').forEach((button) => button.addEventListener('click', () => messageInput.focus()));
document.querySelectorAll('[data-action="focus-code"]').forEach((button) => button.addEventListener('click', () => $('#code-input').click()));
document.querySelectorAll('[data-action="show-help"]').forEach((button) => button.addEventListener('click', () => { $('#help-modal').hidden = false; }));
document.querySelectorAll('[data-action="close-help"]').forEach((button) => button.addEventListener('click', () => { $('#help-modal').hidden = true; }));
$('#help-modal').addEventListener('click', (event) => { if (event.target.id === 'help-modal') event.currentTarget.hidden = true; });

renderMessages();