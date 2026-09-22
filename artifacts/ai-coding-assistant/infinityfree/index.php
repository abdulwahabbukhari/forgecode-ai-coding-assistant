<?php
declare(strict_types=1);
?><!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="ForgeCode is an AI coding assistant for writing, explaining, debugging, and improving code.">
    <title>ForgeCode — AI coding assistant</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/styles.css">
</head>
<body>
    <div class="app-shell">
        <aside class="sidebar" id="sidebar">
            <div class="brand">
                <div class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></div>
                <span>ForgeCode</span>
            </div>

            <button class="new-chat-button" id="new-chat" type="button">
                <span class="plus-icon" aria-hidden="true">+</span>
                New conversation
            </button>

            <div class="sidebar-section">
                <p class="sidebar-label">Workspace</p>
                <button class="sidebar-link active" type="button" data-action="focus-chat">
                    <span class="sidebar-icon" aria-hidden="true">⌁</span>
                    Coding assistant
                </button>
                <button class="sidebar-link" type="button" data-action="focus-code">
                    <span class="sidebar-icon" aria-hidden="true">{ }</span>
                    Code context
                </button>
            </div>

            <div class="sidebar-section recent-section">
                <p class="sidebar-label">Recent</p>
                <button class="recent-item" type="button" data-prompt="Help me understand this error and suggest the safest fix.">Fix a runtime error</button>
                <button class="recent-item" type="button" data-prompt="Write a clean, production-ready implementation for a small API endpoint.">Build an API endpoint</button>
                <button class="recent-item" type="button" data-prompt="Review my code for bugs, edge cases, and maintainability improvements.">Review code quality</button>
            </div>

            <div class="sidebar-bottom">
                <div class="connection-status"><span class="status-dot"></span><span>Assistant ready</span></div>
                <div class="sidebar-footer">
                    <span>v1.0</span>
                    <button class="icon-button" type="button" aria-label="Help" data-action="show-help">?</button>
                </div>
            </div>
        </aside>

        <main class="main-content">
            <header class="topbar">
                <button class="mobile-menu icon-button" id="mobile-menu" type="button" aria-label="Open menu">☰</button>
                <div class="topbar-title">
                    <span class="eyebrow">WORKSPACE</span>
                    <strong>Coding assistant</strong>
                </div>
                <div class="topbar-actions">
                    <button class="model-pill" id="model-pill" type="button" aria-label="Current model">
                        <span class="model-dot"></span>
                        <span id="model-name">ForgeCode</span>
                        <span class="chevron" aria-hidden="true">⌄</span>
                    </button>
                    <button class="icon-button" type="button" aria-label="Help" data-action="show-help">?</button>
                </div>
            </header>

            <section class="chat-region" id="chat-region">
                <div class="welcome-state" id="welcome-state">
                    <div class="welcome-orb" aria-hidden="true">
                        <div class="orb-core"></div>
                        <div class="orb-ring ring-one"></div>
                        <div class="orb-ring ring-two"></div>
                    </div>
                    <p class="eyebrow accent-eyebrow">YOUR AI PAIR PROGRAMMER</p>
                    <h1>Make your next commit<br><em>the good one.</em></h1>
                    <p class="welcome-copy">Write, explain, debug, or improve code with an assistant that thinks like a senior engineer.</p>
                    <div class="starter-grid">
                        <button class="starter-card" type="button" data-prompt="Build a responsive pricing card component with accessible HTML and CSS.">
                            <span class="starter-icon">↗</span>
                            <span><strong>Write code</strong><small>Start from a clear idea</small></span>
                        </button>
                        <button class="starter-card" type="button" data-prompt="Explain this code step by step, including the tradeoffs and anything that could surprise a new developer.">
                            <span class="starter-icon">◌</span>
                            <span><strong>Explain code</strong><small>Make complex logic clear</small></span>
                        </button>
                        <button class="starter-card" type="button" data-prompt="Debug the code I pasted and return a corrected, complete version with a short explanation of the root cause.">
                            <span class="starter-icon">⌁</span>
                            <span><strong>Debug a problem</strong><small>Find the signal in the noise</small></span>
                        </button>
                        <button class="starter-card" type="button" data-prompt="Improve this code for readability, performance, and maintainability. Return the complete improved version.">
                            <span class="starter-icon">↗</span>
                            <span><strong>Improve code</strong><small>Polish what already works</small></span>
                        </button>
                    </div>
                </div>
                <div class="messages" id="messages" aria-live="polite"></div>
            </section>

            <section class="composer-wrap">
                <div class="context-preview" id="context-preview" hidden>
                    <span class="context-file-icon">{ }</span>
                    <span><strong id="context-name">Code context</strong><small id="context-meta">Ready to include</small></span>
                    <button class="remove-context" type="button" id="remove-context" aria-label="Remove code context">×</button>
                </div>
                <div class="composer">
                    <div class="composer-tools">
                        <label class="tool-button" for="code-input" title="Add code context">
                            <span aria-hidden="true">{ }</span>
                            <span>Code context</span>
                        </label>
                        <input id="code-input" class="visually-hidden" type="file" accept=".js,.ts,.tsx,.jsx,.php,.py,.java,.c,.cpp,.cs,.go,.rs,.html,.css,.sql,.json,.txt">
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
                    <textarea id="message-input" rows="1" placeholder="Ask ForgeCode anything about your code..." aria-label="Message"></textarea>
                    <div class="composer-bottom">
                        <span class="composer-hint"><kbd>Shift</kbd> + <kbd>Enter</kbd> for a new line</span>
                        <button class="send-button" id="send-button" type="button" aria-label="Send message">
                            <span>Send</span><span aria-hidden="true">↗</span>
                        </button>
                    </div>
                </div>
                <p class="disclaimer">ForgeCode can make mistakes. Review generated code before shipping.</p>
            </section>
        </main>
    </div>

    <div class="toast" id="toast" role="status"></div>
    <div class="modal-backdrop" id="help-modal" hidden>
        <div class="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title">
            <button class="modal-close icon-button" type="button" data-action="close-help" aria-label="Close help">×</button>
            <p class="eyebrow accent-eyebrow">QUICK START</p>
            <h2 id="help-title">A faster way to get unstuck.</h2>
            <p>Ask for a complete implementation, paste a bug, or add a file as code context. ForgeCode will keep the answer practical and copy-ready.</p>
            <div class="help-list">
                <div><span>01</span><strong>Describe the outcome</strong><small>Say what you want the code to do.</small></div>
                <div><span>02</span><strong>Add context when useful</strong><small>Attach a file or paste the relevant code.</small></div>
                <div><span>03</span><strong>Review before shipping</strong><small>Use the copy button when the answer looks right.</small></div>
            </div>
        </div>
    </div>
    <script src="assets/config.js" defer></script>
    <script src="assets/app.js" defer></script>
</body>
</html>