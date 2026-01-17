# Phase 1: Foundation

## 1.1 Astro Project Setup
- [ ] Initialize Astro project (`npm create astro@latest`)
- [ ] Configure `astro.config.mjs`
- [ ] Install Tailwind CSS integration
- [ ] Configure Tailwind with custom theme tokens
- [ ] Set up path aliases (`@components`, `@lib`, etc.)
- [ ] Create base TypeScript configuration
- [ ] Install chosen island framework (React/Svelte)

## 1.2 Theme System
- [ ] Create CSS custom properties structure
- [ ] Implement Bloomberg Terminal theme
- [ ] Implement Modern Fintech theme
- [ ] Implement Dashboard Dark theme
- [ ] Create theme switcher component
- [ ] Persist theme preference to localStorage
- [ ] Add system preference detection (prefers-color-scheme)

## 1.3 Layout Components
- [ ] Create `MainLayout.astro` (public pages)
- [ ] Create `DashboardLayout.astro` (authenticated pages)
- [ ] Create `AdminLayout.astro` (admin pages)
- [ ] Build responsive sidebar navigation
- [ ] Build top header with user menu
- [ ] Build mobile bottom navigation
- [ ] Implement responsive breakpoint system

## 1.4 Firebase Integration
- [ ] Install Firebase SDK (`firebase`, `firebase-admin`)
- [ ] Create `lib/firebase.ts` client configuration
- [ ] Set up Firebase emulators for local development
- [ ] Configure Firestore security rules (initial)
- [ ] Deploy initial Firestore indexes

## 1.5 Authentication - Core
- [ ] Create Firebase Auth context/store
- [ ] Build login page (`/auth/login`)
- [ ] Build registration page (`/auth/register`)
- [ ] Implement email/password sign-in
- [ ] Implement email/password sign-up
- [ ] Add password reset flow
- [ ] Create auth state persistence
- [ ] Build protected route wrapper

## 1.6 Authentication - Invite System
- [ ] Design invite code generation logic
- [ ] Create `invites` Firestore collection
- [ ] Build invite validation endpoint
- [ ] Create invite landing page (`/auth/invite/[code]`)
- [ ] Link invite to registration flow
- [ ] Mark invite as used on registration
- [ ] Handle expired/invalid invites

## 1.7 Authentication - Admin Approval
- [ ] Add `status` field to user documents (pending/active/suspended)
- [ ] Create pending user view in admin
- [ ] Build approve/reject user actions
- [ ] Send notification on approval (email/in-app)
- [ ] Restrict dashboard access for pending users
- [ ] Create "pending approval" message screen

## 1.8 Admin Console
- [ ] Create admin route guard
- [ ] Build admin dashboard page (`/admin`)
- [ ] Build user management table (`/admin/users`)
  - [ ] List all users with status
  - [ ] Filter by status (pending/active/suspended)
  - [ ] Search by email/name
  - [ ] Approve/suspend actions
- [ ] Build invite management (`/admin/invites`)
  - [ ] Create new invite form
  - [ ] List existing invites
  - [ ] Show invite status (pending/used/expired)
  - [ ] Copy invite link button
  - [ ] Revoke invite action

## 1.9 CI/CD Setup
- [ ] Configure Astro build for static output
- [ ] Set up GitHub Pages deployment workflow
- [ ] Configure Firebase Functions deployment
- [ ] Add build status badges to README
- [ ] Set up preview deployments for PRs
