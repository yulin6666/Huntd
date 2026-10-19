import { NextResponse } from 'next/server'
import pool from '@/lib/db'

type EnrichmentItem = {
  type: 'digital' | 'event' | 'content'
  title: string
  url: string
  snippet: string | null
  position: number | null
}

type ProfileRow = {
  id: string
  company_id: string
  company_name: string
  person_name: string
  title: string
  action: string
  source_title: string | null
  pub_date: string | null
  linkedin_url: string | null
  linkedin_snippet: string | null
  twitter_url: string | null
  github_url: string | null
  blog_url: string | null
  enrichment_data: EnrichmentItem[] | null
  enriched_at: string | null
  detected_at: string
}

type CompanyGroup = {
  company_id: string
  company_name: string
  profiles: ProfileRow[]
}

// GET: Fetch all enriched executive profiles grouped by company
export async function GET() {
  try {
    const { rows } = await pool.query<ProfileRow>(
      `SELECT
        id, company_id, company_name, person_name, title, action,
        source_title, pub_date, linkedin_url, linkedin_snippet,
        twitter_url, github_url, blog_url,
        enrichment_data, enriched_at, detected_at
       FROM executive_profiles
       WHERE enriched_at IS NOT NULL
       ORDER BY company_name, enriched_at DESC`
    )

    const groupMap = new Map<string, CompanyGroup>()
    for (const row of rows) {
      if (!groupMap.has(row.company_id)) {
        groupMap.set(row.company_id, {
          company_id: row.company_id,
          company_name: row.company_name,
          profiles: [],
        })
      }
      groupMap.get(row.company_id)!.profiles.push(row)
    }

    return NextResponse.json({ groups: Array.from(groupMap.values()) })
  } catch (error) {
    console.error('Error fetching executive profiles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profiles', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
