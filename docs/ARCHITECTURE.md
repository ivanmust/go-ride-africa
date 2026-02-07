# GoRide Monorepo Architecture

## Folder structure

```
go-ride-africa/
├── src/
│   ├── shared/                    # API clients, types, helpers only — no UI
│   │   ├── api/
│   │   │   └── client.ts          # API client for Postgres backend (getApiBaseUrl, api, getToken, setToken)
│   │   ├── types/
│   │   │   ├── database.ts        # Profile, AppRole, AuthUser, AuthSession
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   └── index.ts           # formatFare, formatCurrency
│   │   └── index.ts
│   ├── apps/
│   │   ├── passenger/             # Passenger app (entry: index.html → main.tsx)
│   │   │   ├── auth/              # PassengerAuthContext — role === 'passenger' only
│   │   │   ├── pages/
│   │   │   ├── PassengerApp.tsx
│   │   │   ├── PassengerLayout.tsx
│   │   │   ├── PassengerHeader.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── main.tsx
│   │   ├── driver/                # Driver app (entry: index-driver.html → apps/driver/main.tsx)
│   │   │   ├── auth/              # DriverAuthContext — role === 'driver' only
│   │   │   ├── pages/
│   │   │   ├── DriverApp.tsx
│   │   │   ├── DriverLayout.tsx
│   │   │   ├── DriverHeader.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── main.tsx
│   │   └── admin/                # Admin app (entry: index-admin.html → apps/admin/main.tsx)
│   │       ├── auth/             # AdminAuthContext — role === 'admin' only
│   │       ├── pages/
│   │       ├── AdminApp.tsx
│   │       └── main.tsx
│   ├── components/               # Shared UI primitives (used by apps)
│   ├── hooks/                    # App-specific hooks (passenger vs driver)
│   ├── pages/                    # Landing, Welcome, Onboarding, NotFound
│   └── main.tsx                  # Default entry → PassengerApp
├── index.html                    # Passenger app
├── index-driver.html             # Driver app
├── index-admin.html              # Admin app
└── docs/
    ├── ARCHITECTURE.md
    └── SECURITY.md
```

## Separation of responsibilities

| Area | Passenger app | Driver app | Admin app |
|------|----------------|------------|-----------|
| **Entry** | `index.html` → `src/main.tsx` (PassengerApp) | `index-driver.html` → `src/apps/driver/main.tsx` | `index-admin.html` → `src/apps/admin/main.tsx` |
| **Auth** | PassengerAuthContext | DriverAuthContext | AdminAuthContext |
| **Role** | Must be `passenger` (verified server-side after login) | Must be `driver` | Must be `admin` |
| **Routes** | `/`, `/ride`, `/auth`, `/history`, `/profile`, etc. | `/`, `/drive`, `/login`, `/earnings`, `/performance`, etc. | `/`, `/login` |
| **No** | No driver/admin routes or role-switching | No passenger/admin routes or role-switching | No passenger/driver routes |

## Authentication flow per role

1. **Passenger**
   - User opens Passenger app (e.g. `https://app.goride.rw/` or `/`).
   - Signs in via Passenger app AuthPage (Postgres API: `POST /api/auth/login`).
   - After login, app uses `GET /api/auth/me`; if role !== `passenger`, app signs out and shows: *"This account is for drivers. Please use the GoRide Driver app."*
   - Passenger session never grants access to Driver or Admin.

2. **Driver**
   - User opens Driver app (e.g. `https://drive.goride.rw/` or `/index-driver.html`).
   - Signs in via Driver app DriverLoginPage (`/login`).
   - After login, app uses `GET /api/auth/me`; if role !== `driver`, app signs out and shows: *"This account is for riders. Please use the GoRide Passenger app."*
   - Driver session never grants access to Passenger or Admin.

3. **Admin**
   - User opens Admin app (e.g. `https://admin.goride.rw/` or `/index-admin.html`).
   - Signs in via Admin app AdminLoginPage (`/login`).
   - After login, app uses `GET /api/auth/me`; if role !== `admin`, app signs out and shows: *"Access denied. Admin only."*

## Shared package (`src/shared`)

- **Only:** API client, types, pure helpers.
- **No:** React components, UI, auth context, or role-switching logic.
- Apps import from `@/shared` for `api`, `getToken`, `setToken`, `getApiBaseUrl`, types, and utils.

## Build and deploy

- **Dev:** `npm run dev` — serves `/` (passenger), `/index-driver.html` (driver), `/index-admin.html` (admin).
- **Build:** `npm run build` — produces `dist/index.html`, `dist/index-driver.html`, `dist/index-admin.html`.
- **Deploy:** Can deploy passenger, driver, and admin to different origins (e.g. app.goride.rw, drive.goride.rw, admin.goride.rw).
