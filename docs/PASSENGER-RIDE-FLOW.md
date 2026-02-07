# Passenger ride flow: payment, approved drivers, real data

## Summary of changes

1. **Payment required before booking**  
   Passengers must select a payment method before requesting a ride. If they have none, they see “Add a payment method” and are sent to `/payment-methods`. The Request button is disabled until a method is selected.

2. **Only approved drivers on the map**  
   The map shows only drivers who have been approved by admin (`profiles.is_driver_approved = true`) and have a location in `user_locations`. Unapproved drivers are not shown.

3. **Real data instead of dummy data**  
   - **Ride creation:** On Request, the app creates a `ride_request`, matches the nearest approved driver, and creates a `ride_history` row with status `in_progress`.  
   - **Driver info:** Driver name, photo, vehicle type, plate, make/model/color come from `profiles` and `vehicles` for the matched driver.  
   - **Fare and distance:** Stored from the fare estimate when the ride is created; completed screen shows the actual trip fare and distance.  
   - **Completion:** When the ride finishes, `ride_history` is updated to `status = 'completed'` and `completed_at` is set. Cancelling from “Driver on the way” sets `status = 'cancelled'`.

## Database migration (required)

Run this migration in the Supabase SQL Editor so that driver approval and payment method linking work:

**File:** `supabase/migrations/20260202200000_driver_approval_and_ride_flow.sql`

It:

- Adds `profiles.is_driver_approved` (default `false`).
- Adds RLS so passengers can read approved drivers’ profiles and their `user_locations`.
- Adds `ride_requests.payment_method_id` (optional) so each request can store the chosen payment method.

After running it:

1. **Approve drivers (admin):** Set `profiles.is_driver_approved = true` for drivers who are allowed to receive rides (e.g. from Supabase Table Editor or an admin UI).
2. **Driver locations:** Ensure approved drivers have a row in `user_locations` (latitude, longitude) so they appear on the map and can be matched.

## Flow overview

1. Passenger enters pickup and destination, selects vehicle type, sees fare estimate.  
2. Passenger selects a payment method (required).  
3. Map shows only approved drivers (green markers) when in booking state.  
4. On “Request”, the app creates `ride_request`, picks the nearest approved driver, creates `ride_history` (in_progress), and shows that driver’s real name, vehicle, and plate.  
5. Driver tracking (simulated movement) and chat use the real `ride_history.id`.  
6. When the ride completes, `ride_history` is updated to completed and the fare/distance from the trip are shown.  
7. Cancelling from “Driver on the way” updates the ride to `cancelled` and returns to booking.

## New/updated files

- `src/hooks/usePaymentMethods.ts` – Fetches user payment methods.  
- `src/hooks/useApprovedDrivers.ts` – Fetches approved drivers and their locations.  
- `src/hooks/useCreateRide.ts` – Creates ride_request, matches driver, creates ride_history, returns matched driver.  
- `src/components/maps/GoogleMap.tsx` – `nearbyDrivers` prop to show approved drivers on the map.  
- `src/apps/passenger/pages/RidePage.tsx` – Payment step, approved drivers on map, real ride creation and driver/fare data.  
- `supabase/migrations/20260202200000_driver_approval_and_ride_flow.sql` – Driver approval and payment_method_id.
