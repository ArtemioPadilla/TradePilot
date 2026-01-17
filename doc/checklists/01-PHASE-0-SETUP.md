# Phase 0: Pre-Development Setup

## Environment Setup
- [x] Install Node.js (v18+) and pnpm/npm
- [x] Install Python 3.9+ for Cloud Functions
- [x] Install Firebase CLI (`npm install -g firebase-tools`)
- [x] Set up code editor with recommended extensions

## Firebase Project
- [x] Create new Firebase project in console
- [x] Enable Authentication (Email/Password)
- [x] Create Firestore database (production mode) — `firestore.rules` configured
- [ ] Enable Cloud Functions (Blaze plan required) — deferred to Phase 2
- [x] Enable Cloud Storage — `storage.rules` configured
- [ ] Enable Cloud Messaging — deferred to Phase 3 (notifications)
- [x] Configure environment variables — `.env.development`, `.env.production`, `.env.example`

## Repository Structure
- [x] Create `web/` directory for Astro — full web app structure
- [ ] Create `functions/` directory for Cloud Functions — deferred to Phase 2
- [x] Create `docs/` directory for documentation — `doc/` with Sphinx setup
- [x] Update `.gitignore` for new directories
- [x] Set up monorepo tooling (if needed) — Makefile with unified commands

## CI/CD Pipelines
- [x] Create `.github/workflows/deploy-web.yml`
- [ ] Create `.github/workflows/deploy-functions.yml` — deferred (no functions yet)
- [x] Create `.github/workflows/docs.yml`
- [x] Create `.github/workflows/test.yml` — Python + Playwright tests
- [x] Create `.github/workflows/lighthouse.yml` — performance audits
- [ ] Configure GitHub repository secrets — **ACTION REQUIRED** (see below)
- [ ] Set up branch protection rules — **ACTION REQUIRED** (optional)

---

## Required GitHub Secrets

Add these in **Settings → Secrets and variables → Actions**:

| Secret Name | Description |
|-------------|-------------|
| `FIREBASE_API_KEY` | Firebase Web API Key |
| `FIREBASE_AUTH_DOMAIN` | e.g., `your-project.firebaseapp.com` |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_STORAGE_BUCKET` | e.g., `your-project.appspot.com` |
| `FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID |
| `FIREBASE_APP_ID` | Firebase App ID |
| `LHCI_GITHUB_APP_TOKEN` | (Optional) Lighthouse CI GitHub token |
