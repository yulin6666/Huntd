import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { searchParams } = new URL(request.url)
  const company = searchParams.get('company')
  const matched = searchParams.get('matched')
  const keyword = searchParams.get('keyword')
  const since = searchParams.get('since')
  const limit = parseInt(searchParams.get('limit') || '100')
  const offset = parseInt(searchParams.get('offset') || '0')

  let query = supabase
    .from('jobs')
    .select('*', { count: 'exact' })
    .order('first_seen_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (company) query = query.eq('company_id', company)
  if (matched === 'true') query = query.eq('is_matched', true)
  if (matched === 'false') query = query.eq('is_matched', false)
  if (since) query = query.gte('first_seen_at', since)
  if (keyword) {
    query = query.or(
      `title.ilike.%${keyword}%,description_snippet.ilike.%${keyword}%`
    )
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ jobs: data, total: count })
}
