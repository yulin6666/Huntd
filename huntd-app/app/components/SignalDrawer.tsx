'use client'

import { useState } from 'react'

type Signal = {
  id: string
  company_id: string
  company_name: string
  signal_type: 'hiring' | 'funding' | 'executive'
  signal_title: string
  signal_url: string | null
  signal_date: string
  raw_summary: string | null
  ai_outreach: string | null
  created_at: string
}

type SignalDrawerProps = {
  signal: Signal | null
  onClose: () => void
}

export default function SignalDrawer({ signal, onClose }: SignalDrawerProps) {
  const [copied, setCopied] = useState(false)

  if (!signal) return null

  const handleCopy = () => {
    if (signal.ai_outreach) {
      navigator.clipboard.writeText(signal.ai_outreach)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const signalTypeLabel: Record<string, string> = {
    hiring: 'Hiring Signal',
    funding: 'Funding Signal',
    executive: 'Executive Change',
  }

  const signalIcons: Record<string, string> = {
    hiring: '🔴',
    funding: '💰',
    executive: '👤'
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[500px] bg-gray-950 border-l border-gray-800 z-50 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{signalIcons[signal.signal_type]}</span>
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">
                {signalTypeLabel[signal.signal_type]}
              </div>
              <div className="font-semibold text-white">{signal.company_name}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Signal Title */}
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white mb-2">{signal.signal_title}</h2>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>{formatDate(signal.signal_date)}</span>
            {signal.signal_url && (
              <>
                <span>•</span>
                <a
                  href={signal.signal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300"
                >
                  View source ↗
                </a>
              </>
            )}
          </div>
        </div>

        {/* Raw Signal */}
        {signal.raw_summary && (
          <div className="p-6 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
              Raw Signal
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              {signal.raw_summary}
            </p>
          </div>
        )}

        {/* AI Outreach */}
        <div className="p-6 flex-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              AI Outreach Draft
            </h3>
            <button
              onClick={handleCopy}
              disabled={!signal.ai_outreach}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-xs rounded-lg transition disabled:opacity-50"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {signal.ai_outreach ? (
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                {signal.ai_outreach}
              </p>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-sm text-gray-500 italic">
                No outreach draft generated yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
