# Quick Fix - Get Companies Showing

## Step 1: Get Correct Supabase Keys

1. Go to: https://supabase.com/dashboard/project/oinbicseqwmwmanxpyaz/settings/api
2. Copy these two values:
   - **Project URL** (should be `https://oinbicseqwmwmanxpyaz.supabase.co`)
   - **anon public** key (long JWT token starting with `eyJ...`)

3. Update `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://oinbicseqwmwmanxpyaz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (paste the long token here)
```

## Step 2: Run Database Migration

1. Go to: https://supabase.com/dashboard/project/oinbicseqwmwmanxpyaz/sql/new
2. Copy the entire content from `supabase/migrations/001_setup_phase1_schema.sql`
3. Paste into SQL Editor
4. Click **RUN** button

This will:
- Create `global_companies` table
- Create `signals` table
- Insert 9 companies (Vanta, Tailscale, Datadog, Stripe, Figma, GitLab, Brex, Anthropic, Linear)

## Step 3: Verify

Run this query in SQL Editor:
```sql
SELECT name, ats_platform, is_active FROM global_companies;
```

Should show 9 rows.

## Step 4: Restart Dev Server

```bash
cd /Users/lindediannao/Documents/project/Huntd/huntd-app
# Press Ctrl+C to stop current server
npm run dev
```

Refresh http://localhost:3000 — you should now see 9 companies in the sidebar!
