# How to See Your Database Tables

The app uses a **Postgres** database. Schema is in `backend/postgres/schema.sql`.

## Option 1: psql (command line)

1. Ensure `backend/.env` has `DATABASE_URL` (e.g. `postgresql://user:pass@localhost:5432/ride_sharing`).
2. From the project root:

   ```bash
   cd backend
   psql "$env:DATABASE_URL" -c "\dt"
   ```

   (On Unix/macOS use `psql $DATABASE_URL -c "\dt"`.)

3. To list columns of a table: `\d profiles`
4. To run a query:

   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

   Or: `SELECT * FROM public.profiles LIMIT 10;`

## Option 2: GUI client

Use any Postgres client (pgAdmin, DBeaver, TablePlus, etc.) and connect with your `DATABASE_URL`. Point it at the same database the backend uses.

## Tables (schema reference)

| Table | Purpose |
|-------|--------|
| **profiles** | User profile: `id`, `full_name`, `email`, `phone`, `avatar_url`, `is_driver_approved`, etc. |
| **user_roles** | Role per user: `user_id`, `role` (admin / driver / passenger) |
| **users** | Auth: `id`, `email`, `password_hash`, `phone`, `full_name` |
| **saved_locations** | Passenger saved places: `user_id`, `name`, `label`, `address`, `latitude`, `longitude` |
| **ride_history** | Past rides: `user_id`, `driver_id`, pickup/dropoff, fare, status, etc. |
| **ride_messages** | Chat per ride: `ride_id`, `sender_id`, `sender_type`, `message`, `is_read` |
| **ride_requests** | Ride requests (pending, accepted, etc.) |
| **driver_earnings** | Driver earnings per day |
| **driver_payouts** | Payout requests |
| **driver_documents** | Driver docs (license, etc.): `user_id`, `document_type`, `file_path`, `status` |
| **driver_availability** | Driver online status |
| **user_locations** | Driver location for map |

Exact columns and types: see `backend/postgres/schema.sql` or run:

```sql
SELECT * FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position;
```
