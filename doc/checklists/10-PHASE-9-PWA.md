# Phase 9: PWA & Polish

> **Status:** 50% complete. PWA manifest + offline indicator + skeletons done. Service worker + perf optimization pending.
> **Services:** alpaca-websocket.ts (stub), account-sync.ts (stub), position-sync.ts (stub)

## 9.1 Service Worker
- [ ] Create service worker with Workbox
- [ ] Cache-first for static assets, network-first for API, stale-while-revalidate for prices
- [ ] Cache versioning + cleanup

```
subagent: S9.1-service-worker
  input: web/public/manifest.json, web/astro.config.mjs
  output: web/public/sw.js, web/src/lib/sw-register.ts
  acceptance: npm run build passes, Lighthouse PWA score > 90
  est: 45min
  deps: none
```

## 9.2 Offline Mode
- [x] Online/offline detection + indicator done
- [ ] Cache critical data (portfolio, holdings) in IndexedDB
- [ ] Queue actions offline → sync on reconnect
- [ ] Conflict resolution for stale data

```
subagent: S9.2-offline-mode
  input: web/src/components/common/OfflineIndicator.tsx, web/src/lib/services/
  output: web/src/lib/offline/cache.ts, web/src/lib/offline/syncQueue.ts
  acceptance: npm run build passes, app shows cached data when offline
  est: 60min
  deps: S9.1
```

## 9.3 PWA Install — Remaining
- [x] Manifest, icons, theme, shortcuts, screenshots done
- [ ] Test installation on Android + iOS + desktop

## 9.4 Real-time WebSocket
- [ ] Implement alpaca-websocket.ts for live price streaming
- [ ] Implement account-sync.ts for real-time position updates
- [ ] Implement position-sync.ts for portfolio sync

```
subagent: S9.4-websocket
  input: web/src/lib/services/alpaca-websocket.ts, web/src/lib/services/alpaca.ts
  output: alpaca-websocket.ts (real impl), account-sync.ts (real impl), position-sync.ts (real impl)
  acceptance: npm run build passes, live prices update in dashboard without refresh
  est: 60min
  deps: none
```

## 9.5 Responsive Design
- [x] Mobile audit + E2E tests done
- [ ] Fix remaining layout issues
- [ ] Optimize touch targets (48px minimum)
- [ ] Test landscape orientation

```
subagent: S9.5-responsive
  input: web/src/components/, web/src/styles/
  output: CSS fixes across components
  acceptance: Lighthouse accessibility > 95, all touch targets ≥ 48px
  est: 30min
  deps: none
```

## 9.6 Performance Optimization
- [x] Lighthouse audit done (88% a11y, 96% best practices)
- [ ] Bundle analysis + code splitting
- [ ] Lazy load non-critical components
- [ ] Optimize images (WebP, srcset)
- [ ] Reduce Firestore reads (batch, cache)
- [ ] Target: < 2s dashboard load

```
subagent: S9.6-performance
  input: web/astro.config.mjs, web/src/pages/, web/src/components/
  output: updated configs + lazy-loaded components
  acceptance: Lighthouse performance > 90, bundle < 500KB
  est: 45min
  deps: none
```

## 9.7 Accessibility
- [x] ARIA labels + keyboard nav done
- [ ] Color contrast audit (WCAG 2.1 AA)
- [ ] Screen reader testing
- [ ] Fix identified issues

```
subagent: S9.7-accessibility
  input: web/src/components/, web/src/styles/
  output: CSS + ARIA fixes
  acceptance: Lighthouse accessibility ≥ 95, axe-core 0 violations
  est: 30min
  deps: none
```

## 9.8-9.9 Error Handling & Feedback ✅ MOSTLY DONE
- [x] Error boundaries, 404 page, error messages, feedback widget
- [ ] Wire feedback form to backend (deferred)
