# Phase 11: AI Features (Killer Differentiator)

> **Status:** NEW — no competitor does this well. This is what makes TradePilot viral.
> **Competitive advantage:** "Describe your strategy in plain English → AI backtests it → shows results"

## 11.1 AI Strategy Generator

- [ ] Create `/api/ai/generate-strategy` endpoint
- [ ] Accept natural language description → generate Python strategy code
- [ ] Use Claude/GPT via API (user provides key or we proxy)
- [ ] Validate generated code against Strategy interface
- [ ] Return code + explanation of what it does

```
subagent: S11.1-ai-strategy-generator
  input: api/server.py, tradepilot/strategy.py, tradepilot/plugins/base_broker.py
  output: api/ai/strategy_generator.py, web/src/components/ai/StrategyGenerator.tsx
  acceptance: POST with "buy tech stocks when they dip 5%" returns valid strategy code
  est: 60min
  deps: S5.5.1
```

## 11.2 AI Strategy Explainer

- [ ] Take any strategy code → explain in plain English
- [ ] Highlight risks, assumptions, edge cases
- [ ] Suggest improvements

```
subagent: S11.2-ai-explainer
  input: api/ai/strategy_generator.py
  output: api/ai/strategy_explainer.py, web/src/components/ai/StrategyExplainer.tsx
  acceptance: given momentum strategy code, returns readable explanation
  est: 30min
  deps: S11.1
```

## 11.3 AI Backtest Analyst

- [ ] After backtest completes, AI analyzes results
- [ ] Identifies why strategy underperformed/outperformed
- [ ] Suggests parameter tweaks
- [ ] Compares against benchmark

```
subagent: S11.3-ai-analyst
  input: api/ai/, tradepilot/metrics/
  output: api/ai/backtest_analyst.py, web/src/components/ai/BacktestInsights.tsx
  acceptance: after backtest, AI commentary appears with actionable insights
  est: 45min
  deps: S11.1
```

## 11.4 Natural Language Queries

- [ ] "How did my portfolio do last week?"
- [ ] "Which of my strategies has the best Sharpe ratio?"
- [ ] "Show me my top 5 performing stocks"
- [ ] Chat-style interface in dashboard

```
subagent: S11.4-nl-queries
  input: web/src/lib/services/, api/server.py
  output: api/ai/nl_query.py, web/src/components/ai/ChatInterface.tsx
  acceptance: "how did my portfolio do" returns formatted answer with data
  est: 60min
  deps: S11.1
```
