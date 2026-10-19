'use client'

import { useState, useEffect } from 'react'

type EnrichmentItem = {
  type: 'digital' | 'event' | 'content'
  title: string
  url: string
  snippet: string | null
  position: number | null
}

type Profile = {
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
  profiles: Profile[]
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  joined: { label: 'JOINED', color: 'bg-blue-600' },
  left: { label: 'LEFT', color: 'bg-red-600' },
  appointed: { label: 'APPOINTED', color: 'bg-purple-600' },
}

export default function ExecutivesPage() {
  const [groups, setGroups] = useState<CompanyGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedProfiles, setExpandedProfiles] = useState<Set<string>>(new Set())

  const totalProfiles = groups.reduce((sum, g) => sum + g.profiles.length, 0)

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/executives')
        const data = await res.json()
        setGroups(data.groups || [])
      } catch (err) {
        console.error('Failed to fetch:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfiles()
  }, [])

  const toggleExpand = (id: string) => {
    setExpandedProfiles(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">Huntd</h1>
          <span className="text-gray-500">›</span>
          <h2 className="text-lg text-gray-300">Executives</h2>
          <span className="text-sm text-gray-500 ml-2">
            {totalProfiles} enriched
          </span>
        </div>
        <div className="flex gap-2">
          <a
            href="/executive-review"
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
          >
            Review Queue
          </a>
          <a
            href="/"
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
          >
            Signals
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Loading executives...
          </div>
        ) : groups.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No enriched executive profiles yet
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.company_id}>
                <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                  <span>📍</span>
                  {group.company_name}
                  <span className="text-xs text-gray-600">({group.profiles.length})</span>
                </h3>
                <div className="space-y-3">
                  {group.profiles.map((profile) => {
                    const actionCfg = ACTION_LABELS[profile.action] || {
                      label: profile.action.toUpperCase(),
                      color: 'bg-gray-600',
                    }
                    const isExpanded = expandedProfiles.has(profile.id)
                    const hasEnrichment = (profile.enrichment_data && profile.enrichment_data.length > 0) || profile.linkedin_url || profile.twitter_url || profile.github_url || profile.blog_url || profile.linkedin_snippet

                    return (
                      <div
                        key={profile.id}
                        className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden"
                      >
                        {/* Main Row */}
                        <div
                          className="flex items-center gap-4 px-4 py-3 hover:bg-gray-800/30 transition cursor-pointer"
                          onClick={() => toggleExpand(profile.id)}
                        >
                          {/* Expand Icon */}
                          <div className="w-5 flex items-center justify-center shrink-0">
                            {hasEnrichment && (
                              <span className="text-gray-500 transition-transform" style={{
                                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                              }}>
                                ▶
                              </span>
                            )}
                          </div>

                          {/* Name */}
                          <div className="w-48 shrink-0">
                            <div className="text-white font-medium">{profile.person_name}</div>
                          </div>

                          {/* Title */}
                          <div className="flex-1 min-w-0">
                            <div className="text-gray-300 text-sm truncate">{profile.title}</div>
                          </div>

                          {/* Action badge */}
                          <span
                            className={`text-xs px-2 py-0.5 ${actionCfg.color} text-white rounded uppercase shrink-0`}
                          >
                            {actionCfg.label}
                          </span>

                          {/* LinkedIn */}
                          {profile.linkedin_url && (
                            <a
                              href={profile.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-400 hover:text-blue-300 text-xs shrink-0"
                            >
                              LinkedIn
                            </a>
                          )}

                          {/* Enriched date */}
                          {profile.enriched_at && (
                            <span className="text-xs text-gray-500 shrink-0">
                              {formatDate(profile.enriched_at)}
                            </span>
                          )}
                        </div>

                        {/* Expanded Section */}
                        {isExpanded && hasEnrichment && (
                          <div className="px-4 py-3 bg-gray-800/50 border-t border-gray-800">
                            {/* Social Profiles */}
                            <div className="mb-4 flex flex-wrap gap-3">
                              {profile.linkedin_url && (
                                <a
                                  href={profile.linkedin_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
                                >
                                  🔗 LinkedIn
                                </a>
                              )}
                              {profile.twitter_url && (
                                <a
                                  href={profile.twitter_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-sky-400 hover:text-sky-300 hover:underline"
                                >
                                  🐦 Twitter
                                </a>
                              )}
                              {profile.github_url && (
                                <a
                                  href={profile.github_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-purple-400 hover:text-purple-300 hover:underline"
                                >
                                  💻 GitHub
                                </a>
                              )}
                              {profile.blog_url && (
                                <a
                                  href={profile.blog_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-orange-400 hover:text-orange-300 hover:underline"
                                >
                                  ✍️ Blog
                                </a>
                              )}
                            </div>

                            {/* LinkedIn Snippet */}
                            {profile.linkedin_snippet && (
                              <div className="mb-4">
                                <h4 className="text-xs font-semibold text-gray-400 mb-1.5">About</h4>
                                <p className="text-sm text-gray-300">{profile.linkedin_snippet}</p>
                              </div>
                            )}

                            {/* Enrichment Data */}
                            {profile.enrichment_data && profile.enrichment_data.length > 0 && (
                              <div>
                                <h4 className="text-xs font-semibold text-gray-400 mb-2">Activity & Content</h4>
                                <div className="space-y-2">
                                  {profile.enrichment_data.map((item, idx) => (
                                    <div key={idx} className="bg-gray-900 px-3 py-2 rounded border border-gray-700">
                                      <div className="flex items-start gap-2">
                                        <span
                                          className={`text-xs px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${
                                            item.type === 'event'
                                              ? 'bg-amber-900 text-amber-300'
                                              : item.type === 'content'
                                              ? 'bg-teal-900 text-teal-300'
                                              : 'bg-blue-900 text-blue-300'
                                          }`}
                                        >
                                          {item.type === 'event' ? 'Event' : item.type === 'content' ? 'Content' : 'Digital'}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                          <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-400 hover:text-blue-300 font-medium hover:underline block truncate"
                                          >
                                            {item.title}
                                          </a>
                                          {item.snippet && (
                                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                              {item.snippet}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
