# Phase 7: Social Features

## 7.1 Strategy Sharing
- [ ] Add `isPublic` flag to strategies
- [ ] Build share settings modal
  - [ ] Public/private toggle
  - [ ] Author visibility toggle
  - [ ] Allow copy toggle
  - [ ] Description field
- [ ] Create `strategies_public` collection
- [ ] Sync public strategies on publish

## 7.2 Public Strategy Browser
- [ ] Build browse page (`/strategies/browse`)
- [ ] Display strategy cards
  - [ ] Strategy name
  - [ ] Author (if visible)
  - [ ] Description preview
  - [ ] Performance metrics
  - [ ] Copy count
- [ ] Implement search
- [ ] Add filters (type, performance)
- [ ] Add sorting options

## 7.3 Copy/Fork Strategies
- [ ] Build copy button/action
- [ ] Create strategy copy in user's collection
- [ ] Link to original (`copiedFrom`)
- [ ] Increment copy count on original
- [ ] Allow modifications to copy
- [ ] Show "forked from" badge

## 7.4 Leaderboard Calculation
- [ ] Define ranking algorithm
- [ ] Create `updateLeaderboard` Cloud Function
- [ ] Calculate returns for opted-in users
- [ ] Calculate Sharpe ratios
- [ ] Rank by selected metric
- [ ] Store in `leaderboards` collection
- [ ] Schedule: daily

## 7.5 Leaderboard Display
- [ ] Build leaderboard page (`/leaderboard`)
- [ ] Show period tabs (weekly/monthly/all-time)
- [ ] Display ranking table
  - [ ] Rank
  - [ ] User (or anonymous)
  - [ ] Return %
  - [ ] Sharpe ratio
- [ ] Highlight current user
- [ ] Add opt-in prompt

## 7.6 Privacy Controls
- [ ] Build privacy settings section
- [ ] Leaderboard opt-in/out
- [ ] Display name vs anonymous
- [ ] Portfolio visibility
- [ ] Strategy sharing defaults
