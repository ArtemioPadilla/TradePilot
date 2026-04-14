import { useState, useRef, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface StrategyChatProps {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  isLoading: boolean;
}

export function StrategyChat({ messages, onSend, isLoading }: StrategyChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className="strategy-chat">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <div className="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 12 18.469c-1.006 0-1.934.45-2.559 1.2l-.549-.549a5 5 0 0 1 0-7.07Z" />
              </svg>
            </div>
            <h3>Describe Your Strategy</h3>
            <p>Tell me what kind of trading strategy you want to build. I'll generate the code and explain how it works.</p>
            <div className="example-prompts">
              <span className="example-label">Try something like:</span>
              <button type="button" onClick={() => onSend('Buy stocks with the highest momentum over 20 days, rebalance monthly')}>
                "Buy stocks with highest momentum over 20 days"
              </button>
              <button type="button" onClick={() => onSend('Find oversold stocks using RSI below 30, buy the most oversold ones')}>
                "Find oversold stocks using RSI below 30"
              </button>
              <button type="button" onClick={() => onSend('Buy when 10-day moving average crosses above 50-day moving average')}>
                "MA crossover: 10-day crosses above 50-day"
              </button>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 6V2H8" />
                  <path d="m8 18-4 4V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2Z" />
                  <path d="M2 12h2" />
                  <path d="M9 11v2" />
                  <path d="M15 11v2" />
                  <path d="M20 12h2" />
                </svg>
              )}
            </div>
            <div className="message-content">
              <span className="message-role">{msg.role === 'user' ? 'You' : 'AI Builder'}</span>
              <p>{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="chat-message assistant">
            <div className="message-avatar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 6V2H8" />
                <path d="m8 18-4 4V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2Z" />
              </svg>
            </div>
            <div className="message-content">
              <span className="message-role">AI Builder</span>
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your trading strategy in English..."
          rows={1}
          disabled={isLoading}
        />
        <button type="submit" disabled={!input.trim() || isLoading} aria-label="Send message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12 7-7 7 7" />
            <path d="M12 19V5" />
          </svg>
        </button>
      </form>

      <style>{`
        .strategy-chat {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 0;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: var(--space-4, 1rem);
          display: flex;
          flex-direction: column;
          gap: var(--space-4, 1rem);
        }

        .chat-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: var(--space-8, 2rem) var(--space-4, 1rem);
          flex: 1;
        }

        .empty-icon {
          color: var(--accent);
          opacity: 0.6;
          margin-bottom: var(--space-4, 1rem);
        }

        .chat-empty h3 {
          color: var(--text-primary);
          font-size: var(--text-lg, 1.125rem);
          margin: 0 0 var(--space-2, 0.5rem);
        }

        .chat-empty p {
          color: var(--text-muted);
          font-size: var(--text-sm, 0.875rem);
          margin: 0 0 var(--space-6, 1.5rem);
          max-width: 360px;
        }

        .example-prompts {
          display: flex;
          flex-direction: column;
          gap: var(--space-2, 0.5rem);
          width: 100%;
          max-width: 400px;
        }

        .example-label {
          font-size: var(--text-xs, 0.75rem);
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: var(--space-1, 0.25rem);
        }

        .example-prompts button {
          background: var(--bg-tertiary, var(--bg-hover));
          border: 1px solid var(--border);
          border-radius: var(--radius-md, 8px);
          padding: var(--space-3, 0.75rem);
          color: var(--text-secondary);
          font-size: var(--text-sm, 0.875rem);
          cursor: pointer;
          text-align: left;
          transition: all var(--transition-fast, 150ms ease-out);
        }

        .example-prompts button:hover {
          border-color: var(--accent);
          color: var(--text-primary);
          background: var(--accent-muted, rgba(59, 130, 246, 0.1));
        }

        .chat-message {
          display: flex;
          gap: var(--space-3, 0.75rem);
          align-items: flex-start;
        }

        .message-avatar {
          width: 32px;
          height: 32px;
          border-radius: var(--radius, 8px);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .chat-message.user .message-avatar {
          background: var(--bg-tertiary, var(--bg-hover));
          color: var(--text-secondary);
        }

        .chat-message.assistant .message-avatar {
          background: var(--accent-muted, rgba(59, 130, 246, 0.1));
          color: var(--accent);
        }

        .message-content {
          flex: 1;
          min-width: 0;
        }

        .message-role {
          font-size: var(--text-xs, 0.75rem);
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: var(--space-1, 0.25rem);
        }

        .message-content p {
          margin: 0;
          color: var(--text-primary);
          font-size: var(--text-sm, 0.875rem);
          line-height: 1.6;
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: var(--space-2, 0.5rem) 0;
        }

        .typing-indicator span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--text-muted);
          animation: typing 1.4s infinite ease-in-out;
        }

        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typing {
          0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
          30% { opacity: 1; transform: scale(1); }
        }

        .chat-input-form {
          display: flex;
          gap: var(--space-2, 0.5rem);
          padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
          border-top: 1px solid var(--border);
          background: var(--bg-secondary);
        }

        .chat-input-form textarea {
          flex: 1;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: var(--radius-md, 8px);
          padding: var(--space-3, 0.75rem);
          color: var(--text-primary);
          font-size: var(--text-sm, 0.875rem);
          font-family: inherit;
          resize: none;
          outline: none;
          transition: border-color var(--transition-fast, 150ms ease-out);
        }

        .chat-input-form textarea:focus {
          border-color: var(--accent);
        }

        .chat-input-form textarea::placeholder {
          color: var(--text-muted);
        }

        .chat-input-form button[type="submit"] {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md, 8px);
          background: var(--accent);
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all var(--transition-fast, 150ms ease-out);
        }

        .chat-input-form button[type="submit"]:hover:not(:disabled) {
          background: var(--accent-hover, var(--accent));
          transform: translateY(-1px);
        }

        .chat-input-form button[type="submit"]:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
