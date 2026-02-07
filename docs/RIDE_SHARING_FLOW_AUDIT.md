# GoRide Ride-Sharing Flow Audit

This document maps the **ride-sharing concept** to the codebase: what works end-to-end and what is missing or incomplete.

---

## 1. Core ride flow (working)

| Step | Who | What | Status |
|------|-----|------|--------|
| 1. Passenger sets pickup & destination | Passenger app | RidePage: address autocomplete, map, vehicle type, fare estimate | ✅ Working |
| 2. Passenger selects payment method | Passenger app | usePaymentMethods, FareEstimateCard, selectedPaymentMethodId | ✅ Working |
| 3. Passenger requests ride | Passenger app | useCreateRide → POST `/api/ride-requests/create` | ✅ Working |
| 4. Backend matches driver | Backend | `create_ride_request()`: nearest online approved driver, creates ride_request (status pending, driver_id set) | ✅ Working |
| 5. Driver sees incoming request | Driver app | useIncomingRideRequests → GET `/api/ride-requests/driver/incoming` | ✅ Working |
| 6. Driver accepts | Driver app | POST `/api/ride-requests/:id/accept` → creates ride_history (in_progress), links ride_request | ✅ Working |
| 7. Passenger sees “matched” | Passenger app | Polls GET `/api/ride-requests/:id` for status accepted + ride_history_id | ✅ Working |
| 8. Driver location updates | Driver app | useDriverOnline / user-locations PUT; passenger useDriverLiveLocation | ✅ Working |
| 9. Driver completes trip | Driver app | completeRide() → PATCH `/api/ride-history/:id` status completed | ✅ Working |
| 10. Driver earnings updated | Backend | Trigger on ride_history status → completed updates driver_earnings | ✅ Working |
| 11. Passenger sees completed + can rate | Passenger app | Polls ride_history for completed; PATCH user_rating | ✅ Working |
| 12. Passenger can cancel active ride | Passenger app | PATCH ride-history status cancelled (X button) | ✅ Working |
| 13. Driver can reject request | Driver app | POST `/api/ride-requests/:id/reject` → ride_request status declined | ✅ Working |
| 14. Passenger sees “declined” | Passenger app | Poll sees status declined/cancelled → “No driver accepted”, back to booking | ✅ Working |

---

## 2. Supporting features (working)

- **Auth (per role):** Passenger / Driver / Admin apps, role checked after login (`GET /api/auth/me` + backend role). ✅  
- **Scheduled rides:** Passenger can schedule; GET/POST/PATCH cancel on `/api/scheduled-rides`. ✅  
- **Saved locations:** CRUD saved locations for passenger. ✅  
- **Ride history:** Passenger and driver see past rides (ride_history). ✅  
- **In-app chat:** ride_messages, RideChatDrawer, useRideChat / useDriverRideChat. ✅  
- **Driver documents:** Driver uploads; list in admin dashboard. ✅  
- **Driver approval:** Admin approves profile (is_driver_approved); PATCH `/api/admin/profiles/:id`. ✅  
- **Driver payouts:** Driver requests payout → admin sees pending → Approve/Reject (PATCH `/api/admin/payouts/:id`). ✅  
- **Admin dashboard stats:** Counts for users, drivers, approvals, documents, requests, completed rides. ✅  
- **Fare estimation:** useFareEstimation (distance/duration from coords, vehicle type, optional ride-share discount). ✅  
- **Mapbox token:** GET `/api/mapbox/token` for map (if used). ✅  

---

## 3. Gaps / missing or incomplete

### 3.1 Admin: document approve/reject

- **Current:** Admin dashboard lists “Pending Document Reviews” (driver_documents with status pending) but there is **no action** to approve or reject a document.
- **Expected:** Admin can approve or reject each document (e.g. PATCH `/api/admin/documents/:id` with status approved/rejected and optional rejection_reason); driver sees updated status in their documents list.
- **Impact:** Drivers cannot get individual documents (e.g. licence) approved; only the whole profile can be approved.

### 3.2 Driver decline: no reassignment

- **Current:** One driver is assigned at request creation. If that driver rejects, the ride_request stays “declined” and the passenger is told “No driver accepted. Please try again.”
- **Expected (optional):** Either (a) automatic reassignment to the next nearest available driver, or (b) broadcast to multiple drivers and first to accept wins. Current design is single-driver assignment only.
- **Impact:** Passenger must manually request again; no seamless retry with another driver.

### 3.3 Ride sharing: backend not used

- **Current:** Ride sharing toggle and useFareEstimation(…, rideSharing) affect **fare estimate only** (e.g. discount in UI). create_ride_request does not receive ride_sharing; matching and pricing in DB do not differentiate shared vs solo.
- **Expected (if product is “shared rides”):** Backend knows shared vs solo (e.g. flag on ride_request), matching may allow multiple passengers, and fare/pricing rules reflect sharing.
- **Impact:** “Ride sharing” is a front-end fare display option only, not a different product in the backend.

### 3.4 No real payment capture

- **Current:** Passenger selects payment_method_id; it is stored on ride_request and ride_history has fare_amount. There is **no** call to a payment gateway (Stripe, MTN Mobile Money, etc.) to charge the passenger.
- **Expected (for production):** On ride completion (or at request time), charge the passenger’s payment method and record success/failure; optionally refund on cancellation.
- **Impact:** Payment methods are stored for reference only; no real money movement.

### 3.5 Scheduled rides: not converted to live request

- **Current:** Scheduled rides are stored (scheduled_rides table) and can be listed/cancelled. There is no logic to **convert** a scheduled ride into a live ride_request at the scheduled time (no cron/job or background worker).
- **Expected:** At scheduled time, either auto-create a ride_request (with same flow as “request ride”) or notify the passenger to confirm and then create it.
- **Impact:** Scheduled rides are “reminders” only; user must manually book again at the time.

### 3.6 Driver cancellation of active ride

- **Current:** Passenger can cancel (PATCH ride_history status cancelled). Driver has “Complete Trip” but no explicit “Cancel ride” in the flow (driver could in theory call PATCH ride-history cancelled if they had a UI for it).
- **Expected:** Driver can cancel an in-progress ride (with optional reason); passenger is updated and possibly offered re-match or refund policy.
- **Impact:** Asymmetric; only passenger cancel is obvious in the flow.

### 3.7 Phone call / contact

- **Current:** Driver and passenger UIs show a phone icon but it is not wired to start a call (no `tel:` link or integration).
- **Expected:** Tapping phone opens dialer with the other party’s number (if stored and permitted).
- **Impact:** Cosmetic only unless numbers are shown and linked elsewhere.

---

## 4. Summary

- **Core ride flow:** Request → match → accept/reject → in-progress → complete → earnings and rating is **implemented and working** for a single assigned driver.
- **Working:** Auth, roles, driver approval, payouts, admin stats, chat, ride history, scheduled ride CRUD + **start-ride**, saved locations, fare estimate, passenger cancel, **driver cancel**, **document approve/reject**, **reassign on decline**, **ride_sharing flag**, **phone (tel:) links**.
- **Still missing:** Real payment gateway capture (Stripe, MTN MoMo, etc.).

**Deploy notes:** Run `backend/scripts/run-migration.mjs postgres/migrations/003_ride_sharing_and_functions.sql` (uses DATABASE_URL from backend/.env).

---

## 5. Verification checklist (all implemented)

| Flow | Backend | Frontend | Verified |
|------|---------|----------|----------|
| **Core ride** (request → match → accept → complete → earnings) | create_ride_request, ride-requests, ride-history, trigger | RidePage, DriverDashboard, useCreateRide, useDriverActiveRide | ✅ |
| **Passenger cancel** active ride | PATCH ride-history cancelled | RidePage X button | ✅ |
| **Driver reject** request | POST ride-requests/:id/reject | DriverDashboard Decline | ✅ |
| **Reassign** when driver declines | POST ride-requests/:id/reassign, reassign_ride_request() | RidePage poll → reassign once, "Finding another driver…" | ✅ |
| **Driver cancel** active ride | PATCH ride-history cancelled | useDriverActiveRide.cancelRide(), DriverDashboard "Cancel ride" | ✅ |
| **Admin document** approve/reject | PATCH admin/documents/:id | AdminDashboardPage PendingDocRow Approve/Reject | ✅ |
| **Admin payout** approve/reject | PATCH admin/payouts/:id | AdminDashboardPage PendingPayoutRow | ✅ |
| **Ride sharing** flag | ride_requests.ride_sharing, create_ride_request(p_ride_sharing) | useCreateRide rideSharing, RidePage passes it | ✅ |
| **Scheduled → live** | POST scheduled-rides/:id/start-ride | useScheduledRides.startRide(), ScheduledRidesPage "Start ride" | ✅ |
| **Phone (tel:)** | create_ride_request returns driver phone; profiles.phone | RidePage Call/tel: driver; DriverDashboard tel: passenger (useDriverActiveRide passengerPhone) | ✅ |
| **Payment capture** | — | — | ❌ Not implemented (gateway required) |
