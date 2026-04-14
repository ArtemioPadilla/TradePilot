import { useState } from 'react';
import { BookOpen, HelpCircle, Library, ChevronDown, ChevronRight, Clock, ArrowRight } from 'lucide-react';
import Glossary from './Glossary';

type Tab = 'glossary' | 'guides' | 'faq';

interface Guide {
  title: string;
  description: string;
  readTime: string;
  href: string;
}

interface FaqEntry {
  question: string;
  answer: string;
}

const GUIDES: Guide[] = [
  {
    title: 'Risk Management Fundamentals',
    description: 'Learn how to protect your portfolio with stop-losses, position sizing, diversification, and drawdown limits. Essential reading before live trading.',
    readTime: '8 min read',
    href: '/learn/risk-management',
  },
  {
    title: 'Strategy Types Explained',
    description: 'Understand the differences between momentum, mean reversion, and smart beta strategies. Learn when each approach works best and how TradePilot implements them.',
    readTime: '12 min read',
    href: '/learn/strategy-types',
  },
  {
    title: 'Backtesting Pitfalls',
    description: 'Avoid common mistakes like look-ahead bias, survivorship bias, and overfitting. Learn how to interpret backtest results and build strategies that generalize.',
    readTime: '10 min read',
    href: '/learn/backtesting-pitfalls',
  },
];

const FAQ_ENTRIES: FaqEntry[] = [
  {
    question: 'What is TradePilot and how does it work?',
    answer: 'TradePilot is an algorithmic trading platform that unifies backtesting and live trading. You define a strategy (asset selection + weight optimization), test it against historical data using the TPS simulator, and when ready, deploy it for live execution via the TPT trader with your broker account.',
  },
  {
    question: 'How do I connect my brokerage account?',
    answer: 'Navigate to Settings > Integrations and add your broker credentials. TradePilot currently supports Alpaca for live trading. You will need an API key and secret from your Alpaca account. Paper trading accounts are recommended for initial testing.',
  },
  {
    question: 'What does the Sharpe ratio tell me?',
    answer: 'The Sharpe ratio measures risk-adjusted return: how much excess return you earn per unit of volatility. A ratio above 1.0 is generally considered good, above 2.0 is very good, and above 3.0 is excellent. It helps you compare strategies that have different risk profiles.',
  },
  {
    question: 'Can I lose more money than I invest?',
    answer: 'With standard equity trading (no leverage or margin), your maximum loss is limited to your invested capital. However, leveraged positions or short selling can amplify losses beyond your initial investment. TradePilot defaults to long-only, unleveraged strategies.',
  },
  {
    question: 'How often does TradePilot rebalance my portfolio?',
    answer: 'Rebalancing frequency is configurable. The TPS simulator and TPT trader accept a rebalancing interval parameter. Common choices are weekly, bi-weekly, or monthly. More frequent rebalancing captures signals faster but incurs higher transaction costs.',
  },
  {
    question: 'Why do backtest results differ from live trading performance?',
    answer: 'Several factors cause divergence: slippage (difference between expected and actual execution price), transaction costs, market impact of your orders, look-ahead bias in data, and changing market regimes. Always treat backtest results as optimistic estimates and account for these factors in your analysis.',
  },
];

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
  },
  header: {
    marginBottom: 'var(--space-8)',
  },
  title: {
    fontSize: 'var(--text-3xl)',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-2)',
  },
  subtitle: {
    fontSize: 'var(--text-base)',
    color: 'var(--text-secondary)',
    lineHeight: 'var(--leading-normal)',
  },
  tabBar: {
    display: 'flex',
    gap: 'var(--space-1)',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-1)',
    marginBottom: 'var(--space-8)',
    border: '1px solid var(--border)',
  },
  tabButton: (isActive: boolean) => ({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    padding: 'var(--space-3) var(--space-4)',
    fontSize: 'var(--text-sm)',
    fontWeight: 500,
    borderRadius: 'var(--radius-md)',
    border: 'none',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    fontFamily: 'inherit',
    backgroundColor: isActive ? 'var(--accent)' : 'transparent',
    color: isActive ? 'white' : 'var(--text-secondary)',
  }),
  guidesGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-4)',
  },
  guideCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--space-6)',
    transition: 'transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast)',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'block',
  },
  guideHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 'var(--space-3)',
  },
  guideTitle: {
    fontSize: 'var(--text-lg)',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 'var(--space-2)',
  },
  guideDescription: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary)',
    lineHeight: 'var(--leading-relaxed)',
    marginBottom: 'var(--space-4)',
  },
  guideFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readTime: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    fontSize: 'var(--text-xs)',
    color: 'var(--text-muted)',
  },
  readLink: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    fontSize: 'var(--text-sm)',
    color: 'var(--accent)',
    fontWeight: 500,
  },
  faqList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-3)',
  },
  faqItem: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
  },
  faqQuestion: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: 'var(--space-4) var(--space-5)',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-base)',
    fontWeight: 500,
    fontFamily: 'inherit',
    textAlign: 'left' as const,
    gap: 'var(--space-4)',
    transition: 'background-color var(--transition-fast)',
  },
  faqAnswer: {
    padding: '0 var(--space-5) var(--space-5)',
    color: 'var(--text-secondary)',
    fontSize: 'var(--text-sm)',
    lineHeight: 'var(--leading-relaxed)',
    borderTop: '1px solid var(--border)',
    paddingTop: 'var(--space-4)',
  },
};

const TAB_CONFIG: { id: Tab; label: string; icon: typeof BookOpen }[] = [
  { id: 'glossary', label: 'Glossary', icon: Library },
  { id: 'guides', label: 'Guides', icon: BookOpen },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
];

export default function LearnPage() {
  const [activeTab, setActiveTab] = useState<Tab>('glossary');
  const [expandedFaqs, setExpandedFaqs] = useState<Set<number>>(new Set());

  const toggleFaq = (index: number) => {
    setExpandedFaqs((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Learn</h1>
        <p style={styles.subtitle}>
          Build your trading knowledge with our glossary, guides, and frequently asked questions.
        </p>
      </div>

      <div style={styles.tabBar} role="tablist">
        {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => setActiveTab(id)}
            style={styles.tabButton(activeTab === id)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'glossary' && <Glossary />}

      {activeTab === 'guides' && (
        <div style={styles.guidesGrid}>
          {GUIDES.map((guide) => (
            <a key={guide.href} href={guide.href} style={styles.guideCard}>
              <div>
                <h3 style={styles.guideTitle}>{guide.title}</h3>
                <p style={styles.guideDescription}>{guide.description}</p>
              </div>
              <div style={styles.guideFooter}>
                <span style={styles.readTime}>
                  <Clock size={14} />
                  {guide.readTime}
                </span>
                <span style={styles.readLink}>
                  Read guide
                  <ArrowRight size={14} />
                </span>
              </div>
            </a>
          ))}
        </div>
      )}

      {activeTab === 'faq' && (
        <div style={styles.faqList}>
          {FAQ_ENTRIES.map((faq, index) => {
            const isExpanded = expandedFaqs.has(index);
            return (
              <div key={index} style={styles.faqItem}>
                <button
                  onClick={() => toggleFaq(index)}
                  style={styles.faqQuestion}
                  aria-expanded={isExpanded}
                >
                  <span>{faq.question}</span>
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                {isExpanded && (
                  <div style={styles.faqAnswer}>{faq.answer}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
