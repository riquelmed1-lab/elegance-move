# Elegance Move — Supabase migration

This folder prepares the migration from Netlify Database to Supabase without changing the current production site until cutover.

## Target architecture

- Netlify: static frontend hosting during the transition.
- Supabase Auth: login/session.
- Supabase PostgreSQL: operational database.
- Supabase Realtime: cross-device refresh.
- RLS: database-enforced access by profile.

## Roles

- `admin`: full access, including users and audit.
- `manager`: operational + financial access, excluding user administration.
- `seller`: clients, products (without costs), sales, payments and quotes. Costs and administrative financial tables remain protected.

## Migrations

1. `202609110001_initial.sql`
   - business tables
   - inventory movements
   - separated sensitive cost tables
   - reporting view for monthly net profit
   - indexes
   - RLS policies

2. `202609110002_auth_profiles.sql`
   - automatically creates a `profiles` row for each Supabase Auth user
   - defaults new users to `seller`

## Cutover plan

1. Create/connect a Supabase project.
2. Apply migrations to a new empty project.
3. Create the first Auth user and promote its profile to `admin`.
4. Export current Netlify data.
5. Import clients/products/sales/payments/expenses/entries/quotes.
6. Reconstruct inventory movement history.
7. Compare totals between old and new databases.
8. Add Supabase client to the frontend behind a feature flag.
9. Test login, sale, partial payment, quote, purchase entry, expense, monthly profit, user roles, mobile/desktop sync.
10. Cut over production only after reconciliation passes.

## Environment variables

See `.env.example`.

Never expose `SUPABASE_SERVICE_ROLE_KEY` in browser code or commit real credentials to GitHub.
