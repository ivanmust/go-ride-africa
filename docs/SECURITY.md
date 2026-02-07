# Security improvements (role-based auth refactor)

## Summary

The codebase was refactored so that **passenger sessions never grant access to driver or admin**, and each app has **strict, role-verified authentication** with **no role-sharing logic in the frontend**.

---

## 1. Role verified server-side on every app load

- **Before:** One shared `AuthContext`; frontend stored `userRole` and allowed "Switch to Driver" / "Switch to Passenger". A passenger could open the same SPA and access driver routes after switching role.
- **After:** Each app has its own auth context (PassengerAuthContext, DriverAuthContext, AdminAuthContext). After every login and session restore, the app calls **`getRoleForUser(supabase, userId)`** and compares the result to the app’s required role.
- If the backend role does **not** match the app (e.g. passenger-only user in Driver app), the app **signs the user out** and shows a clear message (e.g. "This account is for riders. Please use the GoRide Passenger app.").
- **Effect:** Login tokens are effectively validated against the backend role in that app; no reliance on frontend-only role state.

---

## 2. No role-sharing or switch-role in the frontend

- **Removed:** `switchRole()`, "Switch to Passenger", "Switch to Driver", and any UI that changed role without re-authentication.
- **Removed:** Single shared `AuthContext` that exposed `isDriver`, `isPassenger`, `isAdmin` and allowed one session to access multiple roles.
- **Effect:** There is no frontend path from a passenger session to driver or admin functionality; each app only knows one role.

---

## 3. Fully independent applications

- **Before:** One SPA with routes for both passenger and driver; same session could access both.
- **After:** Three separate entry points and React trees:
  - **Passenger app:** `index.html` → PassengerApp (passenger routes only).
  - **Driver app:** `index-driver.html` → DriverApp (driver routes only).
  - **Admin app:** `index-admin.html` → AdminApp (admin routes only).
- **Effect:** A passenger session is in the Passenger app only; it never loads driver or admin code. Driver and admin are isolated in their own apps.

---

## 4. Shared code limited to API, types, and helpers

- **Before:** Shared UI and one auth context used by both passenger and driver.
- **After:** `src/shared` contains only:
  - API: `createSupabaseClient()`, `getSupabaseClient()`, `getRoleForUser()`.
  - Types: Database, AppRole, Profile (re-exports + slim types).
  - Utils: e.g. `formatFare`, `formatCurrency`.
- **No UI, no auth context, no role logic** in shared.
- **Effect:** Clear boundary; role and app-specific logic live only in each app.

---

## 5. Backend role as source of truth

- Role is read from `user_roles` (Supabase) via `getRoleForUser()` after each auth state change.
- Frontend does not assign or persist role; it only **checks** role and **enforces** that the current app’s required role matches.
- **Recommendation (backend):** Enforce role on all sensitive APIs (e.g. RLS or API middleware) so that:
  - Driver-only tables/APIs are restricted to users with `role = 'driver'`.
  - Admin-only to `role = 'admin'`.
  - Passenger-only to `role = 'passenger'`.
- **Effect:** Even if someone tampers with the frontend, access to driver or admin data still requires the backend to see the correct role for that user.

---

## 6. Token validation on every app

- Each app uses the same Supabase client factory (`getSupabaseClient()`); the JWT is sent with every request.
- Supabase validates the JWT; the app then validates **role** via `getRoleForUser()` after login/session restore.
- **Recommendation:** Add RLS (or equivalent) so that:
  - `user_roles` is readable only by the same user (or by service role for admin).
  - Driver-only tables are restricted to rows where the authenticated user has driver role.
- **Effect:** Tokens are validated by Supabase; role is validated by the app and should be enforced again in the backend.

---

## 7. Cross-app links are navigation, not shared session

- "Drive with GoRide" / "Become a Driver" in the Passenger app are **links to the Driver app** (e.g. `/index-driver.html`), not in-app route changes.
- "Book a ride" in the Driver app is a **link to the Passenger app** (e.g. `/`).
- **Effect:** Changing from passenger to driver (or vice versa) requires opening the other app and signing in there; no shared session across roles.

---

## Checklist for production

- [ ] **RLS / API middleware:** Restrict driver-only and admin-only data to users with the correct role in `user_roles`.
- [ ] **Admin:** Restrict creation of `user_roles` and assignment of `admin` role to a secure backend or migration only.
- [ ] **HTTPS and secure cookies:** Use HTTPS; if you later use cookies for admin, set Secure and HttpOnly.
- [ ] **Separate origins (optional):** Deploy passenger, driver, and admin on separate subdomains/origins (e.g. app.goride.rw, drive.goride.rw, admin.goride.rw) for clearer isolation and future per-app security policies.
