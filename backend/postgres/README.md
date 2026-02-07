# Postgres schema for GoRide (ride_sharing)

This schema is for **standalone PostgreSQL** (no Supabase). It uses `public.users` instead of `auth.users`.

## Run the schema

From the project root, with PostgreSQL running (e.g. on `localhost:5433`):

**Option A – Node (no psql required)**

```bash
npm run apply-schema-postgres
```

Uses `DATABASE_URL` from `backend/.env` and applies `backend/postgres/schema.sql`.

**Option B – psql with connection string**

```bash
cd backend/postgres
psql "postgresql://postgres:Mustaf%40123@localhost:5433/ride_sharing" -f schema.sql
```

**Option C – psql interactive**

```bash
psql -h localhost -p 5433 -U postgres -d ride_sharing
# Then:
\i E:/go-ride-africa/backend/postgres/schema.sql
```

**Option D – Windows (PowerShell)**

If the password contains `@`, use `%40` in the URL:

```powershell
$env:PGPASSWORD = "Mustaf@123"
psql -h localhost -p 5433 -U postgres -d ride_sharing -f backend/postgres/schema.sql
```

## Verify

1. **Backend health:** `curl http://localhost:3000/api/health` → `{"ok":true}`
2. **Register:** `curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"test123\",\"full_name\":\"Test User\"}"`
3. **Login:** `curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\",\"password\":\"test123\"}"`

You should get a `token` in the response. Use it as `Authorization: Bearer <token>` for protected routes.
