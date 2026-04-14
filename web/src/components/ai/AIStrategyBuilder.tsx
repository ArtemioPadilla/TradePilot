import { useState, useCallback } from 'react';
import { StrategyChat, type ChatMessage } from './StrategyChat';
import { CodePreview } from './CodePreview';
import { StrategyExplainer } from './StrategyExplainer';
import { generateStrategy } from '../../lib/services/ai-strategy';
import { executeStrategy, type ExecutionResult } from '../../lib/services/strategy-executor';
import { strategyTemplates } from '../../lib/services/strategy-templates';

type Tab = 'code' | 'explain' | 'results';

export default function AIStrategyBuilder() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState('');
  const [explanation, setExplanation] = useState('');
  const [strategyName, setStrategyName] = useState('');
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('code');
  const [isEditable, setIsEditable] = useState(false);

  const handleSend = useCallback(async (prompt: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setExecutionResult(null);

    try {
      const response = await generateStrategy({ prompt, mode: 'demo' });

      if (response.success) {
        setCode(response.code);
        setExplanation(response.explanation);
        setStrategyName(response.name);
        setActiveTab('code');
        setIsEditable(false);

        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: `I've generated a "${response.name}" strategy based on your description. Check the code panel on the right to review it, then click "Run Backtest" to test it against sample data.`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: `Sorry, I couldn't generate a strategy: ${response.error}. Please try a different description.`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: 'An unexpected error occurred. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  function handleRunBacktest() {
    const result = executeStrategy(code);
    setExecutionResult(result);
    setActiveTab('results');

    if (result.success) {
      const msg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: `Strategy executed successfully in ${result.executionTimeMs}ms. It ranked ${result.rankedSymbols?.length || 0} symbols. Check the Results tab for details.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, msg]);
    } else {
      const msg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: `Execution failed: ${result.error}. Try editing the code or describing a different strategy.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, msg]);
    }
  }

  function handleLoadTemplate(templateId: string) {
    const template = strategyTemplates.find(t => t.id === templateId);
    if (template) {
      handleSend(template.prompt);
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'code', label: 'Code' },
    { id: 'explain', label: 'Explain' },
    { id: 'results', label: 'Results' },
  ];

  return (
    <div className="ai-builder" data-testid="ai-strategy-builder">
      {/* Left Panel: Chat */}
      <div className="ai-builder-chat">
        <div className="panel-header">
          <div className="panel-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              <path d="M5 3v4" />
              <path d="M19 17v4" />
              <path d="M3 5h4" />
              <path d="M17 19h4" />
            </svg>
            <span>AI Strategy Builder</span>
          </div>
          <div className="demo-templates">
            <span className="template-label">Quick start:</span>
            {strategyTemplates.slice(0, 3).map(t => (
              <button
                key={t.id}
                className="template-chip"
                onClick={() => handleLoadTemplate(t.id)}
                disabled={isLoading}
                title={t.description}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
        <StrategyChat messages={messages} onSend={handleSend} isLoading={isLoading} />
      </div>

      {/* Right Panel: Code + Results */}
      <div className="ai-builder-output">
        <div className="panel-header">
          <div className="output-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`output-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {tab.id === 'results' && executionResult && (
                  <span className={`tab-dot ${executionResult.success ? 'success' : 'error'}`} />
                )}
              </button>
            ))}
          </div>
          {code && (
            <button
              className="run-btn"
              onClick={handleRunBacktest}
              disabled={isLoading || !code}
              data-testid="run-backtest-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="6 3 20 12 6 21 6 3" />
              </svg>
              Run Backtest
            </button>
          )}
        </div>

        <div className="output-content">
          {!code ? (
            <div className="empty-output" data-testid="empty-output">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <p>Your strategy code will appear here</p>
              <span>Describe a strategy in the chat or try a demo template</span>
            </div>
          ) : (
            <>
              {activeTab === 'code' && (
                <CodePreview
                  code={code}
                  onChange={isEditable ? setCode : () => setIsEditable(true)}
                  readOnly={!isEditable}
                />
              )}
              {activeTab === 'explain' && (
                <div className="explain-panel">
                  <StrategyExplainer
                    explanation={explanation}
                    strategyName={strategyName}
                    executionResult={null}
                  />
                </div>
              )}
              {activeTab === 'results' && (
                <div className="results-panel">
                  <StrategyExplainer
                    explanation=""
                    strategyName={strategyName}
                    executionResult={executionResult}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        .ai-builder {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          height: calc(100vh - var(--header-height, 56px) - 2rem);
          max-height: 900px;
          background: var(--border);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl, 16px);
          overflow: hidden;
        }

        .ai-builder-chat,
        .ai-builder-output {
          display: flex;
          flex-direction: column;
          background: var(--bg-primary);
          min-height: 0;
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
          border-bottom: 1px solid var(--border);
          background: var(--bg-secondary);
          flex-wrap: wrap;
          gap: var(--space-2, 0.5rem);
        }

        .panel-title {
          display: flex;
          align-items: center;
          gap: var(--space-2, 0.5rem);
          font-size: var(--text-sm, 0.875rem);
          font-weight: 600;
          color: var(--text-primary);
        }

        .panel-title svg {
          color: var(--accent);
        }

        .demo-templates {
          display: flex;
          align-items: center;
          gap: var(--space-2, 0.5rem);
          flex-wrap: wrap;
        }

        .template-label {
          font-size: var(--text-xs, 0.75rem);
          color: var(--text-muted);
        }

        .template-chip {
          padding: var(--space-1, 0.25rem) var(--space-2, 0.5rem);
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: var(--radius, 8px);
          color: var(--text-secondary);
          font-size: var(--text-xs, 0.75rem);
          cursor: pointer;
          transition: all var(--transition-fast, 150ms ease-out);
        }

        .template-chip:hover:not(:disabled) {
          border-color: var(--accent);
          color: var(--accent);
        }

        .template-chip:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .output-tabs {
          display: flex;
          gap: var(--space-1, 0.25rem);
        }

        .output-tab {
          padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
          background: transparent;
          border: none;
          border-radius: var(--radius, 8px);
          color: var(--text-muted);
          font-size: var(--text-sm, 0.875rem);
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast, 150ms ease-out);
          display: flex;
          align-items: center;
          gap: var(--space-1, 0.25rem);
        }

        .output-tab:hover {
          color: var(--text-primary);
        }

        .output-tab.active {
          background: var(--accent-muted, rgba(59, 130, 246, 0.1));
          color: var(--accent);
        }

        .tab-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .tab-dot.success { background: var(--positive, #10b981); }
        .tab-dot.error { background: var(--negative, #ef4444); }

        .run-btn {
          display: flex;
          align-items: center;
          gap: var(--space-2, 0.5rem);
          padding: var(--space-2, 0.5rem) var(--space-4, 1rem);
          background: var(--accent);
          color: white;
          border: none;
          border-radius: var(--radius, 8px);
          font-size: var(--text-sm, 0.875rem);
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast, 150ms ease-out);
        }

        .run-btn:hover:not(:disabled) {
          background: var(--accent-hover, var(--accent));
          transform: translateY(-1px);
        }

        .run-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .output-content {
          flex: 1;
          min-height: 0;
          overflow: auto;
        }

        .empty-output {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          color: var(--text-muted);
          gap: var(--space-2, 0.5rem);
          padding: var(--space-8, 2rem);
        }

        .empty-output svg {
          opacity: 0.3;
          margin-bottom: var(--space-2, 0.5rem);
        }

        .empty-output p {
          font-size: var(--text-base, 1rem);
          color: var(--text-secondary);
          margin: 0;
        }

        .empty-output span {
          font-size: var(--text-sm, 0.875rem);
        }

        .explain-panel,
        .results-panel {
          padding: var(--space-4, 1rem);
        }

        @media (max-width: 900px) {
          .ai-builder {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr 1fr;
            height: calc(100vh - var(--header-height, 56px) - 6rem);
            max-height: none;
          }
        }

        @media (max-width: 640px) {
          .demo-templates {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
