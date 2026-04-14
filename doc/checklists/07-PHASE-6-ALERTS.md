# Phase 6: Alerts & Notifications

> **Status:** 80% complete. UI done. Backend stubs need real implementation.
> **Services:** alerts.ts (stub→real), notifications.ts (stub→real), push-notifications.ts (stub→real)

## 6.0-6.3 UI & Data Model ✅ DONE
- [x] E2E tests (808 passing)
- [x] Alert types, Firestore schema, conditions
- [x] Alert creation form, management page
- [x] Cloud Function checkAlerts skeleton

## 6.4 Real Alert Monitoring
- [ ] Wire checkAlerts Cloud Function to real Firestore reads
- [ ] Evaluate price conditions against Alpaca API
- [ ] Portfolio threshold evaluation (% change, value)
- [ ] Update alert status + trigger count

```
subagent: S6.4-alert-monitoring
  input: functions/src/index.ts, web/src/lib/services/alerts.ts
  output: functions/src/alerts/checkAlerts.ts (real impl)
  acceptance: firebase emulators:exec passes, alert triggers on condition met
  est: 45min
  deps: none
```

## 6.5 Push Notifications Backend
- [x] FCM config, permission request, service worker — all UI done
- [ ] Test on multiple devices (requires VAPID key)
- [ ] Wire push-notifications.ts to real FCM sends

```
subagent: S6.5-push-backend
  input: web/src/lib/services/push-notifications.ts, functions/src/
  output: push-notifications.ts (real Firestore + FCM), functions/src/notifications/sendPush.ts
  acceptance: npm run build passes, push notification received on test device
  est: 30min
  deps: S6.4
```

## 6.6 Email Notifications Backend
- [x] Email templates (alert, trade, daily digest, weekly summary)
- [ ] Choose provider and integrate (Resend recommended — simple, cheap)
- [ ] Wire processEmailQueue Cloud Function
- [ ] Handle unsubscribe

```
subagent: S6.6-email-backend
  input: functions/src/index.ts, web/src/lib/services/notifications.ts
  output: functions/src/notifications/emailService.ts
  acceptance: email sends on alert trigger (test with Resend sandbox)
  est: 45min
  deps: S6.4
```

## 6.7-6.8 Notification Center & Preferences ✅ DONE
- [x] Bell icon, dropdown, mark read, preferences form
