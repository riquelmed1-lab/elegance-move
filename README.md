# Elegance Move Cloud

Deploy via Git-connected Netlify project (not drag/drop static deploy) so Netlify builds Functions and Database migrations.

- Site: public/index.html
- Function: netlify/functions/state.mts
- Database migration: netlify/database/migrations/001_initial_schema/migration.sql
- API: /api/state (also backed by _redirects fallback)
