# GoRide apps (Rider, Driver, Admin)

The project has **three separate front-end apps** that share the same codebase and backend (Express API on port 3000).

## Entry points

| App       | HTML entry           | Script entry                    | Use case                    |
|-----------|----------------------|---------------------------------|-----------------------------|
| **Rider** | `index.html`         | `src/main.tsx` → PassengerApp   | Passengers book and track rides |
| **Driver**| `index-driver.html`  | `src/apps/driver/main.tsx` → DriverApp | Drivers go online, accept rides, complete trips |
| **Admin** | `index-admin.html`   | `src/apps/admin/main.tsx` → AdminApp   | Admins approve drivers, view dashboard |

## How to open each app

With the dev server running (e.g. `npm run dev`), open:

- **Rider app:** `http://localhost:8080/` or `http://localhost:8080/index.html`
- **Driver app:** `http://localhost:8080/index-driver.html`
- **Admin app:** `http://localhost:8080/index-admin.html`

(Vite may use a different port if 8080 is in use; check the terminal.)

## Auth and roles

- **Rider app** expects users with role `passenger`. Sign up / log in at `/auth`. Token is stored under `goride_api_token`.
- **Driver app** expects users with role `driver`. Log in at `/index-driver.html/login`. Token is stored under `goride_api_token_driver` (separate from rider so both can be used in different tabs).
- **Admin app** expects users with role `admin`. Log in at `/index-admin.html/login`. Token is stored under `goride_api_token_admin`.

If you get **401** on login, check the API response body: `"Invalid email or password"` (wrong password or no bcrypt hash) or `"No role assigned"` (missing row in `user_roles` for that user). Use the same app (rider/driver/admin) that matches the account’s role.

## Backend

- API base URL is set by `VITE_API_URL` (e.g. `http://localhost:3000`). All three apps call the same backend.
- Start the backend: `cd backend && node --watch src/index.js`
- Ensure Postgres is running (e.g. `docker compose up -d`) and the schema (and any migrations) have been applied.
