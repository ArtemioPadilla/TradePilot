# Phase 0: Pre-Development Setup

## Environment Setup
- [ ] Install Node.js (v18+) and pnpm/npm
- [ ] Install Python 3.9+ for Cloud Functions
- [ ] Install Firebase CLI (`npm install -g firebase-tools`)
- [ ] Set up code editor with recommended extensions

## Firebase Project
- [ ] Create new Firebase project in console
- [ ] Enable Authentication (Email/Password)
- [ ] Create Firestore database (production mode)
- [ ] Enable Cloud Functions (Blaze plan required)
- [ ] Enable Cloud Storage
- [ ] Enable Cloud Messaging
- [ ] Download service account credentials
- [ ] Configure environment variables

## Repository Structure
- [ ] Create `web/` directory for Astro
- [ ] Create `functions/` directory for Cloud Functions
- [ ] Create `docs/` directory for documentation
- [ ] Update `.gitignore` for new directories
- [ ] Set up monorepo tooling (if needed)

## CI/CD Pipelines
- [ ] Create `.github/workflows/deploy-web.yml`
- [ ] Create `.github/workflows/deploy-functions.yml`
- [ ] Create `.github/workflows/docs.yml`
- [ ] Configure GitHub repository secrets
- [ ] Set up branch protection rules
