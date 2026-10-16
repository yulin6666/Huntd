# Huntd Local Setup Guide

This guide walks you through setting up the complete Huntd signal monitoring system locally.

## Prerequisites

- Node.js 18+ installed
- Docker Desktop (for n8n) OR npm (for standalone n8n)
- Supabase account (already configured)
- OpenRouter API key

## Setup Steps

### 1. Database Setup

Run the migration SQL against your Supabase database:

1. Go to https://supabase.com/dashboard/project/oinbicseqwmwmanxpyaz
2. Navigate to **SQL Editor**
3. Open the file `supabase/migrations/001_setup_phase1_schema.sql`
4. Copy and paste the entire SQL into the editor
5. Click **Run**

This creates:
- `global_companies` table with 9 initial companies (Vanta, Tailscale, Datadog, etc.)
- `signals` table for unified signal storage
- Deduplication index
- Helper views

**Verify migration:**
```sql
SELECT count(*) FROM global_companies;  -- Should return 9
SELECT count(*) FROM signals;           -- Should return 0 (no signals yet)
```

### 2. Frontend Setup

The Next.js app is already configured with `.env.local`:

```bash
cd /Users/lindediannao/Documents/project/Huntd/huntd-app
npm install
npm run dev
```

Visit http://localhost:3000 — you'll see the UI with 9 companies in the sidebar, but no signals yet (workflows haven't run).

### 3. n8n Setup

Follow the detailed guide in `n8n/SETUP-GUIDE.md`. Quick version:

**Option A: Docker (Recommended)**
```bash
cd /Users/lindediannao/Documents/project/Huntd/huntd-app/n8n
docker compose up -d
```

**Option B: npm**
```bash
npm install -g n8n
n8n start
```

Visit http://localhost:5678

### 4. n8n Credentials

Set up these credentials in n8n:

**Supabase Database** (Postgres type):
- Name: `supabase-db`
- Host: `aws-0-us-east-1.pooler.supabase.com`
- Database: `postgres`
- User: from Supabase dashboard → Settings → Database
- Password: from Supabase dashboard → Settings → Database
- Port: `6543`
- SSL: `Allow`

**OpenRouter API** (HTTP Header Auth type):
- Name: `openrouter-api`
- Credentials:
  - Name: `Authorization`
  - Value: `Bearer YOUR_OPENROUTER_API_KEY`

### 5. Import Workflows

In n8n:

1. Click **Add Workflow** → **Import from File**
2. Import `n8n/workflow-01-hiring-signals.json`
3. Configure credentials:
   - Supabase nodes → select `supabase-db`
   - OpenRouter node → select `openrouter-api`
4. Click **Save**
5. Repeat for `n8n/workflow-02-funding-signals.json`

### 6. Test the System

**Test Hiring Workflow:**
1. Open `workflow-01-hiring-signals` in n8n
2. Click **Execute Workflow** (manual trigger)
3. Watch the execution — should see:
   - Companies fetched (9 rows)
   - ATS API calls (Greenhouse + Ashby)
   - Keyword filtering
   - New signals inserted

**Verify in Supabase:**
```sql
SELECT company_name, signal_type, signal_title, signal_date
FROM signals
WHERE signal_type = 'hiring'
ORDER BY created_at DESC
LIMIT 10;
```

**Test Funding Workflow:**
1. Open `workflow-02-funding-signals` in n8n
2. Click **Execute Workflow**
3. Should fetch TechCrunch + Crunchbase RSS feeds
4. Match company names in articles
5. Insert funding signals

**Check Frontend:**
- Refresh http://localhost:3000
- Click a company in the sidebar
- Filter by signal type (🔴 Hiring, 💰 Funding)
- Click a signal to see the drawer with AI outreach

### 7. Enable Scheduled Runs

Once verified:

1. In n8n, open each workflow
2. Click the three dots → **Settings**
3. Set **Active** to `true`
4. Click **Save**

Workflows will now run daily:
- Hiring: 8am
- Funding: 9am

## Project Structure

```
huntd-app/
├── app/
│   ├── api/
│   │   ├── signals/route.ts      # Signal API endpoint
│   │   └── companies/route.ts    # Companies API endpoint
│   ├── components/
│   │   ├── SignalSidebar.tsx     # Left sidebar with companies
│   │   ├── SignalFilterBar.tsx   # Top filter bar
│   │   ├── SignalList.tsx        # Signal cards list
│   │   └── SignalDrawer.tsx      # Detail drawer with AI outreach
│   └── page.tsx                  # Main page
├── supabase/
│   └── migrations/
│       └── 001_setup_phase1_schema.sql
└── n8n/
    ├── SETUP-GUIDE.md
    ├── workflow-01-hiring-signals.json
    └── workflow-02-funding-signals.json
```

## Next Steps (Phase 2+)

After validating Phase 1:

- **Add executive change signals** — LinkedIn profile monitoring via Apify
- **User authentication** — Supabase Auth + RLS policies
- **User company management** — UI to add/remove monitored companies
- **Email notifications** — Daily digest of new signals
- **Payment integration** — Stripe for SaaS subscriptions

## Troubleshooting

**No signals appearing:**
- Check n8n execution logs for errors
- Verify Supabase credentials are correct
- Check OpenRouter API key has credits
- Run SQL query to see if signals are in DB

**ATS API 404 errors:**
- Company's ATS slug may have changed
- Update `ats_slug` in `global_companies` table

**Duplicate signals:**
- Expected — dedup index prevents duplicates
- n8n will skip already-seen signals

**Frontend shows "No signals found":**
- Run workflows manually first to populate data
- Check browser console for API errors
- Verify `.env.local` has correct Supabase credentials

## Cost Estimates

**Per Day (9 companies):**
- ATS API calls: Free (no rate limits)
- RSS feeds: Free
- OpenRouter (Claude Haiku): ~$0.10-0.50 (10-50 new signals/day)
- Supabase: Free tier (plenty of headroom)
- n8n: Free self-hosted

**Total: < $15/month** for Phase 1 operation
