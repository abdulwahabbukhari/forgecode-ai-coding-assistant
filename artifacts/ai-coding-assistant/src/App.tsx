import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Braces,
  Bug,
  Check,
  ChevronDown,
  CircleHelp,
  Code2,
  Copy,
  FileCode2,
  Menu,
  MessageSquareCode,
  PanelLeft,
  Plus,
  RotateCcw,
  Search,
  Send,
  Settings2,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';
import {
  useHealthCheck,
  useSendChatMessage,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

type Role = 'user' | 'assistant';

type ConversationMessage = {
  id: string;
  role: Role;
  content: string;
  model?: string;
  demo?: boolean;
};

const queryClient = new QueryClient();

const languages = [
  'Auto detect',
  'TypeScript',
  'JavaScript',
  'Python',
  'Go',
  'Rust',
  'SQL',
  'Java',
];

const starters = [
  {
    label: 'Explain this like I am reviewing a PR',
    icon: Search,
  },
  {
    label: 'Find the bug and suggest a safe fix',
    icon: Bug,
  },
  {
    label: 'Make this more readable and maintainable',
    icon: Wand2,
  },
  {
    label: 'Write tests for the edge cases',
    icon: Braces,
  },
];

const welcomeMessage: ConversationMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'I am ready when you are. Ask a question, paste a failing snippet, or bring a rough idea — I will help turn it into code you can ship.',
  model: 'wahab-ready',
};

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function MessageContent({
  message,
  onCopy,
  copiedId,
}: {
  message: ConversationMessage;
  onCopy: (value: string, id: string) => void;
  copiedId: string | null;
}) {
  if (message.role === 'user') {
    return <p>{message.content}</p>;
  }

  const blocks = message.content.split(/```([\w+#.-]*)\n([\s\S]*?)```/g);
  const pieces: ReactNode[] = [];
  let codeIndex = 0;

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (!block) continue;
    if (index % 3 === 0) {
      block.split(/\n\n+/g).forEach((paragraph, paragraphIndex) => {
        const clean = paragraph.trim();
        if (clean) {
          pieces.push(
            <p key={`paragraph-${index}-${paragraphIndex}`}>
              {clean.split('**').map((part, partIndex) =>
                partIndex % 2 === 1 ? (
                  <strong key={`strong-${partIndex}`}>{part}</strong>
                ) : (
                  part
                ),
              )}
            </p>,
          );
        }
      });
    } else if (index % 3 === 1) {
      const code = blocks[index + 1] ?? '';
      const codeId = `${message.id}-code-${codeIndex}`;
      codeIndex += 1;
      pieces.push(
        <div className="forge-code-block" key={codeId}>
          <div className="forge-code-head">
            <span data-testid={`text-code-language-${codeId}`}>
              {block || 'code'}
            </span>
            <button
              className="forge-copy-button"
              data-testid={`button-copy-code-${codeId}`}
              onClick={() => onCopy(code.trim(), codeId)}
              type="button"
            >
              {copiedId === codeId ? <Check size={12} /> : <Copy size={12} />}
              {copiedId === codeId ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="forge-code" data-testid={`code-block-${codeId}`}>
            {code.trim()}
          </pre>
        </div>,
      );
      index += 1;
    }
  }

  return <>{pieces}</>;
}

function Home() {
  const [messages, setMessages] = useState<ConversationMessage[]>([
    welcomeMessage,
  ]);
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('Auto detect');
  const [contextOpen, setContextOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const sendChat = useSendChatMessage();
  const health = useHealthCheck();

  useEffect(() => {
    if (!copiedId) return;
    const timer = window.setTimeout(() => setCopiedId(null), 1800);
    return () => window.clearTimeout(timer);
  }, [copiedId]);

  const startNewChat = () => {
    setMessages([{ ...welcomeMessage, id: createId('welcome') }]);
    setPrompt('');
    setCode('');
    setLanguage('Auto detect');
    setContextOpen(false);
    setLocalError(null);
    sendChat.reset();
    setMobileOpen(false);
    window.setTimeout(() => promptRef.current?.focus(), 0);
  };

  const chooseStarter = (value: string) => {
    setPrompt(value);
    window.setTimeout(() => promptRef.current?.focus(), 0);
  };

  const copyText = async (value: string, id: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
    } catch {
      setLocalError('Copy was blocked by the browser. Select the code to copy it manually.');
    }
  };

  const submitPrompt = () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || sendChat.isPending) return;

    setLocalError(null);
    sendChat.reset();
    const userMessage: ConversationMessage = {
      id: createId('user'),
      role: 'user',
      content: trimmedPrompt,
    };
    const requestMessages = [
      ...messages.map(({ role, content }) => ({ role, content })),
      { role: 'user' as const, content: trimmedPrompt },
    ];

    setMessages((current) => [...current, userMessage]);
    setPrompt('');

    sendChat.mutate(
      {
        data: {
          messages: requestMessages,
          code: code.trim() ? code : null,
          language: code.trim() ? language : null,
        },
      },
      {
        onSuccess: (response) => {
          setMessages((current) => [
            ...current,
            {
              id: createId('assistant'),
              role: 'assistant',
              content: response.message,
              model: response.model,
              demo: response.demo,
            },
          ]);
        },
        onError: (error) => {
          const errorResponse = error as { error?: string };
          setLocalError(
            errorResponse.error ||
              'WAHAB AI could not complete that request. Check the API settings and try again.',
          );
        },
      },
    );
  };

  const healthIsOnline = !health.isError && health.data?.status !== 'down';
  const lastMessage = messages[messages.length - 1];

  return (
    <div className="forge-app">
      <aside className={`forge-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="forge-brand">
          <div className="forge-mark" aria-hidden="true">
            <Code2 size={17} strokeWidth={2.5} />
          </div>
          <div>
            <div className="forge-brand-name">WAHAB AI</div>
            <div className="forge-brand-sub">version 2 · coding studio</div>
          </div>
          {mobileOpen && (
            <button
              className="forge-icon-button mobile-close"
              data-testid="button-close-mobile-sidebar"
              onClick={() => setMobileOpen(false)}
              type="button"
            >
              <X size={17} />
            </button>
          )}
        </div>

        <button
          className="forge-new-chat"
          data-testid="button-new-chat"
          onClick={startNewChat}
          type="button"
        >
          <Plus size={15} />
          New conversation
        </button>

        <div className="forge-sidebar-label">Recent work</div>
        <div className="forge-history">
          <button
            className="forge-history-row active"
            data-testid="button-active-conversation"
            onClick={() => promptRef.current?.focus()}
            type="button"
          >
            <MessageSquareCode size={14} />
            <span className="forge-history-title">Untitled conversation</span>
          </button>
        </div>

        <div className="forge-sidebar-spacer" />
        <div className="forge-health-card" data-testid="status-api-health">
          <div className="forge-health-line">
            <span
              className={`forge-status-dot ${healthIsOnline ? '' : 'offline'}`}
            />
            {health.isLoading
              ? 'Checking WAHAB AI status'
              : healthIsOnline
                ? 'WAHAB AI services online'
                : 'WAHAB AI services unavailable'}
          </div>
          <div className="forge-health-meta">API · local workspace</div>
        </div>
        <div className="forge-sidebar-footer">
          <button
            data-testid="button-open-guide"
            onClick={() => setHelpOpen((open) => !open)}
            type="button"
          >
            <CircleHelp size={14} /> Guide
          </button>
          <button
            data-testid="button-open-settings"
            onClick={() => setHelpOpen(true)}
            type="button"
          >
            <Settings2 size={14} /> Settings
          </button>
        </div>
      </aside>

      <section className="forge-workspace">
        <header className="forge-topbar">
          <div className="forge-topbar-left">
            <button
              className="forge-icon-button forge-mobile-menu"
              data-testid="button-open-mobile-sidebar"
              onClick={() => setMobileOpen(true)}
              type="button"
            >
              <Menu size={18} />
            </button>
            <div className="forge-breadcrumb">
              <PanelLeft size={13} />
              <span>Workspace</span>
              <ChevronDown size={12} />
              <strong>New conversation</strong>
            </div>
          </div>
          <div className="forge-topbar-actions">
            <div className="forge-kicker">
              <span className="forge-kicker-mark" />
              <span>Engineering room / 01</span>
            </div>
            <button
              className="forge-icon-button"
              data-testid="button-toggle-help"
              onClick={() => setHelpOpen((open) => !open)}
              type="button"
            >
              <CircleHelp size={17} />
            </button>
          </div>
        </header>

        <main className="forge-main">
          <div className="forge-intro">
            <div>
              <p className="forge-eyebrow">WAHAB AI · focused coding assistance</p>
              <h1 className="forge-title">
                Turn rough questions into <em>shippable code.</em>
              </h1>
            </div>
            <div className="forge-intro-note">
              Bring the context.
              <br />
              Leave with a plan.
            </div>
          </div>

          <div className="forge-content-grid">
            <section
              className="forge-conversation"
              aria-label="Coding conversation"
            >
              {messages.map((message) => (
                <article
                  className={`forge-message ${message.role}`}
                  data-testid={`message-${message.role}-${message.id}`}
                  key={message.id}
                >
                  <div className="forge-avatar">
                    {message.role === 'user' ? 'YOU' : 'FC'}
                  </div>
                  <div className="forge-message-stack">
                    <div className="forge-message-meta">
                      {message.role === 'user'
                        ? 'Your question'
                        : message.model
                          ? `WAHAB AI · ${message.model}`
                          : 'WAHAB AI'}
                    </div>
                    <div className="forge-message-bubble">
                      <MessageContent
                        copiedId={copiedId}
                        message={message}
                        onCopy={copyText}
                      />
                    </div>
                    {message.role === 'assistant' && (
                      <div className="forge-message-footer">
                        <button
                          data-testid={`button-copy-message-${message.id}`}
                          onClick={() => copyText(message.content, message.id)}
                          type="button"
                        >
                          {copiedId === message.id ? (
                            <Check size={11} />
                          ) : (
                            <Copy size={11} />
                          )}
                          {copiedId === message.id ? 'Copied' : 'Copy response'}
                        </button>
                        {!message.demo && <span>Ready for review</span>}
                      </div>
                    )}
                  </div>
                </article>
              ))}

              {sendChat.isPending && (
                <div className="forge-loading" data-testid="status-loading">
                  <span className="forge-loading-bars" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                  WAHAB AI is reasoning through the context…
                </div>
              )}

              {localError && (
                <div className="forge-error" data-testid="status-error">
                  <span>{localError}</span>
                  <button
                    data-testid="button-dismiss-error"
                    onClick={() => setLocalError(null)}
                    type="button"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {messages.length === 1 && !sendChat.isPending && (
                <div>
                  <div className="forge-message-meta">Start with a direction</div>
                  <div className="forge-starters">
                    {starters.map((starter) => {
                      const StarterIcon = starter.icon;
                      return (
                        <button
                          className="forge-starter"
                          data-testid={`button-starter-${starter.label
                            .toLowerCase()
                            .replaceAll(' ', '-')}`}
                          key={starter.label}
                          onClick={() => chooseStarter(starter.label)}
                          type="button"
                        >
                          <StarterIcon size={15} />
                          <span>{starter.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <form
                className="forge-composer"
                data-testid="form-chat-composer"
                onSubmit={(event) => {
                  event.preventDefault();
                  submitPrompt();
                }}
              >
                <textarea
                  className="forge-textarea"
                  data-testid="input-chat-prompt"
                  onChange={(event) => setPrompt(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      submitPrompt();
                    }
                  }}
                  placeholder="Ask WAHAB AI anything about your code…"
                  ref={promptRef}
                  value={prompt}
                />

                {contextOpen && (
                  <div className="forge-code-context-wrap">
                    <div className="forge-context-label">
                      <span>Code context · optional</span>
                      <button
                        aria-label="Remove code context"
                        data-testid="button-close-code-context"
                        onClick={() => setContextOpen(false)}
                        type="button"
                      >
                        <X size={13} />
                      </button>
                    </div>
                    <textarea
                      className="forge-code-context"
                      data-testid="input-code-context"
                      onChange={(event) => setCode(event.target.value)}
                      placeholder="Paste a function, stack trace, or file excerpt here…"
                      value={code}
                    />
                  </div>
                )}

                <div className="forge-composer-row">
                  <div className="forge-composer-tools">
                    <select
                      aria-label="Programming language"
                      className="forge-language"
                      data-testid="select-language"
                      onChange={(event) => setLanguage(event.target.value)}
                      value={language}
                    >
                      {languages.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <button
                      className={`forge-context-toggle ${
                        contextOpen ? 'active' : ''
                      }`}
                      data-testid="button-toggle-code-context"
                      onClick={() => setContextOpen((open) => !open)}
                      type="button"
                    >
                      <FileCode2 size={13} />
                      <span>{code.trim() ? 'Context added' : 'Add code'}</span>
                    </button>
                  </div>
                  <button
                    className="forge-send"
                    data-testid="button-send-message"
                    disabled={!prompt.trim() || sendChat.isPending}
                    title="Send message"
                    type="submit"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </form>
              <div className="forge-message-footer">
                <span>Shift + Enter for a new line</span>
                {lastMessage?.role === 'assistant' && (
                  <>
                    <span>·</span>
                    <span>Responses are ready for review</span>
                  </>
                )}
              </div>
            </section>

            <aside className="forge-side-panel">
              <h2 className="forge-side-heading">A better first pass</h2>
              <div className="forge-side-card">
                <Sparkles size={16} color="#ef795f" />
                <h3>Give WAHAB AI a clear job</h3>
                <p>
                  The sharper the intent, the more useful the first answer. Say
                  what you expected, not just what broke.
                </p>
                <ul className="forge-side-list">
                  <li>
                    <ArrowUpRight size={12} /> Expected behavior
                  </li>
                  <li>
                    <ArrowUpRight size={12} /> What you tried
                  </li>
                  <li>
                    <ArrowUpRight size={12} /> The constraint
                  </li>
                </ul>
              </div>
              <div className="forge-side-card">
                <BookOpen size={16} color="#367f82" />
                  <h3>Context is a force multiplier</h3>
                <p>
                  Paste the smallest useful slice of code. Add the language so
                  suggestions stay idiomatic.
                </p>
              </div>
              <div className="forge-side-card">
                <Activity size={16} color="#367f82" />
                  <h3>Built for the loop</h3>
                <p>
                  Ask, inspect, refine. Keep the conversation narrow and the
                  changes easy to review.
                </p>
              </div>
            </aside>
          </div>
        </main>
      </section>

      {helpOpen && (
        <div className="forge-help-panel" data-testid="panel-help">
          <div className="forge-help-header">
            <h2>Workspace guide</h2>
            <button
              className="forge-icon-button"
              data-testid="button-close-help"
              onClick={() => setHelpOpen(false)}
              type="button"
            >
              <X size={15} />
            </button>
          </div>
          <p>
            Start with a prompt or one of the review shortcuts. Add code
            context when the answer depends on a specific implementation.
          </p>
          <div className="forge-help-shortcut">
            <span>Send your question</span>
            <kbd>Enter</kbd>
          </div>
          <div className="forge-help-shortcut">
            <span>New line in prompt</span>
            <kbd>Shift + Enter</kbd>
          </div>
          <div className="forge-help-shortcut">
            <span>Reset the room</span>
            <button
              data-testid="button-help-new-chat"
              onClick={startNewChat}
              type="button"
            >
              <RotateCcw size={11} /> New chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;