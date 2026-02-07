# GoRide Admin Portal

The admin app is a separate entry point for role-verified admin users. It uses the same Postgres API backend as the main app.

## 1. Prerequisites

- **Backend running** on the URL set in `VITE_API_URL` (e.g. `http://localhost:3000`).
- **Database**: schema applied (`npm run apply-schema-postgres` if needed).
- **Admin user** created (see below).

## 2. Create an admin user (one-time)

From the project root:

```bash
npm run create-admin-postgres -- admin@example.com YourSecurePassword
```

- If the email already exists, the script only adds the `admin` role.
- Requires `backend/.env` with `DATABASE_URL` and `JWT_SECRET`.

See `scripts/README-create-admin.md` for more detail.

## 3. Open the Admin portal

1. Start the frontend dev server: `npm run dev`.
2. Open in the browser: **http://localhost:8080/index-admin.html**
3. You should see the Admin login page. Sign in with the admin email and password from step 2.

Routes:

- `/index-admin.html` or `/index-admin.html/` → Dashboard (after login).
- `/index-admin.html/login` → Login page.

## 4. Environment

- **Frontend (root `.env`):** `VITE_API_URL` must point to your backend (e.g. `http://localhost:3000`). The admin app uses this for login and dashboard API calls.
- **Backend (`backend/.env`):** `PORT`, `DATABASE_URL`, `JWT_SECRET` must be set.

## 5. What you can do in the Admin dashboard

- **Stats:** Total users, drivers (approved/total), pending driver approvals, pending documents, ride requests, completed rides.
- **Pending driver approvals:** List of drivers waiting for approval; **Approve** to set `is_driver_approved = true`.
- **Pending document reviews:** Driver documents with status `pending`.
- **Recent ride requests** and **Recent completed rides** tables.

Only users with role `admin` in `user_roles` can access the admin app and APIs.
