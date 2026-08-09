# Editing App admin dashboard

The private dashboard is available at `/editingappadmin`. It shows registered
users, new accounts, recent logins, live presence, Stripe subscription status,
estimated active MRR, 30-day growth, and country distribution.

## Grant admin access

Use one of these server-side methods. The immutable user ID is recommended.

```dotenv
ADMIN_USER_IDS=00000000-0000-0000-0000-000000000000
```

For initial setup, a verified Supabase account email can be allowlisted:

```dotenv
ADMIN_EMAILS=owner@example.com
```

Multiple values are comma-separated. Add these only in Vercel project settings;
never prefix them with `NEXT_PUBLIC_`. Scope production access to Production
unless the same administrator should also access Preview deployments.

Alternatively, a trusted backend can set `app_metadata.role` to `admin` with
the Supabase Admin API. Never use user-editable `user_metadata` for admin roles.

After changing a Vercel environment variable, redeploy the application so the
new server environment is active.

## How analytics are collected

- Authentication creation and last-login timestamps come from Supabase Auth.
- Plan and subscription status come from the Stripe-synced `billing_accounts`
  table.
- Signed-in browsers send a lightweight heartbeat every two minutes.
- A user is shown as online when their last heartbeat is within five minutes.
- Country comes from Vercel's trusted `x-vercel-ip-country` request header. It
  appears after a signed-in user visits a deployment containing this feature.
- Active MRR is a plan-price estimate. It intentionally excludes discounts,
  refunds, tax, and annualized revenue.

The `user_activity` table has row-level security enabled. Users can only write
and read their own activity row; complete analytics are read on the server with
the service role after a separate admin authorization check.
