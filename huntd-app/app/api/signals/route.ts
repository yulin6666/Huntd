import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const company = searchParams.get('company')
  const type = searchParams.get('type')
  const keyword = searchParams.get('keyword')
  const since = searchParams.get('since')
  const limit = parseInt(searchParams.get('limit') || '100')
  const offset = parseInt(searchParams.get('offset') || '0')

  // Funding signals only
  if (type === 'funding') {
    const conditions: string[] = []
    const params: unknown[] = []

    if (company) {
      params.push(company)
      conditions.push(`company_id = $${params.length}`)
    }
    if (since) {
      params.push(since)
      conditions.push(`pub_date >= $${params.length}`)
    }
    if (keyword) {
      params.push(`%${keyword}%`)
      conditions.push(`(article_title ILIKE $${params.length} OR raw_summary ILIKE $${params.length})`)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    params.push(limit, offset)
    const { rows } = await pool.query(
      `SELECT id, company_id, company_name,
              'funding' AS signal_type,
              article_title AS signal_title,
              article_url AS signal_url,
              pub_date::date AS signal_date,
              raw_summary,
              amount, round, source,
              NULL AS ai_outreach,
              NULL AS signal_category,
              created_at
       FROM funding_signals ${where}
       ORDER BY pub_date DESC, created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    )

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) FROM funding_signals ${where}`,
      params.slice(0, -2)
    )

    return NextResponse.json({ signals: rows, total: parseInt(countRows[0].count) })
  }

  // All signals (unified signals + funding_signals)
  if (!type) {
    const conditions: string[] = []
    const params: unknown[] = []

    if (company) {
      params.push(company)
      conditions.push(`company_id = $${params.length}`)
    }
    if (since) {
      params.push(since)
      conditions.push(`signal_date >= $${params.length}`)
    }
    if (keyword) {
      params.push(`%${keyword}%`)
      conditions.push(`(signal_title ILIKE $${params.length} OR raw_summary ILIKE $${params.length})`)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    params.push(limit, offset)
    const { rows: signals } = await pool.query(
      `SELECT * FROM (
         SELECT id, company_id, company_name, signal_type, signal_title, signal_url, signal_date,
                raw_summary, ai_outreach, signal_category, created_at
         FROM signals
         WHERE signal_category IS DISTINCT FROM 'irrelevant'
         UNION ALL
         SELECT id, company_id, company_name,
                'funding' AS signal_type,
                article_title AS signal_title,
                article_url AS signal_url,
                pub_date::date AS signal_date,
                raw_summary,
                NULL AS ai_outreach,
                NULL AS signal_category,
                created_at
         FROM funding_signals
       ) combined ${where}
       ORDER BY signal_date DESC, created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    )

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) FROM (
         SELECT id, company_id, signal_date, signal_title, raw_summary FROM signals WHERE signal_category IS DISTINCT FROM 'irrelevant'
         UNION ALL
         SELECT id, company_id, pub_date::date AS signal_date, article_title AS signal_title, raw_summary FROM funding_signals
       ) combined ${where}`,
      params.slice(0, -2)
    )

    return NextResponse.json({ signals, total: parseInt(countRows[0].count) })
  }

  // Hiring / Executive signals from unified table
  const conditions: string[] = ["signal_category IS DISTINCT FROM 'irrelevant'"]
  const params: unknown[] = []

  if (company) {
    params.push(company)
    conditions.push(`company_id = $${params.length}`)
  }
  if (type) {
    params.push(type)
    conditions.push(`signal_type = $${params.length}`)
  }
  if (since) {
    params.push(since)
    conditions.push(`signal_date >= $${params.length}`)
  }
  if (keyword) {
    params.push(`%${keyword}%`)
    conditions.push(`(signal_title ILIKE $${params.length} OR raw_summary ILIKE $${params.length})`)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  params.push(limit, offset)
  const { rows: signals } = await pool.query(
    `SELECT * FROM signals ${where}
     ORDER BY signal_date DESC, created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  )

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) FROM signals ${where}`,
    params.slice(0, -2)
  )

  return NextResponse.json({ signals, total: parseInt(countRows[0].count) })
}
