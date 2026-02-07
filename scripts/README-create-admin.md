# Create admin user (one-time)

Run this so you can sign in to the Admin portal. The app uses the Postgres API backend.

1. Ensure `backend/.env` has `DATABASE_URL` and `JWT_SECRET`.
2. From project root run:

   ```bash
   npm run create-admin-postgres -- admin@example.com YourSecurePassword
   ```

   Or from the backend folder: `node ../scripts/create-admin-postgres.mjs admin@example.com YourPassword`

3. Open the Admin portal (e.g. `http://localhost:8085/index-admin.html`) and sign in with that email and password.

- If the email already exists, the script only adds the admin role.
- The script uses `backend/.env` (or root `.env`) for `DATABASE_URL`.
