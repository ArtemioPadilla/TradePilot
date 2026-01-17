# Phase 1: Foundation

## 1.1 Astro Project Setup
- [x] Initialize Astro project (`npm create astro@latest`)
- [x] Configure `astro.config.mjs`
- [x] Install Tailwind CSS integration
- [x] Configure Tailwind with custom theme tokens
- [x] Set up path aliases (`@components`, `@lib`, etc.) — `tsconfig.json` + `astro.config.mjs`
- [x] Create base TypeScript configuration
- [x] Install chosen island framework (React)

## 1.2 Theme System
- [x] Create CSS custom properties structure
- [x] Implement Bloomberg Terminal theme
- [x] Implement Modern Fintech theme
- [x] Implement Dashboard Dark theme
- [x] Create theme switcher component
- [x] Persist theme preference to localStorage
- [x] Add system preference detection (prefers-color-scheme) — `stores/theme.ts`

## 1.3 Layout Components
- [x] Create `MainLayout.astro` (public pages)
- [x] Create `DashboardLayout.astro` (authenticated pages)
- [x] Create `AdminLayout.astro` (admin pages)
- [x] Build responsive sidebar navigation
- [x] Build top header with user menu
- [x] Build mobile bottom navigation — `MobileNav.astro`
- [x] Implement responsive breakpoint system

## 1.4 Firebase Integration
- [x] Install Firebase SDK (`firebase`, `firebase-admin`)
- [x] Create `lib/firebase.ts` client configuration
- [x] Set up Firebase emulators for local development
- [x] Configure environment-based Firebase (emulators vs production)
- [x] Create `.env.example`, `.env.development`, `.env.production`
- [x] Configure Firestore security rules (initial)
- [x] Create Firestore indexes configuration
- [x] Create Storage security rules
- [x] Update Makefile with emulator commands
- [ ] Deploy initial Firestore indexes to production

## 1.5 Authentication - Core
- [x] Create Firebase Auth context/store
- [x] Build login page (`/auth/login`)
- [x] Build registration page (`/auth/register`)
- [x] Implement email/password sign-in (LoginForm.tsx)
- [x] Implement email/password sign-up (RegisterForm.tsx)
- [x] Add password reset flow (ForgotPasswordForm.tsx)
- [x] Create auth state persistence (AuthProvider.tsx)
- [x] Build protected route wrapper (ProtectedRoute.tsx)

## 1.6 Authentication - Invite System
- [x] Design invite code generation logic
- [x] Create `invites` Firestore collection (in rules)
- [x] Build invite validation (lib/invites.ts)
- [x] Create invite landing page (`/auth/invite/[code]`)
- [x] Link invite to registration flow
- [x] Mark invite as used on registration
- [x] Handle expired/invalid invites

## 1.7 Authentication - Admin Approval
- [x] Add `status` field to user documents (pending/active/suspended)
- [x] Create pending user view in admin
- [x] Build approve/reject user actions
- [ ] Send notification on approval (email/in-app)
- [x] Restrict dashboard access for pending users
- [x] Create "pending approval" message screen

## 1.8 Admin Console
- [x] Create admin route guard
- [x] Build admin dashboard page (`/admin`)
- [x] Build user management table (`/admin/users`)
  - [x] List all users with status
  - [x] Filter by status (pending/active/suspended)
  - [x] Search by email/name
  - [x] Approve/suspend actions
- [x] Build invite management (`/admin/invites`)
  - [x] Create new invite form
  - [x] List existing invites
  - [x] Show invite status (pending/used/expired)
  - [x] Copy invite link button
  - [x] Revoke invite action

## 1.9 Quality Assurance Setup
- [x] Install Playwright for E2E testing
- [x] Create Playwright configuration
- [x] Write E2E tests for landing page
- [x] Write E2E tests for authentication pages
- [x] Write E2E tests for dashboard
- [x] Write E2E tests for admin pages
- [x] Write E2E tests for auth flows (forgot password, pending, suspended)
- [x] Write E2E tests for placeholder pages
- [x] Install Lighthouse CI for performance audits
- [x] Create Lighthouse CI configuration
- [x] Install Vitest for unit testing
- [x] Create unit test setup
- [x] Write sample unit tests
- [x] Add testing requirements to CLAUDE.md
- [ ] Set up test coverage reporting
- [ ] Add accessibility testing (axe-core)

## 1.10 Documentation
- [x] Set up Sphinx for API documentation
- [x] Create `docs/conf.py` configuration
- [x] Create `docs/index.rst` main page
- [x] Write getting started guide
- [x] Write installation guide
- [x] Write backtesting guide
- [x] Write strategies guide
- [x] Write optimization guide
- [x] Write live trading guide
- [x] Create API reference structure
- [x] Add custom CSS for documentation
- [ ] Generate API docs from docstrings
- [ ] Deploy documentation to GitHub Pages

## 1.11 CI/CD Setup
- [x] Configure Astro build for static output — `astro.config.mjs` output: 'static'
- [x] Set up GitHub Pages deployment workflow — `.github/workflows/deploy-web.yml`
- [ ] Configure Firebase Functions deployment — deferred (no functions yet)
- [x] Add build status badges to README
- [ ] Set up preview deployments for PRs
- [x] Add Playwright tests to CI pipeline — `.github/workflows/test.yml`
- [x] Add Lighthouse CI to CI pipeline — `.github/workflows/lighthouse.yml`
