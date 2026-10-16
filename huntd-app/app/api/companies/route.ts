import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const since = sevenDaysAgo.toISOString().split('T')[0]

  const { rows: companies } = await pool.query(
    `SELECT c.id, c.name, c.domain, c.ats_platforms, c.tags,
            (COUNT(DISTINCT s.id) FILTER (WHERE s.signal_date >= $1 AND s.signal_category IS DISTINCT FROM 'irrelevant')
             + COUNT(DISTINCT f.id) FILTER (WHERE f.pub_date >= $1::timestamp)) AS signal_count_7d
     FROM global_companies c
     LEFT JOIN signals s ON s.company_id = c.id
     LEFT JOIN funding_signals f ON f.company_id = c.id
     WHERE c.is_active = true
     GROUP BY c.id
     ORDER BY c.name`,
    [since]
  )

  const result = companies.map(c => ({
    ...c,
    signal_count_7d: parseInt(c.signal_count_7d) || 0,
  }))

  return NextResponse.json({ companies: result })
}
