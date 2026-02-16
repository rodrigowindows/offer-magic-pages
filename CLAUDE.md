# Offer Magic Pages - Claude Code Context

## Supabase Credentials (offer-magic-pages)
- **Project ID**: `atwdkhlyrffbaugkaker`
- **URL**: `https://atwdkhlyrffbaugkaker.supabase.co`
- **Anon Key**: read from `.env` → `VITE_SUPABASE_PUBLISHABLE_KEY`
- **REST API**: `https://atwdkhlyrffbaugkaker.supabase.co/rest/v1/`

## Quick API Access
```bash
# Headers needed for all requests:
# -H 'apikey: <ANON_KEY>' -H 'Authorization: Bearer <ANON_KEY>'
# ANON_KEY is in .env file (VITE_SUPABASE_PUBLISHABLE_KEY)
```

## Key Tables
- `properties` - Main property listings (200+ columns, includes skip trace data)
- `campaigns` - Marketing campaigns
- `campaign_targets` - Campaign recipients
- `campaign_clicks` - Click events
- `lead_activities` - Activity log
- `scheduled_campaigns` - Campaign scheduling
- `manual_comps_links` - User-entered comps
- `ab_tests` / `ab_test_events` - A/B testing

## Project Stack
- React 18 + TypeScript + Vite + Tailwind + shadcn/ui
- Supabase (PostgreSQL + Edge Functions + Auth + Storage)
- Zustand (state management)
- React Query (server state)
- React Router DOM 6

## Key Routes
- `/` - Landing page
- `/admin` - Admin dashboard
- `/admin/import` - CSV import
- `/marketing/*` - Marketing sub-app
- `/process/*` - 5-step investment process
- `/skip-trace` - Skip tracing
- `/property/:slug` - Property detail

## Development
- Dev server: `npm run dev` (port 8080)
- Build: `npx vite build`
- Branch for Claude: `claude/code-explanation-9SbEm`
- Push restriction: cannot push directly to `origin/main` (403)
