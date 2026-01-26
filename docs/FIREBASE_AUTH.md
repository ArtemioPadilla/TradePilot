# Firebase Authentication Configuration

This document describes the Firebase Authentication setup for TradePilot's web application.

## Overview

TradePilot uses Firebase Authentication with the following sign-in methods:

- **Email/Password** - Traditional email and password authentication
- **Google OAuth** - Sign in with Google account (popup-based)

## Google OAuth Setup

### Why Popup Instead of Redirect?

We use `signInWithPopup` instead of `signInWithRedirect` because:

1. **Cross-origin storage issues** - With redirect flow, auth state stored by `firebaseapp.com` cannot be read by `localhost` during development
2. **Simpler flow** - No need to handle redirect result on page load
3. **Better UX** - User stays on the same page during authentication

### COOP Header Configuration

Firebase's `signInWithPopup` needs to detect when the popup window closes. It does this by checking `window.closed` on the popup. However, browser security policies (COOP - Cross-Origin-Opener-Policy) can block this check.

Without proper headers, you'll see this warning repeatedly in the console:

```
Cross-Origin-Opener-Policy policy would block the window.closed call.
```

This causes Firebase to fall back to slow polling, making the popup take several seconds to close after the user selects their Google account.

#### Development Server

The Vite dev server is configured with the `same-origin-allow-popups` COOP header in `astro.config.mjs`:

```javascript
vite: {
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
}
```

This allows Firebase to efficiently detect popup closure.

#### Production Deployment

For production, configure COOP headers on your hosting platform:

**GitHub Pages** (via `_headers` file or GitHub Actions):
```
/*
  Cross-Origin-Opener-Policy: same-origin-allow-popups
```

**Netlify** (`netlify.toml`):
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Cross-Origin-Opener-Policy = "same-origin-allow-popups"
```

**Vercel** (`vercel.json`):
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin-allow-popups"
        }
      ]
    }
  ]
}
```

**Firebase Hosting** (`firebase.json`):
```json
{
  "hosting": {
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Cross-Origin-Opener-Policy",
            "value": "same-origin-allow-popups"
          }
        ]
      }
    ]
  }
}
```

## Authentication Flow

### Google Sign-In Flow

```
1. User clicks "Continue with Google"
2. LoginForm calls signInWithGoogle()
3. Google OAuth popup opens
4. User selects Google account
5. Popup closes, Firebase receives auth token
6. onAuthStateChanged fires in AuthInitializer
7. AuthInitializer sets optimistic user (immediate UI update)
8. AuthInitializer fetches Firestore profile (background)
9. If on /auth/login, redirects to /dashboard
```

### Key Components

| Component | Purpose |
|-----------|---------|
| `AuthInitializer` | Sets up Firebase auth listener, handles auth state changes |
| `AuthGuard` | Protects routes, shows loading state, redirects unauthenticated users |
| `LoginForm` | Login UI with email/password and Google sign-in |
| `RegisterForm` | Registration UI with email/password and Google sign-in |

### Auth State Management

Auth state is managed using nanostores:

```typescript
// stores/auth.ts
$user          // Current user object or null
$authLoading   // True while auth state is being determined
$isAuthenticated // True if user is logged in
$isActive      // True if user status is 'active'
$isPending     // True if user status is 'pending'
$isAdmin       // True if user role is 'admin'
$hasCachedAuth // True if cached auth exists (for optimistic UI)
```

## User Status Flow

New users go through this status flow:

```
1. Sign up → status: 'pending'
2. Admin approves → status: 'active'
3. (Optional) Admin suspends → status: 'suspended'
```

Users are redirected based on status:

| Status | Redirect Target |
|--------|-----------------|
| `active` | `/dashboard` |
| `pending` | `/auth/pending` |
| `suspended` | `/auth/suspended` |

## Troubleshooting

### Popup Takes Long to Close

**Symptom:** After selecting Google account, popup stays open for several seconds.

**Cause:** Missing COOP header, Firebase using slow polling.

**Fix:** Add `Cross-Origin-Opener-Policy: same-origin-allow-popups` header (see above).

### Auth State Not Persisting

**Symptom:** User is logged out on page refresh.

**Cause:** Usually a Firebase configuration issue or emulator misconfiguration.

**Fix:**
1. Check Firebase config in `.env`
2. Ensure auth domain matches your Firebase project
3. Check browser console for errors

### "Auth check timed out" Error

**Symptom:** AuthGuard shows timeout error after 30 seconds.

**Cause:** `AuthInitializer` not mounted on the page.

**Fix:** Ensure both `AuthInitializer` and `AuthGuard` are included in the layout:
```astro
<AuthInitializer client:load />
<AuthGuard client:load />
```

### Popup Blocked

**Symptom:** "Popup was blocked" error.

**Cause:** Browser popup blocker.

**Fix:** User must allow popups for the site, or click the button directly (not programmatically).

## References

- [Firebase Auth Web Docs](https://firebase.google.com/docs/auth/web/start)
- [Firebase Issue #8541 - COOP Warning](https://github.com/firebase/firebase-js-sdk/issues/8541)
- [MDN: Cross-Origin-Opener-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy)
- [Firebase Redirect Best Practices](https://firebase.google.com/docs/auth/web/redirect-best-practices)
