# Phase 7: Social Features

> **Status:** 85% complete. Sharing + browse + copy all done. Leaderboard backend missing.
> **Services:** leaderboard.ts (stub→real), integrations.ts (stub, P3)

## 7.1-7.3 Strategy Sharing ✅ DONE
- [x] Public/private toggle, browse page, copy/fork, all UI

## 7.4 Leaderboard Cloud Function
- [ ] Create `updateLeaderboard` Cloud Function
- [ ] Calculate returns + Sharpe for opted-in users
- [ ] Rank by selected metric
- [ ] Store in `leaderboards` Firestore collection
- [ ] Schedule: daily at midnight UTC

```
subagent: S7.4-leaderboard-backend
  input: functions/src/index.ts, web/src/types/leaderboard.ts, web/src/lib/services/leaderboard.ts
  output: functions/src/social/updateLeaderboard.ts, web/src/lib/services/leaderboard.ts (real impl)
  acceptance: firebase emulators:exec passes, leaderboard data populates
  est: 45min
  deps: none
```

## 7.5 Leaderboard Display ✅ DONE (UI)
- [x] Leaderboard page, period tabs, ranking table, user highlight

## 7.6 Privacy Controls ✅ DONE
- [x] All privacy settings implemented

## 7.7 Social Integrations (P3 — post-launch)
- [ ] Twitter/X share button for strategies
- [ ] Discord webhook for new public strategies
- [ ] RSS feed for public strategies

```
subagent: S7.7-social-integrations
  input: web/src/components/strategies/, web/src/lib/services/integrations.ts
  output: integrations.ts (real impl), web/src/components/social/ShareButtons.tsx
  acceptance: npm run build passes, share button generates correct URL
  est: 30min
  deps: none
```
