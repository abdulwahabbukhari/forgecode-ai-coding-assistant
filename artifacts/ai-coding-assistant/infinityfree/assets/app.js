const TEXT_EXTENSIONS = new Set([
  'c', 'cc', 'cpp', 'cs', 'css', 'go', 'html', 'htm', 'java', 'js', 'jsx',
  'json', 'md', 'php', 'py', 'rs', 'scss', 'sql', 'svg', 'ts', 'tsx', 'txt',
  'vue', 'xml', 'yaml', 'yml',
]);

const state = {
  messages: [],
  projectFiles: [],
  selectedPath: null,
  pdfText: '',
  imageAttachment: null,
  language: '',
  busy: false,
};

const $ = (selector) => document.querySelector(selector);
const messageInput = $('#message-input');
const sendButton = $('#send-button');
const messagesEl = $('#messages');
const welcomeState = $('#welcome-state');
const toast = $('#toast');
const configuredApiUrl = typeof window.WAHAB_AI_API_URL === 'string'
  ? window.WAHAB_AI_API_URL.trim()
  : '';
const apiEndpoint = configuredApiUrl && !configuredApiUrl.includes('PASTE_REPLIT_API_URL_HERE')
  ? configuredApiUrl
  : 'api/chat.php';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  }[char]));
}

function isTextPath(path) {
  const clean = path.toLowerCase().split('?')[0];
  const extension = clean.includes('.') ? clean.split('.').pop() : '';
  return TEXT_EXTENSIONS.has(extension);
}

function fileExtension(path) {
  const clean = path.toLowerCase().split('?')[0];
  return clean.includes('.') ? clean.split('.').pop() : '';
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('visible'), 2800);
}

function setBusy(busy) {
  state.busy = busy;
  sendButton.disabled = busy;
  sendButton.innerHTML = busy
    ? '<span class="spinner"></span><span>Thinking</span>'
    : '<span>Send</span><span aria-hidden="true">↗</span>';
}

function addProjectFile(path, content, kind = 'text', extra = {}) {
  const existing = state.projectFiles.find((file) => file.path === path);
  const next = { path, content, kind, ...extra };
  if (existing) Object.assign(existing, next);
  else state.projectFiles.push(next);
  state.projectFiles.sort((a, b) => a.path.localeCompare(b.path));
}

function updateContextPreview() {
  const preview = $('#context-preview');
  const count = state.projectFiles.length + (state.pdfText ? 1 : 0) + (state.imageAttachment ? 1 : 0);
  if (!count) {
    preview.hidden = true;
    return;
  }
  preview.hidden = false;
  $('#context-name').textContent = `${count} context item${count === 1 ? '' : 's'} ready`;
  const textCount = state.projectFiles.filter((file) => file.kind === 'text').length;
  $('#context-meta').textContent = `${textCount} text file${textCount === 1 ? '' : 's'} · included with your next request`;
}

function renderProjectFiles() {
  const list = $('#project-file-list');
  $('#file-count').textContent = `${state.projectFiles.length} file${state.projectFiles.length === 1 ? '' : 's'}`;
  if (!state.projectFiles.length) {
    list.innerHTML = '<div class="empty-panel">No project files yet.<br>Upload a ZIP or multiple files to begin.</div>';
    $('#editor-title').textContent = 'Select a text file';
    $('#project-editor').value = '';
    $('#project-editor').disabled = true;
    $('#save-editor-file').disabled = true;
    return;
  }
  list.innerHTML = state.projectFiles.map((file) => {
    const selected = file.path === state.selectedPath ? ' selected' : '';
    const icon = file.kind === 'image' ? 'IMG' : file.kind === 'binary' ? 'BIN' : fileExtension(file.path).toUpperCase() || 'TXT';
    return `<button class="project-file-row${selected}" type="button" data-file-path="${encodeURIComponent(file.path)}"><span class="file-type">${escapeHtml(icon.slice(0, 4))}</span><span class="file-name">${escapeHtml(file.path)}</span><span class="file-size">${file.kind === 'text' ? `${(file.content || '').length.toLocaleString()} chars` : 'asset'}</span></button>`;
  }).join('');
  list.querySelectorAll('[data-file-path]').forEach((button) => {
    button.addEventListener('click', () => selectProjectFile(decodeURIComponent(button.dataset.filePath)));
  });
  updateContextPreview();
}

function selectProjectFile(path) {
  const file = state.projectFiles.find((item) => item.path === path);
  state.selectedPath = path;
  renderProjectFiles();
  if (!file || file.kind !== 'text') {
    $('#editor-title').textContent = file ? `${file.path} · binary asset` : 'Select a text file';
    $('#project-editor').value = '';
    $('#project-editor').disabled = true;
    $('#save-editor-file').disabled = true;
    return;
  }
  $('#editor-title').textContent = file.path;
  $('#project-editor').value = file.content || '';
  $('#project-editor').disabled = false;
  $('#save-editor-file').disabled = false;
}

function renderMarkdown(text) {
  const blocks = [];
  let html = escapeHtml(text).replace(/```([\w#+.-]*)\n?([\s\S]*?)```/g, (_, language, code) => {
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
    const encoded = encodeURIComponent(block.code);
    const codeHtml = escapeHtml(block.code);
    html = html.replace(
      `<p>@@CODE_BLOCK_${index}@@</p>`,
      `<div class="code-block"><div class="code-header"><span>${escapeHtml(block.language)}</span><div class="code-actions"><button type="button" class="copy-button" data-copy="${encoded}">Copy code</button><button type="button" class="copy-button" data-download-code="${encoded}" data-language="${escapeHtml(block.language)}">Download</button></div></div><pre><code>${codeHtml}</code></pre></div>`,
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
      return `<article class="message user-message"><div class="message-avatar user-avatar">YOU</div><div class="message-body"><div class="message-meta"><strong>You</strong><span>now</span></div><div class="message-content">${escapeHtml(item.content).replace(/\n/g, '<br>')}</div>${item.contextCount ? `<div class="attached-chip">{ } ${item.contextCount} context item${item.contextCount === 1 ? '' : 's'} attached</div>` : ''}</div></article>`;
    }
    return `<article class="message assistant-message"><div class="message-avatar assistant-avatar"><span>W</span></div><div class="message-body"><div class="message-meta"><strong>WAHAB AI</strong><span>${item.model ? escapeHtml(item.model) : 'AI response'}</span></div><div class="message-content assistant-content">${renderMarkdown(item.content)}</div></div></article>`;
  }).join('');
  messagesEl.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(decodeURIComponent(button.dataset.copy));
        button.textContent = 'Copied';
        window.setTimeout(() => { button.textContent = 'Copy code'; }, 1600);
      } catch {
        showToast('Copy was blocked by this browser.');
      }
    });
  });
  messagesEl.querySelectorAll('[data-download-code]').forEach((button) => {
    button.addEventListener('click', () => {
      const extension = ({ js: 'js', javascript: 'js', ts: 'ts', typescript: 'ts', html: 'html', css: 'css', php: 'php', python: 'py' })[button.dataset.language.toLowerCase()] || 'txt';
      downloadBlob(`wahab-ai-code.${extension}`, decodeURIComponent(button.dataset.downloadCode), 'text/plain;charset=utf-8');
    });
  });
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function downloadBlob(name, data, type) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(data instanceof Blob ? data : new Blob([data], { type }));
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function currentContextCount() {
  return state.projectFiles.length + (state.pdfText ? 1 : 0) + (state.imageAttachment ? 1 : 0);
}

async function sendMessage() {
  const content = messageInput.value.trim();
  if (!content || state.busy) return;
  const contextCount = currentContextCount();
  state.messages.push({ role: 'user', content, contextCount });
  messageInput.value = '';
  messageInput.style.height = 'auto';
  renderMessages();
  setBusy(true);
  try {
    const textFiles = state.projectFiles
      .filter((file) => file.kind === 'text')
      .slice(0, 80)
      .map((file) => ({ path: file.path, content: (file.content || '').slice(0, 18000) }));
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'chat',
        messages: state.messages.map(({ role, content: message }) => ({ role, content: message })),
        code: state.selectedPath ? (state.projectFiles.find((file) => file.path === state.selectedPath)?.content || null) : null,
        language: state.language || null,
        projectFiles: textFiles,
        pdfText: state.pdfText.slice(0, 60000),
        attachments: state.imageAttachment ? [state.imageAttachment] : [],
      }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Unable to reach WAHAB AI.');
    state.messages.push({ role: 'assistant', content: payload.message, model: payload.model });
    renderMessages();
  } catch (error) {
    state.messages.push({ role: 'assistant', content: `I could not complete that request.\n\n${error instanceof Error ? error.message : 'Please check your API configuration and try again.'}` });
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

async function addLocalFiles(fileList) {
  const files = Array.from(fileList || []);
  for (const file of files) {
    if (file.size > 2_000_000) {
      showToast(`${file.name} is larger than the 2 MB browser context limit.`);
      continue;
    }
    if (isTextPath(file.name)) {
      addProjectFile(file.webkitRelativePath || file.name, await file.text());
    } else {
      addProjectFile(file.webkitRelativePath || file.name, null, 'binary', { blob: file });
    }
  }
  if (files.length) showToast(`${files.length} file${files.length === 1 ? '' : 's'} added to the workspace.`);
  renderProjectFiles();
  updatePreviewInputs();
}

async function addZip(file) {
  if (!window.JSZip) {
    showToast('ZIP reader is still loading. Try again in a moment.');
    return;
  }
  try {
    const zip = await window.JSZip.loadAsync(file);
    let added = 0;
    for (const entry of Object.values(zip.files)) {
      if (entry.dir || entry.name.startsWith('__MACOSX/') || entry.name.length > 180) continue;
      if (isTextPath(entry.name)) {
        addProjectFile(entry.name, await entry.async('string'));
      } else {
        addProjectFile(entry.name, null, 'binary', { blob: await entry.async('blob') });
      }
      added += 1;
      if (added >= 150) break;
    }
    showToast(`${added} ZIP file${added === 1 ? '' : 's'} added to the workspace.`);
    renderProjectFiles();
    updatePreviewInputs();
  } catch {
    showToast('That ZIP could not be read in the browser.');
  }
}

async function addPdf(file) {
  if (!window.pdfjsLib) {
    showToast('PDF reader is still loading. Try again in a moment.');
    return;
  }
  try {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const pages = [];
    for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, 20); pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const text = await page.getTextContent();
      pages.push(`--- Page ${pageNumber} ---\n${text.items.map((item) => item.str || '').join(' ')}`);
    }
    state.pdfText = pages.join('\n\n').slice(0, 60000);
    addProjectFile(`documents/${file.name}.txt`, state.pdfText);
    showToast(`PDF text extracted from ${Math.min(pdf.numPages, 20)} page${pdf.numPages === 1 ? '' : 's'}.`);
    renderProjectFiles();
  } catch {
    showToast('This PDF could not be read. Try a text-based PDF.');
  }
}

function addImage(file) {
  const reader = new FileReader();
  reader.onload = () => {
    state.imageAttachment = { name: file.name, type: file.type || 'image/png', data: reader.result };
    addProjectFile(`images/${file.name}`, null, 'image', { dataUrl: reader.result });
    showToast('Image attached for AI analysis.');
    renderProjectFiles();
    updateContextPreview();
  };
  reader.readAsDataURL(file);
}

function updatePreviewInputs() {
  const htmlFile = state.projectFiles.find((file) => ['html', 'htm'].includes(fileExtension(file.path)) && file.kind === 'text');
  const cssFile = state.projectFiles.find((file) => fileExtension(file.path) === 'css' && file.kind === 'text');
  const jsFile = state.projectFiles.find((file) => ['js', 'jsx'].includes(fileExtension(file.path)) && file.kind === 'text');
  if (htmlFile) $('#preview-html').value = htmlFile.content || '';
  if (cssFile) $('#preview-css').value = cssFile.content || '';
  if (jsFile) $('#preview-js').value = jsFile.content || '';
}

function runPreview() {
  const html = $('#preview-html').value.trim() || '<main><h1>WAHAB AI preview</h1><p>Add HTML, CSS and JavaScript files to see your project here.</p></main>';
  const css = $('#preview-css').value;
  const js = $('#preview-js').value.replace(/<\/script/gi, '<\\/script');
  let documentHtml = html;
  if (!/<html[\s>]/i.test(documentHtml)) {
    documentHtml = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body>${documentHtml}<script>${js}<\/script></body></html>`;
  } else {
    documentHtml = documentHtml.replace(/<\/head>/i, `<style>${css}</style></head>`).replace(/<\/body>/i, `<script>${js}<\/script></body>`);
  }
  $('#live-preview').srcdoc = documentHtml;
  $('#preview-state').textContent = `Updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

async function downloadProject() {
  if (!window.JSZip) {
    showToast('ZIP builder is still loading. Try again in a moment.');
    return;
  }
  if (!state.projectFiles.length) {
    showToast('Add project files before downloading a ZIP.');
    return;
  }
  const zip = new window.JSZip();
  state.projectFiles.forEach((file) => {
    if (file.kind === 'text') zip.file(file.path, file.content || '');
    else if (file.blob) zip.file(file.path, file.blob);
  });
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob('wahab-ai-project-v2.zip', blob);
  showToast('Project ZIP downloaded.');
}

async function generateImage() {
  const prompt = $('#image-prompt').value.trim();
  if (!prompt || state.busy) {
    showToast('Describe the image you want first.');
    return;
  }
  const button = $('#generate-image');
  button.disabled = true;
  button.textContent = 'Generating…';
  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'image', prompt, size: '1024x1024' }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'The image provider could not complete the request.');
    const wrap = $('#generated-image-wrap');
    wrap.hidden = false;
    wrap.innerHTML = '';
    const image = document.createElement('img');
    image.src = payload.image_url;
    image.alt = prompt;
    const download = document.createElement('a');
    download.href = payload.image_url;
    download.download = 'wahab-ai-generated-image.png';
    download.textContent = 'Download image';
    wrap.append(image, download);
    showToast('Image generated successfully.');
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Image generation failed.');
  } finally {
    button.disabled = false;
    button.textContent = '✦ Generate image';
  }
}

function switchView(viewId) {
  document.querySelectorAll('[data-view]').forEach((view) => view.classList.toggle('active', view.id === viewId));
  document.querySelectorAll('[data-view-target]').forEach((button) => button.classList.toggle('active', button.dataset.viewTarget === viewId));
  const titles = {
    'chat-view': 'Professional coding assistant',
    'workspace-view': 'Project files and context',
    'preview-view': 'HTML / CSS / JS live preview',
  };
  $('#view-title').textContent = titles[viewId] || titles['chat-view'];
  $('#sidebar').classList.remove('open');
  if (viewId === 'preview-view') updatePreviewInputs();
}

document.querySelectorAll('[data-prompt]').forEach((button) => button.addEventListener('click', () => {
  switchView('chat-view');
  usePrompt(button.dataset.prompt);
}));
document.querySelectorAll('[data-view-target]').forEach((button) => button.addEventListener('click', () => switchView(button.dataset.viewTarget)));
$('#send-button').addEventListener('click', sendMessage);
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
  renderMessages();
  messageInput.value = '';
  messageInput.focus();
  switchView('chat-view');
});
$('#attach-code').addEventListener('click', () => $('#project-input').click());
$('#workspace-upload').addEventListener('click', () => $('#project-input').click());
$('#project-input').addEventListener('change', (event) => addLocalFiles(event.target.files));
$('#attach-zip').addEventListener('click', () => $('#zip-input').click());
$('#zip-input').addEventListener('change', (event) => addZip(event.target.files?.[0]));
$('#attach-pdf').addEventListener('click', () => $('#pdf-input').click());
$('#pdf-input').addEventListener('change', (event) => addPdf(event.target.files?.[0]));
$('#attach-image').addEventListener('click', () => $('#image-input').click());
$('#image-input').addEventListener('change', (event) => addImage(event.target.files?.[0]));
$('#language-select').addEventListener('change', (event) => { state.language = event.target.value; });
$('#remove-context').addEventListener('click', () => {
  state.projectFiles = [];
  state.selectedPath = null;
  state.pdfText = '';
  state.imageAttachment = null;
  renderProjectFiles();
  updateContextPreview();
  showToast('Project context cleared.');
});
$('#save-editor-file').addEventListener('click', () => {
  const file = state.projectFiles.find((item) => item.path === state.selectedPath);
  if (!file) return;
  file.content = $('#project-editor').value;
  updatePreviewInputs();
  updateContextPreview();
  showToast(`${file.path} saved to context.`);
});
$('#run-preview').addEventListener('click', runPreview);
$('#download-project').addEventListener('click', downloadProject);
$('#workspace-download').addEventListener('click', downloadProject);
$('#generate-image').addEventListener('click', generateImage);
$('#mobile-menu').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
document.querySelectorAll('[data-action="show-help"]').forEach((button) => button.addEventListener('click', () => { $('#help-modal').hidden = false; }));
document.querySelectorAll('[data-action="close-help"]').forEach((button) => button.addEventListener('click', () => { $('#help-modal').hidden = true; }));
$('#help-modal').addEventListener('click', (event) => { if (event.target.id === 'help-modal') event.currentTarget.hidden = true; });

renderMessages();
renderProjectFiles();