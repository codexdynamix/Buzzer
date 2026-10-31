# Buzzer

Buzzer uses Supabase Auth for email accounts and Supabase Postgres for app data. The Express API remains in place and verifies Supabase access tokens before handling authenticated requests. Only the server uses the Supabase service-role key.

## Connect a Supabase project

1. Create a Supabase project with the VS Code Supabase extension or the Supabase dashboard.
2. Run [`supabase/migrations/20261028000000_initial_schema.sql`](./supabase/migrations/20261028000000_initial_schema.sql) in the project's SQL editor. It creates the private `app_records` table, enables row-level security, and creates a profile record for each new Auth user.
3. Run [`supabase/migrations/20261030010000_app_records_service_role_permissions.sql`](./supabase/migrations/20261030010000_app_records_service_role_permissions.sql) to ensure the server role can perform all required record operations, including account deletion.
4. Run [`supabase/migrations/20261031000000_atomic_app_record_updates.sql`](./supabase/migrations/20261031000000_atomic_app_record_updates.sql) to enable atomic document updates and upserts.
5. Copy `.env.example` to `.env` and set:
   - `SUPABASE_URL`: the project URL.
   - `SUPABASE_SERVICE_ROLE_KEY`: the server-only service-role key.
   - `VITE_SUPABASE_URL`: the same project URL.
   - `VITE_SUPABASE_ANON_KEY`: the project's anon/public key.
   - `CORS_ORIGIN`: comma-separated frontend origins for cross-origin deployments. Set this to your production frontend origin; the default only allows local development origins.
6. In Supabase Auth settings, set the site URL to your frontend URL and allow its `/auth/reset-password` URL as a redirect. Configure email confirmation and SMTP according to your deployment needs.
7. Install dependencies and start Buzzer:

   ```sh
   npm install
   npm run dev
   ```

For Hostinger Web Apps, set the Node.js entry file to `index.mjs`. It registers `tsx` so the Express server can start from `server.ts`; the build script generates the production frontend in `registropolis-main/dist`.

Without Supabase environment variables, the server uses its local development data store. Supabase authentication and cloud persistence are unavailable in that mode.

The first account is assigned the normal `user` role. To grant admin access after creating that account, run this SQL with its email address:

```sql
UPDATE public.app_records
SET document = jsonb_set(document, '{role}', '"admin"'::jsonb, true),
    updated_at = now()
WHERE collection = 'users'
  AND lower(document ->> 'email') = lower('admin@example.com');
```

## Account access

The client sign-in page does not offer demo-account shortcuts. New users create their own Supabase Auth account with an email address they control and confirm it using the verification email. Staff use the separate `/admin/login` page and must be granted an appropriate staff role by an administrator. Seed profiles and sample listings used during local development are example data, not login credentials or verified customer identities.

Keep the Supabase service-role key only in the server's private environment variables. Never commit it, place it in a `VITE_` variable, or expose it in frontend source. If a service-role key has been committed previously, rotate it in Supabase before deploying.

## Data model

To keep the existing API behavior intact during migration, app records are stored as JSON documents in `app_records`, keyed by collection name and record ID. The table is not exposed to browser roles; the Express server accesses it with the service-role key. Supabase Auth owns credentials and sessions, while the app API continues to enforce profile, listing, messaging, and admin permissions.
