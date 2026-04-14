# Phase 7: Social Features

> **Remaining services:** leaderboard.ts (stub, P3), integrations.ts (stub, P3).
> Strategy sharing UI is complete. Leaderboard Cloud Function (updateLeaderboard) needs implementation.

## 7.1 Strategy Sharing
- [x] Add `isPublic` flag to strategies
- [x] Build share settings modal
  - [x] Public/private toggle
  - [x] Author visibility toggle
  - [x] Allow copy toggle
- [x] Create `strategies_public` collection (Firestore service ready)
- [x] Sync public strategies on publish (publishStrategyToPublic function)

## 7.2 Public Strategy Browser
- [x] Build browse page (`/strategies/browse`)
- [x] Display strategy cards
  - [x] Strategy name
  - [x] Author (if visible)
  - [x] Description preview
  - [x] Performance metrics
  - [x] Copy count
- [x] Implement search
- [x] Add filters (type, performance)
- [x] Add sorting options

## 7.3 Copy/Fork Strategies
- [x] Build copy button/action
- [x] Create strategy copy in user's collection
- [x] Link to original (`copiedFrom`)
- [x] Increment copy count on original
- [x] Allow modifications to copy
- [x] Show "forked" tag on copied strategies

## 7.4 Leaderboard Calculation
- [x] Define ranking algorithm (types/leaderboard.ts)
- [ ] Create `updateLeaderboard` Cloud Function
- [ ] Calculate returns for opted-in users
- [ ] Calculate Sharpe ratios
- [ ] Rank by selected metric
- [ ] Store in `leaderboards` collection
- [ ] Schedule: daily

## 7.5 Leaderboard Display
- [x] Build leaderboard page (`/leaderboard`)
- [x] Show period tabs (weekly/monthly/all-time)
- [x] Display ranking table
  - [x] Rank
  - [x] User (or anonymous)
  - [x] Return %
  - [x] Sharpe ratio
- [x] Highlight current user
- [x] Add opt-in prompt

## 7.6 Privacy Controls
- [x] Build privacy settings section
- [x] Leaderboard opt-in/out
- [x] Display name vs anonymous
- [x] Portfolio visibility
- [x] Strategy sharing defaults
