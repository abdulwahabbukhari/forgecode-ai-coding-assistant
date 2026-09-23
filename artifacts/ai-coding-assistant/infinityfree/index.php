<?php
declare(strict_types=1);
?><!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="WAHAB AI Version 2 is a practical AI coding workspace for writing, debugging, analysing and shipping software.">
    <meta name="theme-color" content="#08111f">
    <title>WAHAB AI Version 2 — AI coding workspace</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/styles.css">
</head>
<body>
    <div class="app-shell">
        <aside class="sidebar" id="sidebar">
            <div class="brand">
                <div class="brand-mark" aria-hidden="true"><span>W</span></div>
                <div>
                    <strong>WAHAB AI</strong>
                    <small>Version 2 · coding studio</small>
                </div>
            </div>

            <button class="new-chat-button" id="new-chat" type="button">
                <span class="plus-icon" aria-hidden="true">+</span>
                New conversation
            </button>

            <nav class="sidebar-nav" aria-label="Workspace">
                <p class="sidebar-label">Workspace</p>
                <button class="sidebar-link active" type="button" data-view-target="chat-view">
                    <span class="sidebar-icon">⌁</span>
                    AI chat
                </button>
                <button class="sidebar-link" type="button" data-view-target="workspace-view">
                    <span class="sidebar-icon">{ }</span>
                    Project files
                </button>
                <button class="sidebar-link" type="button" data-view-target="preview-view">
                    <span class="sidebar-icon">◈</span>
                    Live preview
                </button>
            </nav>

            <section class="sidebar-section recent-section">
                <p class="sidebar-label">Start quickly</p>
                <button class="recent-item" type="button" data-prompt="Review this project for security issues, bugs and production risks.">Security review</button>
                <button class="recent-item" type="button" data-prompt="Build a clean, responsive implementation for this idea. Return complete copy-ready code.">Build a feature</button>
                <button class="recent-item" type="button" data-prompt="Explain the selected project files and suggest the highest-impact improvements.">Understand a project</button>
            </section>

            <div class="sidebar-bottom">
                <div class="connection-status"><span class="status-dot"></span><span>Workspace ready</span></div>
                <div class="sidebar-footer">
                    <span>WAHAB AI V2</span>
                    <button class="icon-button" type="button" aria-label="Open guide" data-action="show-help">?</button>
                </div>
            </div>
        </aside>

        <main class="main-content">
            <header class="topbar">
                <div class="topbar-left">
                    <button class="mobile-menu icon-button" id="mobile-menu" type="button" aria-label="Open menu">☰</button>
                    <div class="topbar-title">
                        <span class="eyebrow">WAHAB AI WORKSPACE</span>
                        <strong id="view-title">Professional coding assistant</strong>
                    </div>
                </div>
                <div class="topbar-actions">
                    <button class="topbar-action" id="download-project" type="button" title="Download the current project as a ZIP">↓ <span>Download ZIP</span></button>
                    <button class="icon-button" type="button" aria-label="Open guide" data-action="show-help">?</button>
                </div>
            </header>

            <div class="view-stack">
                <section class="workspace-view active" id="chat-view" data-view>
                    <div class="chat-region" id="chat-region">
                        <div class="welcome-state" id="welcome-state">
                            <div class="welcome-orb" aria-hidden="true"><span>W</span></div>
                            <p class="eyebrow accent-eyebrow">YOUR AI ENGINEERING PARTNER</p>
                            <h1>Build with <em>clarity.</em><br>Ship with confidence.</h1>
                            <p class="welcome-copy">WAHAB AI writes, explains, debugs and improves code while keeping your files and decisions in context.</p>
                            <div class="capability-strip">
                                <span>Code expert</span><span>Project context</span><span>Live preview</span><span>File analysis</span>
                            </div>
                            <div class="starter-grid">
                                <button class="starter-card" type="button" data-prompt="Write a production-ready implementation for my idea. Include accessible HTML, responsive CSS and maintainable JavaScript.">
                                    <span class="starter-icon">↗</span><span><strong>Write code</strong><small>Start from a clear outcome</small></span>
                                </button>
                                <button class="starter-card" type="button" data-prompt="Explain the selected code step by step, including the data flow, tradeoffs and anything that could surprise a new developer.">
                                    <span class="starter-icon">◌</span><span><strong>Explain code</strong><small>Make complex logic clear</small></span>
                                </button>
                                <button class="starter-card" type="button" data-prompt="Find the bugs and security risks in the selected files. Return a prioritized list and complete safe fixes.">
                                    <span class="starter-icon">⌁</span><span><strong>Debug safely</strong><small>Find the signal in the noise</small></span>
                                </button>
                                <button class="starter-card" type="button" data-prompt="Improve the selected project for readability, performance, accessibility and maintainability. Return the updated files.">
                                    <span class="starter-icon">✦</span><span><strong>Improve a project</strong><small>Polish what already works</small></span>
                                </button>
                            </div>
                        </div>
                        <div class="messages" id="messages" aria-live="polite"></div>
                    </div>

                    <section class="composer-wrap">
                        <div class="context-preview" id="context-preview" hidden>
                            <span class="context-file-icon">{ }</span>
                            <span><strong id="context-name">Project context</strong><small id="context-meta">Ready to include</small></span>
                            <button class="remove-context" type="button" id="remove-context" aria-label="Remove selected context">×</button>
                        </div>
                        <div class="composer">
                            <div class="composer-tools">
                                <button class="tool-button" id="attach-code" type="button"><span>{ }</span><span>Add files</span></button>
                                <input id="project-input" class="visually-hidden" type="file" multiple accept=".js,.ts,.tsx,.jsx,.php,.py,.java,.c,.cpp,.cs,.go,.rs,.html,.htm,.css,.scss,.sql,.json,.md,.txt,.env.example">
                                <button class="tool-button" id="attach-zip" type="button"><span>ZIP</span><span>Project ZIP</span></button>
                                <input id="zip-input" class="visually-hidden" type="file" accept=".zip,application/zip">
                                <button class="tool-button" id="attach-pdf" type="button"><span>PDF</span><span>Analyse PDF</span></button>
                                <input id="pdf-input" class="visually-hidden" type="file" accept=".pdf,application/pdf">
                                <button class="tool-button" id="attach-image" type="button"><span>IMG</span><span>Analyse image</span></button>
                                <input id="image-input" class="visually-hidden" type="file" accept="image/*">
                                <select id="language-select" class="language-select" aria-label="Code language">
                                    <option value="">Auto language</option>
                                    <option value="javascript">JavaScript</option>
                                    <option value="typescript">TypeScript</option>
                                    <option value="php">PHP</option>
                                    <option value="python">Python</option>
                                    <option value="html">HTML</option>
                                    <option value="css">CSS</option>
                                    <option value="sql">SQL</option>
                                </select>
                            </div>
                            <textarea id="message-input" rows="1" placeholder="Ask WAHAB AI to write, explain, debug or improve your code..." aria-label="Message"></textarea>
                            <div class="composer-bottom">
                                <span class="composer-hint"><kbd>Enter</kbd> send · <kbd>Shift</kbd> + <kbd>Enter</kbd> new line</span>
                                <button class="send-button" id="send-button" type="button" aria-label="Send message"><span>Send</span><span aria-hidden="true">↗</span></button>
                            </div>
                        </div>
                        <p class="disclaimer">WAHAB AI can make mistakes. Review generated code before shipping.</p>
                    </section>
                </section>

                <section class="workspace-view" id="workspace-view" data-view>
                    <div class="page-heading">
                        <div><p class="eyebrow accent-eyebrow">PROJECT WORKSPACE</p><h2>Files, context and <em>downloads.</em></h2><p>Upload a ZIP or select multiple files. WAHAB AI will keep text files available for analysis and let you download the updated project.</p></div>
                        <button class="primary-button" id="workspace-upload" type="button">＋ Add project files</button>
                    </div>
                    <div class="workspace-grid">
                        <div class="panel file-panel"><div class="panel-heading"><span>Project files</span><span class="panel-count" id="file-count">0 files</span></div><div id="project-file-list" class="project-file-list"><div class="empty-panel">No project files yet.<br>Upload a ZIP or multiple files to begin.</div></div></div>
                        <div class="panel editor-panel"><div class="panel-heading"><span id="editor-title">Select a text file</span><button id="save-editor-file" class="small-button" type="button" disabled>Save context</button></div><textarea id="project-editor" class="project-editor" placeholder="Select a text file from the project list to inspect it." spellcheck="false"></textarea></div>
                    </div>
                    <div class="workspace-actions"><button class="secondary-button" id="workspace-download" type="button">↓ Download complete project ZIP</button><span id="workspace-status">Files stay in your browser until you send them.</span></div>
                    <div class="panel image-generator"><div><p class="eyebrow accent-eyebrow">CREATIVE TOOL</p><h3>Generate an interface image</h3><p>Describe a visual direction and use the generated image in your project workflow. Requires an image-capable API provider.</p></div><div class="image-generator-controls"><textarea id="image-prompt" rows="3" placeholder="A dark glassmorphism dashboard for a developer tool, lime and coral accents..."></textarea><button class="primary-button" id="generate-image" type="button">✦ Generate image</button></div><div id="generated-image-wrap" class="generated-image-wrap" hidden></div></div>
                </section>

                <section class="workspace-view" id="preview-view" data-view>
                    <div class="page-heading"><div><p class="eyebrow accent-eyebrow">HTML / CSS / JS</p><h2>See the idea <em>run live.</em></h2><p>Load uploaded web files or edit the panels below, then run a sandboxed preview without leaving the workspace.</p></div><button class="primary-button" id="run-preview" type="button">▶ Run preview</button></div>
                    <div class="preview-grid">
                        <div class="preview-editors">
                            <label class="panel editor-card"><span>HTML</span><textarea id="preview-html" spellcheck="false" placeholder="Upload an .html file or paste markup here..."></textarea></label>
                            <label class="panel editor-card"><span>CSS</span><textarea id="preview-css" spellcheck="false" placeholder="Upload a .css file or paste styles here..."></textarea></label>
                            <label class="panel editor-card"><span>JavaScript</span><textarea id="preview-js" spellcheck="false" placeholder="Upload a .js file or paste browser JavaScript here..."></textarea></label>
                        </div>
                        <div class="panel preview-card"><div class="panel-heading"><span>Live sandbox</span><span class="preview-state" id="preview-state">Ready</span></div><iframe id="live-preview" title="Live HTML CSS JavaScript preview" sandbox="allow-scripts"></iframe></div>
                    </div>
                </section>
            </div>

            <footer class="site-footer">WAHAB AI Version 2 · Developed and owned by <strong>Syed Abdul Wahab Bukhari</strong></footer>
        </main>
    </div>

    <div class="toast" id="toast" role="status"></div>
    <div class="modal-backdrop" id="help-modal" hidden>
        <div class="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title">
            <button class="modal-close icon-button" type="button" data-action="close-help" aria-label="Close guide">×</button>
            <p class="eyebrow accent-eyebrow">QUICK START</p>
            <h2 id="help-title">A practical AI workspace.</h2>
            <p>Ask for a complete implementation, attach a project, inspect a PDF or image, then preview and download the files you are working on.</p>
            <div class="help-list">
                <div><span>01</span><strong>Add context</strong><small>Use files, a ZIP, PDF, image or pasted code.</small></div>
                <div><span>02</span><strong>Give WAHAB AI a clear job</strong><small>Say what should change and what must stay unchanged.</small></div>
                <div><span>03</span><strong>Review and export</strong><small>Copy generated code, run a preview and download your project ZIP.</small></div>
            </div>
        </div>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js" defer></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js" defer></script>
    <script src="assets/config.js" defer></script>
    <script src="assets/app.js" defer></script>
</body>
</html>