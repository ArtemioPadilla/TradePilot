# Phase 6: Alerts & Notifications

## 6.0 E2E Tests (Required)
- [x] Write E2E tests for alert creation form
- [x] Write E2E tests for alerts list
- [x] Write E2E tests for notification center
- [x] Write E2E tests for alert type configurations
- [x] Write E2E tests for notification preferences form
- [x] Ensure all tests pass (808 tests passing)

## 6.1 Alert Data Model
- [x] Define alert types enum
- [x] Create alert Firestore schema
- [x] Define condition operators (>, <, =, crosses)
- [x] Add enabled/disabled state

## 6.2 Alert Creation UI
- [x] Build alert creation form
  - [x] Alert type selector
  - [x] Symbol search (for price alerts)
  - [x] Condition builder
  - [x] Threshold input
  - [x] Notification channel checkboxes
- [x] Save alert to Firestore
- [x] Show confirmation

## 6.3 Alert Management
- [x] Build alerts list page (`/alerts`)
- [x] Show alert status (active/triggered/disabled)
- [x] Enable/disable toggle
- [x] Edit alert
- [x] Delete alert
- [x] Show last triggered time

## 6.4 Cloud Function: Alert Monitoring
- [x] Create `checkAlerts` Cloud Function
- [x] Fetch active alerts
- [x] Evaluate conditions against current data
- [x] Identify triggered alerts
- [x] Update alert status
- [x] Schedule: every 1 minute

## 6.5 Push Notifications
- [x] Configure Firebase Cloud Messaging (service worker + utilities)
- [x] Request notification permission in app (PushNotificationSetup component)
- [x] Store FCM token in user document (push-notifications.ts service)
- [x] Create notification sender utility (Cloud Function sendPushNotification)
- [x] Build notification payload structure
- [x] Handle notification click (deep link) (firebase-messaging-sw.js)
- [ ] Test on multiple devices (requires VAPID key configuration)

## 6.6 Email Notifications
- [x] Set up email service integration (email queue infrastructure)
- [x] Create email templates
  - [x] Alert triggered
  - [x] Trade executed
  - [x] Daily digest (sendDailyDigest Cloud Function)
  - [x] Weekly summary (sendWeeklySummary Cloud Function)
- [x] Implement email sending in Cloud Functions (processEmailQueue)
- [ ] Handle unsubscribe (requires email service integration)

## 6.7 Notification Center
- [x] Create notifications collection
- [x] Build notification bell icon with badge
- [x] Build notification dropdown/panel
- [x] Mark as read functionality
- [x] Mark all as read
- [x] Delete notifications
- [x] Link to relevant page

## 6.8 Notification Preferences
- [x] Build preferences form in settings
- [x] Toggle by notification type
- [x] Toggle by channel (push/email/in-app)
- [x] Set quiet hours
- [x] Set digest frequency
