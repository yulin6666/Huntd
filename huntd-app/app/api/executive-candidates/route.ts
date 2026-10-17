import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

type DraftRow = {
  id: string
  company_id: string
  company_name: string
  person_name: string
  title: string
  action: string
  source_title: string | null
  pub_date: string | null
  created_at: string
}

type CompanyGroup = {
  company_id: string
  company_name: string
  candidates: DraftRow[]
}

// GET: Fetch all drafts grouped by company
export async function GET() {
  const { rows } = await pool.query<DraftRow>(
    `SELECT id, company_id, company_name, person_name, title, action,
            source_title, pub_date, created_at
     FROM executive_candidates_draft
     ORDER BY company_name, created_at DESC`
  )

  const groupMap = new Map<string, CompanyGroup>()
  for (const row of rows) {
    if (!groupMap.has(row.company_id)) {
      groupMap.set(row.company_id, {
        company_id: row.company_id,
        company_name: row.company_name,
        candidates: [],
      })
    }
    groupMap.get(row.company_id)!.candidates.push(row)
  }

  return NextResponse.json({ groups: Array.from(groupMap.values()) })
}

// DELETE: Batch reject (delete drafts by ids)
export async function DELETE(request: NextRequest) {
  const body = await request.json()
  const { ids } = body as { ids: string[] }

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids array required' }, { status: 400 })
  }

  const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ')
  await pool.query(
    `DELETE FROM executive_candidates_draft WHERE id IN (${placeholders})`,
    ids
  )

  return NextResponse.json({ success: true, deleted: ids.length })
}
