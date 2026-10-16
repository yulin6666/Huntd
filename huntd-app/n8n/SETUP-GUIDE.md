# Huntd n8n Setup Guide

This guide covers setting up n8n locally to run the Huntd signal monitoring workflows.

## Prerequisites

- Node.js 18+ or Docker
- PostgreSQL database (Supabase already configured)
- OpenRouter API key for AI generation

---

## Option 1: Docker (Recommended for Quick Start)

### 1. Create docker-compose.yml

```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: huntd-n8n
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=changeme123
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - WEBHOOK_URL=http://localhost:5678/
      - GENERIC_TIMEZONE=America/Los_Angeles
    volumes:
      - ~/.n8n:/home/node/.n8n
    restart: unless-stopped
```

### 2. Start n8n

```bash
docker-compose up -d
```

### 3. Access n8n

Open http://localhost:5678 in your browser.
Login with:
- Username: admin
- Password: changeme123

---

## Option 2: npm (For Local Development)

### 1. Install n8n globally

```bash
npm install -g n8n
```

### 2. Start n8n

```bash
n8n start
```

n8n will start on http://localhost:5678

---

## Configure Credentials

### 1. Supabase PostgreSQL Credential

1. In n8n, go to **Credentials** → **New** → Search "postgres"
2. Select **Postgres**
3. Fill in:
   - **Name**: `Supabase PostgreSQL`
   - **Host**: `db.oinbicseqwmwmanxpyaz.supabase.co`
   - **Database**: `postgres`
   - **User**: Get from Supabase → Settings → Database → Connection string (user part)
   - **Password**: Get from Supabase → Settings → Database → Reset password
   - **Port**: `5432`
   - **SSL**: Enable
4. Test connection → Save

**Finding Supabase credentials:**
- Go to https://supabase.com/dashboard/project/oinbicseqwmwmanxpyaz/settings/database
- Click "Connection string" → "URI" mode
- Extract host, user, and password from the connection string

### 2. OpenRouter API Credential

1. In n8n, go to **Credentials** → **New** → Search "http"
2. Select **Header Auth**
3. Fill in:
   - **Name**: `OpenRouter API`
   - **Name**: `Authorization`
   - **Value**: `Bearer YOUR_OPENROUTER_API_KEY`
4. Save

**Getting OpenRouter API key:**
- Go to https://openrouter.ai/keys
- Create a new API key
- Add $5-10 credit (Claude Haiku costs ~$0.001 per signal)

---

## Import Workflows

### 1. Import Hiring Signals Workflow

1. In n8n, click **Workflows** → **Import from File**
2. Select `n8n/workflow-01-hiring-signals.json`
3. The workflow will open in the editor
4. Verify all credentials are connected (check for red warning icons)
5. If credentials are missing, click the node and select the credential you created
6. Save the workflow

### 2. Import Funding Signals Workflow

1. Click **Workflows** → **Import from File**
2. Select `n8n/workflow-02-funding-signals.json`
3. Verify credentials
4. Save

---

## Test the Workflows

### Test Hiring Signals

1. Open the "Huntd - Hiring Signals" workflow
2. Click "Manual Trigger" node → **Execute Node**
3. Watch the execution flow (nodes will light up as they run)
4. Check the "Insert Signal to Supabase" node output to see inserted records

**Expected result:**
- Fetches 9 companies from Supabase
- Calls Greenhouse/Ashby APIs for each company
- Filters jobs by keywords
- Generates AI outreach for matched jobs
- Inserts signals into the `signals` table

### Test Funding Signals

1. Open the "Huntd - Funding Signals" workflow
2. Click "Manual Trigger" node → **Execute Node**
3. This workflow might not find matches immediately (depends on recent funding news)

**Expected result:**
- Fetches RSS from TechCrunch + Crunchbase
- Filters for funding-related articles
- Matches company names
- Generates AI outreach if match found
- Inserts signals into the `signals` table

---

## Verify Database Records

After running workflows, check Supabase:

```sql
-- Check companies
SELECT * FROM global_companies;

-- Check signals
SELECT
  company_name,
  signal_type,
  signal_title,
  signal_date,
  LENGTH(ai_outreach) as ai_length
FROM signals
ORDER BY created_at DESC
LIMIT 10;
```

---

## Enable Scheduled Execution

Once manual tests pass:

1. Open each workflow
2. Click **Active** toggle in the top-right (turns workflow on)
3. Hiring signals will run daily at 8am
4. Funding signals will run daily at 9am

---

## Troubleshooting

### "Connection failed" on Supabase

- Verify SSL is enabled in credential
- Check if your IP is whitelisted in Supabase (Settings → Database → Connection pooler)
- Try using connection pooler URL instead: `db.oinbicseqwmwmanxpyaz.pooler.supabase.com`

### "401 Unauthorized" on OpenRouter

- Verify API key format: `Bearer sk-or-v1-...`
- Check OpenRouter dashboard for credit balance
- Ensure HTTP Header Auth credential is selected in the node

### Workflow execution fails silently

- Check n8n logs: `docker logs huntd-n8n` (Docker) or terminal output (npm)
- Enable "Save manual executions" in workflow settings
- Check each node's error output

### No signals generated

- Check keyword matching is working (inspect "Normalize & Filter by Keywords" node output)
- Verify companies have `is_active = true` and valid ATS slugs
- Try lowering keyword threshold for testing

---

## Cost Monitoring

**OpenRouter (AI generation):**
- Claude Haiku: ~$0.001 per signal
- Expected: 20-50 signals/day = $0.02-0.05/day
- Monthly: ~$1.50

**Railway (n8n hosting - production only):**
- n8n container: ~$5/month
- Not needed for local development

---

## Next Steps

Once workflows are running and generating signals:

1. Verify signal quality (check AI outreach text)
2. Adjust keywords if too many/too few matches
3. Move to Task #5: Update frontend to display signals

---

## Production Deployment (Railway)

For production deployment after local testing:

1. Create Railway account
2. Deploy n8n template: https://railway.app/template/n8n
3. Set environment variables in Railway dashboard
4. Import workflows via Railway n8n UI
5. Configure webhook URLs if needed

**Environment variables for Railway:**
```
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=<strong_password>
POSTGRES_HOST=<supabase_host>
POSTGRES_DB=postgres
POSTGRES_USER=<supabase_user>
POSTGRES_PASSWORD=<supabase_password>
OPENROUTER_API_KEY=<your_key>
```
