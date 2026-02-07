# Flutterwave Payment Integration – What You Need

To complete the Flutterwave integration, provide the following and add them to **`backend/.env`** (and optionally to the frontend for the payment modal).

---

## 1. API keys (required)

Get these from [Flutterwave Dashboard](https://dashboard.flutterwave.com/) → **Settings** → **API Keys**.

| Variable | Description | Where to use |
|----------|-------------|--------------|
| **FLW_PUBLIC_KEY** | Public key (starts with `FLWPUBK-`) | Backend only (for server-side init). Do **not** expose in frontend if you use redirect flow. |
| **FLW_SECRET_KEY** | Secret key (starts with `FLWSECK-`) | **Backend only.** Never expose in frontend or commit to git. |

- **Test mode:** Use **Test** keys from the dashboard (test cards and behavior).
- **Live mode:** Use **Live** keys when going to production.

---

## 2. Base URLs (required for redirects)

| Variable | Description | Example |
|----------|-------------|---------|
| **FRONTEND_URL** | Base URL of your passenger app (for payment success/cancel redirect) | `http://localhost:5173` or `https://app.goride.rw` |
| **API_BASE_URL** or **BACKEND_URL** | Base URL of your backend (for webhook) | `http://localhost:3000` or `https://api.goride.rw` |

You may already have `FRONTEND_URL` and `API_BASE_URL` in `.env`; the app will use them for:

- **redirect_url** after payment: `{FRONTEND_URL}/ride?payment=callback&tx_id=...`
- **Webhook URL** (if you enable it): `{BACKEND_URL}/api/payments/webhook`

---

## 3. Webhook secret (optional but recommended for production)

See **Section 6** below for step-by-step webhook setup.

| Variable | Description |
|----------|-------------|
| **FLW_WEBHOOK_SECRET** | The **Secret hash** you set in Flutterwave Dashboard → Webhooks. Must be the same value in both the dashboard and your `.env`. Flutterwave sends it in the `verif-hash` header so the backend can verify requests. |

If set, the backend will verify the signature of incoming webhooks and only then update payment status.

---

## 4. Example `backend/.env` snippet

```env
# Flutterwave (get from https://dashboard.flutterwave.com/)
FLW_PUBLIC_KEY=FLWPUBK_TEST-xxxxxxxxxxxxx
FLW_SECRET_KEY=FLWSECK_TEST-xxxxxxxxxxxxx

# Optional: for webhook signature verification
FLW_WEBHOOK_SECRET=your_webhook_secret

# Already used for redirects (ensure they are correct)
FRONTEND_URL=http://localhost:5173
API_BASE_URL=http://localhost:3000
```

---

## 5. Flow in this app

1. **Ride completes** (driver taps “Complete trip”) → ride is marked completed.
2. **Passenger** sees “Pay RWF X” and taps it → backend creates a Flutterwave payment and returns the payment link.
3. **Passenger** is redirected to Flutterwave, pays (card, mobile money, etc.), then is redirected back to the app with `?payment=callback&tx_id=...`. The app verifies the payment and shows success/failure.
4. **Backend** verifies the transaction with Flutterwave and marks the ride payment as **paid** (or you receive a **webhook** and update from there).

Once you add the keys and URLs above and run the migration for `ride_payments`, the integration is ready to test with Flutterwave test keys.

---

## 6. Setting up the webhook (step-by-step)

Webhooks let Flutterwave notify your backend when a payment completes, so the ride is marked paid even if the user closes the browser before the redirect.

### Step 1: Webhook URL

Your webhook endpoint is:

```text
{API_BASE_URL}/api/payments/webhook
```

Examples:

- **Local:** `http://localhost:3000/api/payments/webhook`  
  Flutterwave cannot reach localhost. For local testing use a tunnel (e.g. [ngrok](https://ngrok.com/)) and set `API_BASE_URL` to the ngrok URL (e.g. `https://abc123.ngrok.io`), so the webhook URL becomes `https://abc123.ngrok.io/api/payments/webhook`.
- **Production:** `https://api.yourdomain.com/api/payments/webhook`

### Step 2: In Flutterwave Dashboard

1. Log in at [dashboard.flutterwave.com](https://dashboard.flutterwave.com/).
2. Go to **Settings** (gear icon) → **Developers** → **Webhooks** (or **Settings** → **Webhooks**).
3. **Webhook URL:** Enter your URL from Step 1 (e.g. `https://your-api.com/api/payments/webhook`).
4. **Secret hash:** Choose a long random string (e.g. generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`). Enter it in the **Secret hash** field and click **Save**.  
   Flutterwave will send this same value in the `verif-hash` header on every webhook request.
5. Ensure the events you need are enabled (e.g. **charge.completed**). You can enable all events if unsure.

### Step 3: In your backend `.env`

Add the **same** secret hash to your backend so it can verify webhooks:

```env
FLW_WEBHOOK_SECRET=the_exact_same_secret_hash_you_entered_in_the_dashboard
```

Restart the backend after changing `.env`.

### Step 4: Test

1. Complete a test ride and use “Pay with Flutterwave” with a [test card](https://developer.flutterwave.com/docs/test-cards).
2. After payment, Flutterwave will call your webhook. Check your server logs for any errors.
3. The payment should be marked **completed** either via redirect (verify) or via webhook.
