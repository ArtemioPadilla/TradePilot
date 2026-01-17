# Phase 6: Alerts & Notifications

## 6.1 Alert Data Model
- [ ] Define alert types enum
- [ ] Create alert Firestore schema
- [ ] Define condition operators (>, <, =, crosses)
- [ ] Add enabled/disabled state

## 6.2 Alert Creation UI
- [ ] Build alert creation form
  - [ ] Alert type selector
  - [ ] Symbol search (for price alerts)
  - [ ] Condition builder
  - [ ] Threshold input
  - [ ] Notification channel checkboxes
- [ ] Save alert to Firestore
- [ ] Show confirmation

## 6.3 Alert Management
- [ ] Build alerts list page (`/alerts`)
- [ ] Show alert status (active/triggered/disabled)
- [ ] Enable/disable toggle
- [ ] Edit alert
- [ ] Delete alert
- [ ] Show last triggered time

## 6.4 Cloud Function: Alert Monitoring
- [ ] Create `checkAlerts` Cloud Function
- [ ] Fetch active alerts
- [ ] Evaluate conditions against current data
- [ ] Identify triggered alerts
- [ ] Update alert status
- [ ] Schedule: every 1 minute

## 6.5 Push Notifications
- [ ] Configure Firebase Cloud Messaging
- [ ] Request notification permission in app
- [ ] Store FCM token in user document
- [ ] Create notification sender utility
- [ ] Build notification payload structure
- [ ] Handle notification click (deep link)
- [ ] Test on multiple devices

## 6.6 Email Notifications
- [ ] Set up email service integration
- [ ] Create email templates
  - [ ] Alert triggered
  - [ ] Trade executed
  - [ ] Daily digest
  - [ ] Weekly summary
- [ ] Implement email sending in Cloud Functions
- [ ] Handle unsubscribe

## 6.7 Notification Center
- [ ] Create notifications collection
- [ ] Build notification bell icon with badge
- [ ] Build notification dropdown/panel
- [ ] Mark as read functionality
- [ ] Mark all as read
- [ ] Delete notifications
- [ ] Link to relevant page

## 6.8 Notification Preferences
- [ ] Build preferences form in settings
- [ ] Toggle by notification type
- [ ] Toggle by channel (push/email)
- [ ] Set quiet hours
- [ ] Set digest frequency
