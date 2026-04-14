# Phase 9: PWA & Polish

> **Remaining services:** alpaca-websocket.ts (stub, P2), account-sync.ts (stub, P2), position-sync.ts (stub, P2).
> PWA manifest and offline indicator exist. Service worker caching and full offline mode need implementation.

## 9.1 Service Worker
- [ ] Create service worker file
- [ ] Configure Workbox (if using)
- [ ] Implement caching strategies
  - [ ] Cache-first for static assets
  - [ ] Network-first for API calls
  - [ ] Stale-while-revalidate for prices
- [ ] Handle cache versioning
- [ ] Implement cache cleanup

## 9.2 Offline Mode
- [x] Detect online/offline status (OfflineIndicator component)
- [x] Show offline indicator
- [ ] Cache critical data for offline
- [ ] Queue actions when offline
- [ ] Sync queued actions on reconnect
- [ ] Handle conflict resolution

## 9.3 PWA Manifest
- [x] Create `manifest.json`
- [x] Configure app name and icons
- [x] Set theme colors
- [x] Configure display mode
- [x] Add shortcuts
- [x] Add screenshots for install prompt
- [x] Generate PWA icons (72x72 to 512x512)
- [ ] Test installation on devices

## 9.4 Push Notification Handling
- [ ] Handle notification permission request
- [ ] Show install prompt at appropriate time
- [ ] Handle notification clicks
- [ ] Deep link to relevant content
- [ ] Handle background notifications

## 9.5 Responsive Design Refinement
- [x] Audit all pages on mobile (via Lighthouse)
- [x] Test on various screen sizes (E2E tests)
- [ ] Fix layout issues (if any identified)
- [ ] Optimize touch targets
- [ ] Improve mobile navigation
- [ ] Test landscape orientation

## 9.6 Performance Optimization
- [x] Audit with Lighthouse (88% accessibility, 96% best practices)
- [ ] Optimize bundle size
- [ ] Implement code splitting
- [ ] Lazy load non-critical components
- [ ] Optimize images
- [x] Add loading states (throughout components)
- [x] Add skeleton loading components (Skeleton, SkeletonCard, SkeletonTable)
- [ ] Reduce Firestore reads
- [ ] Target: < 2s dashboard load

## 9.7 Accessibility
- [x] Run accessibility audit (88% score)
- [x] Add ARIA labels (components include proper ARIA)
- [x] Ensure keyboard navigation (tab navigation works)
- [ ] Check color contrast
- [ ] Add screen reader support
- [ ] Test with accessibility tools
- [ ] Fix identified issues

## 9.8 Error Handling
- [x] Create error boundary components
- [x] Build user-friendly error pages (404.astro)
- [ ] Implement error logging
- [ ] Add retry mechanisms (in components)
- [x] Show helpful error messages
- [x] Handle network errors gracefully (OfflineIndicator)

## 9.9 User Feedback
- [x] Create FeedbackWidget component (floating feedback button)
- [x] Implement feedback form (bug, feature, general types)
- [ ] Send feedback to backend
- [ ] Show feedback confirmation
