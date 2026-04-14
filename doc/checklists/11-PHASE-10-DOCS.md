# Phase 10: Documentation

> **Status:** 20% complete. Sphinx setup + 4 guides exist. API reference + deployment pending.
> **Existing:** docs/guides/backtesting.md, strategies.md, optimization.md, live-trading.md

## 10.1 Documentation Site
- [ ] Configure Sphinx theme (furo or sphinx-book-theme)
- [ ] Set up navigation + search
- [ ] Deploy to GitHub Pages (`docs.tradepilot.app` or `/docs` path)

```
subagent: S10.1-docs-site
  input: docs/conf.py, docs/index.rst
  output: docs/ configured, .github/workflows/deploy-docs.yml
  acceptance: sphinx-build passes, docs deploy to GitHub Pages
  est: 30min
  deps: none
```

## 10.2 API Reference
- [ ] Configure autodoc for all Python modules
- [ ] Generate API docs with examples
- [ ] Add code snippets for every public method

```
subagent: S10.2-api-reference
  input: tradepilot/**/*.py, docs/conf.py
  output: docs/api/ (auto-generated), docs/conf.py (updated)
  acceptance: sphinx-build generates complete API reference
  est: 45min
  deps: S10.1
```

## 10.3 Getting Started + Tutorials
- [ ] Quick start: install → first backtest in 5 minutes
- [ ] Tutorial: build a momentum strategy step by step
- [ ] Tutorial: optimize portfolio allocation
- [ ] Tutorial: go live with Alpaca paper trading

```
subagent: S10.3-tutorials
  input: docs/guides/, tradepilot/examples/
  output: docs/tutorials/ (4 tutorials), docs/getting-started.md (updated)
  acceptance: all tutorials runnable as-is (copy-paste works)
  est: 45min
  deps: none
```

## 10.4 Plugin Development Guide
- [ ] How to create a broker adapter
- [ ] How to create a data provider
- [ ] How to create a strategy
- [ ] How to create a dashboard widget
- [ ] Template repos or cookiecutter

```
subagent: S10.4-plugin-guide
  input: tradepilot/plugins/, CONTRIBUTING.md, doc/PLUGIN_ARCHITECTURE.md
  output: docs/plugins/ (4 guides), examples/plugins/
  acceptance: example plugins load via registry
  est: 30min
  deps: S5.5.4
```

## 10.5 In-App Help — Remaining
- [x] Tooltips, onboarding tour, help icons done
- [ ] Feature discovery hints (new feature badges)

```
subagent: S10.5-feature-discovery
  input: web/src/components/common/OnboardingTour.tsx
  output: web/src/components/common/FeatureDiscovery.tsx
  acceptance: npm run build passes, new features show "NEW" badge
  est: 20min
  deps: none
```
