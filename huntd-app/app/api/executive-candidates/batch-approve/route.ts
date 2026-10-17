import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

type ApproveCandidate = {
  id: string
  person_name: string
  title: string
  action: string
  company_id: string
  company_name: string
  source_title: string | null
  pub_date: string | null
}

// POST: Batch approve — move drafts to executive_profiles
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { candidates } = body as { candidates: ApproveCandidate[] }

  if (!Array.isArray(candidates) || candidates.length === 0) {
    return NextResponse.json({ error: 'candidates array required' }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    for (const c of candidates) {
      // Insert into executive_profiles (with edited data)
      await client.query(
        `INSERT INTO executive_profiles
           (company_id, company_name, person_name, title, action, source_title, pub_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (company_id, person_name, title) DO NOTHING`,
        [c.company_id, c.company_name, c.person_name, c.title, c.action, c.source_title, c.pub_date]
      )

      // Delete from draft
      await client.query(
        'DELETE FROM executive_candidates_draft WHERE id = $1',
        [c.id]
      )
    }

    await client.query('COMMIT')

    // Trigger n8n enrichment webhook (fire-and-forget)
    const webhookUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678'
    fetch(`${webhookUrl}/webhook/executive-enrich`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: candidates.length }),
    }).catch(() => {})

    return NextResponse.json({ success: true, approved: candidates.length })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Batch approve error:', err)
    return NextResponse.json({ error: 'Batch approve failed' }, { status: 500 })
  } finally {
    client.release()
  }
}
