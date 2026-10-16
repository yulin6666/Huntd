import { createClient } from '@supabase/supabase-js'
import { HttpsProxyAgent } from 'https-proxy-agent'

export function createSupabaseClient() {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy

  const options = proxyUrl
    ? {
        global: {
          fetch: (url: RequestInfo | URL, init?: RequestInit) => {
            return fetch(url, {
              ...init,
              // @ts-ignore - Node.js fetch accepts agent
              agent: new HttpsProxyAgent(proxyUrl),
            })
          },
        },
      }
    : {}

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    options
  )
}
