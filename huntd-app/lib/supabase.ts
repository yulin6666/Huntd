import { createClient } from '@supabase/supabase-js'
import { HttpsProxyAgent } from 'https-proxy-agent'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 配置代理
const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy
const options = proxyUrl
  ? {
      global: {
        fetch: (url: RequestInfo | URL, init?: RequestInit) => {
          return fetch(url, {
            ...init,
            // @ts-ignore
            agent: new HttpsProxyAgent(proxyUrl),
          })
        },
      },
    }
  : {}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, options)

export type Job = {
  id: string
  company_id: string
  company_name: string
  title: string
  location: string | null
  url: string
  ats_platform: string
  first_seen_at: string
  updated_at: string
  is_matched: boolean
  matched_keywords: string[]
  description_snippet: string | null
}
