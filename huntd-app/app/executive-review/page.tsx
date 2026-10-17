'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

type Candidate = {
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
  candidates: Candidate[]
}

type EditedFields = {
  person_name?: string
  title?: string
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  joined: { label: 'JOINED', color: 'bg-blue-600' },
  left: { label: 'LEFT', color: 'bg-red-600' },
  appointed: { label: 'APPOINTED', color: 'bg-purple-600' },
}

// --- Inline Editable Field ---
function InlineEdit({
  value,
  onSave,
  className,
}: {
  value: string
  onSave: (v: string) => void
  className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  if (!editing) {
    return (
      <span
        onClick={() => { setDraft(value); setEditing(true) }}
        className={`cursor-pointer hover:bg-gray-800 px-1 -mx-1 rounded transition ${className}`}
        title="Click to edit"
      >
        {value}
      </span>
    )
  }

  return (
    <input
      ref={inputRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        setEditing(false)
        if (draft.trim() && draft !== value) onSave(draft.trim())
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.currentTarget.blur() }
        if (e.key === 'Escape') { setDraft(value); setEditing(false) }
      }}
      className={`bg-gray-800 border border-gray-600 text-white px-2 py-0.5 rounded text-sm focus:outline-none focus:border-blue-500 ${className}`}
    />
  )
}

// --- Main Page ---
export default function ExecutiveReview() {
  const [groups, setGroups] = useState<CompanyGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [edits, setEdits] = useState<Map<string, EditedFields>>(new Map())
  const [acting, setActing] = useState(false)

  const totalCandidates = groups.reduce((sum, g) => sum + g.candidates.length, 0)

  const fetchGroups = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/executive-candidates')
      const data = await res.json()
      setGroups(data.groups || [])
    } catch (err) {
      console.error('Failed to fetch:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchGroups() }, [fetchGroups])

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    const allIds = groups.flatMap(g => g.candidates.map(c => c.id))
    if (selected.size === allIds.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(allIds))
    }
  }

  const updateEdit = (id: string, field: keyof EditedFields, value: string) => {
    setEdits(prev => {
      const next = new Map(prev)
      const existing = next.get(id) || {}
      next.set(id, { ...existing, [field]: value })
      return next
    })
  }

  const getDisplayValue = (c: Candidate, field: 'person_name' | 'title') => {
    return edits.get(c.id)?.[field] ?? c[field]
  }

  const isEdited = (id: string) => edits.has(id)

  const handleApprove = async () => {
    if (selected.size === 0) return
    setActing(true)
    try {
      const candidates = groups
        .flatMap(g => g.candidates)
        .filter(c => selected.has(c.id))
        .map(c => ({
          id: c.id,
          company_id: c.company_id,
          company_name: c.company_name,
          person_name: getDisplayValue(c, 'person_name'),
          title: getDisplayValue(c, 'title'),
          action: c.action,
          source_title: c.source_title,
          pub_date: c.pub_date,
        }))

      const res = await fetch('/api/executive-candidates/batch-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidates }),
      })
      if (res.ok) {
        setSelected(new Set())
        setEdits(new Map())
        await fetchGroups()
      }
    } catch (err) {
      console.error('Approve failed:', err)
    } finally {
      setActing(false)
    }
  }

  const handleReject = async () => {
    if (selected.size === 0) return
    setActing(true)
    try {
      const ids = Array.from(selected)
      const res = await fetch('/api/executive-candidates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (res.ok) {
        setSelected(new Set())
        setEdits(prev => {
          const next = new Map(prev)
          ids.forEach(id => next.delete(id))
          return next
        })
        await fetchGroups()
      }
    } catch (err) {
      console.error('Reject failed:', err)
    } finally {
      setActing(false)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">Huntd</h1>
          <span className="text-gray-500">›</span>
          <h2 className="text-lg text-gray-300">Executive Review</h2>
          <span className="text-sm text-gray-500 ml-2">
            {totalCandidates} pending
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAll}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg transition"
          >
            {selected.size === totalCandidates && totalCandidates > 0 ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Loading candidates...
          </div>
        ) : groups.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No draft candidates to review
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.company_id}>
                <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
                  <span>📍</span>
                  {group.company_name}
                  <span className="text-xs text-gray-600">({group.candidates.length})</span>
                </h3>
                <div className="bg-gray-900 rounded-lg border border-gray-800 divide-y divide-gray-800">
                  {group.candidates.map((c) => {
                    const actionCfg = ACTION_LABELS[c.action] || { label: c.action.toUpperCase(), color: 'bg-gray-600' }
                    const checked = selected.has(c.id)
                    const edited = isEdited(c.id)

                    return (
                      <div
                        key={c.id}
                        className={`flex items-center gap-4 px-4 py-3 transition ${
                          checked ? 'bg-gray-800/50' : 'hover:bg-gray-800/30'
                        }`}
                      >
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelect(c.id)}
                          className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900 bg-gray-800"
                        />

                        {/* Name (editable) */}
                        <div className="w-48">
                          <InlineEdit
                            value={getDisplayValue(c, 'person_name')}
                            onSave={(v) => updateEdit(c.id, 'person_name', v)}
                            className="text-white font-medium"
                          />
                        </div>

                        {/* Title (editable) */}
                        <div className="flex-1 min-w-0">
                          <InlineEdit
                            value={getDisplayValue(c, 'title')}
                            onSave={(v) => updateEdit(c.id, 'title', v)}
                            className="text-gray-300 text-sm"
                          />
                        </div>

                        {/* Action badge */}
                        <span className={`text-xs px-2 py-0.5 ${actionCfg.color} text-white rounded uppercase shrink-0`}>
                          {actionCfg.label}
                        </span>

                        {/* Source info */}
                        {c.source_title && (
                          <span className="text-xs text-gray-300 shrink-0">
                            {c.source_title}
                          </span>
                        )}

                        {/* Date */}
                        {c.pub_date && (
                          <span className="text-xs text-gray-500 shrink-0">
                            {formatDate(c.pub_date)}
                          </span>
                        )}

                        {/* Edited badge */}
                        {edited && (
                          <span className="text-xs text-yellow-500 shrink-0">✏️</span>
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

      {/* Bottom Action Bar */}
      {totalCandidates > 0 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-800 bg-gray-900">
          <div className="text-sm text-gray-400">
            {selected.size} of {totalCandidates} selected
            {edits.size > 0 && (
              <span className="ml-2 text-yellow-500">· {edits.size} edited</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReject}
              disabled={selected.size === 0 || acting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition"
            >
              ✗ Reject Selected ({selected.size})
            </button>
            <button
              onClick={handleApprove}
              disabled={selected.size === 0 || acting}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition"
            >
              ✓ Approve Selected ({selected.size})
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
