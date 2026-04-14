# Post-Launch

> **After MVP is live.** Deploy pipeline + monitoring + community growth.

## Deploy Pipeline

- [ ] Firebase Hosting for web app
- [ ] Cloud Run for FastAPI bridge
- [ ] Cloud Functions deploy via CI
- [ ] GitHub Pages for docs

```
subagent: S-POST-1-deploy
  input: web/astro.config.mjs, api/server.py, functions/, .github/workflows/
  output: .github/workflows/deploy.yml, firebase.json (updated), Dockerfile for api/
  acceptance: git push → auto-deploy to production
  est: 60min
  deps: none (but run last)
```

## Monitoring & Analytics

- [ ] Sentry for error tracking
- [ ] Firebase Performance monitoring
- [ ] Simple analytics (privacy-respecting, e.g., Plausible)
- [ ] Uptime monitoring (UptimeRobot or similar)

```
subagent: S-POST-2-monitoring
  input: web/src/pages/, api/server.py
  output: sentry config, analytics snippet, monitoring config
  acceptance: errors appear in Sentry, basic page views tracked
  est: 30min
  deps: S-POST-1
```

## Security Audit

- [ ] Review Firestore security rules (firestore.rules)
- [ ] Audit auth flow (invite codes, session tokens)
- [ ] Review credential handling (Alpaca keys encryption)
- [ ] Check API rate limiting
- [ ] OWASP top 10 review

```
subagent: S-POST-3-security
  input: firestore.rules, web/src/lib/services/auth.ts, api/server.py
  output: firestore.rules (hardened), doc/SECURITY_AUDIT.md
  acceptance: no critical vulnerabilities identified
  est: 60min
  deps: none
```

## Community & Growth

- [ ] HN "Show HN" post
- [ ] Reddit posts (r/algotrading, r/dataisbeautiful, r/Python)
- [ ] GitHub Sponsors setup
- [ ] Discord community server
- [ ] Blog post explaining architecture
- [ ] Example plugin repos (starter templates)

```
subagent: S-POST-4-community
  input: README.md, doc/COMPETITIVE_ANALYSIS.md, CONTRIBUTING.md
  output: memory/launch-content-tradepilot.md (all post content drafted)
  acceptance: all posts ready to publish
  est: 30min
  deps: none
```

## Expansion Roadmap (Future)

### More Brokers (P1)
- [ ] Interactive Brokers adapter
- [ ] Binance (crypto) adapter
- [ ] Coinbase adapter

### More Data Sources (P2)
- [ ] Polygon.io provider
- [ ] Alpha Vantage provider
- [ ] FRED (economic data) provider

### Asset Classes (P3)
- [ ] Options support
- [ ] Futures support
- [ ] Crypto spot + DeFi
- [ ] Multi-currency portfolios

### Mobile (P3)
- [ ] React Native or Capacitor wrapper
- [ ] Push notifications on mobile
- [ ] Quick trade from notification
