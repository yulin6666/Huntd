'use client'

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

type SignalListProps = {
  signals: Signal[]
  loading: boolean
  onSignalClick: (signal: Signal) => void
}

const signalIcons: Record<string, string> = {
  hiring: '🔴',
  funding: '💰',
  executive: '👤'
}

const signalColors: Record<string, string> = {
  hiring: 'border-l-red-500 bg-red-950/20',
  funding: 'border-l-yellow-500 bg-yellow-950/20',
  executive: 'border-l-purple-500 bg-purple-950/20'
}

export default function SignalList({ signals, loading, onSignalClick }: SignalListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading signals...</div>
      </div>
    )
  }

  if (signals.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No signals found</div>
      </div>
    )
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  return (
    <div className="divide-y divide-gray-800">
      {signals.map((signal) => (
        <div
          key={signal.id}
          onClick={() => onSignalClick(signal)}
          className={`p-6 hover:bg-gray-900 transition cursor-pointer border-l-4 ${
            signalColors[signal.signal_type]
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{signalIcons[signal.signal_type]}</span>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                    {signal.signal_type}
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    {signal.signal_title}
                  </h3>
                </div>
              </div>

              {signal.raw_summary && (
                <p className="text-sm text-gray-400 line-clamp-2 mb-3 ml-11">
                  {signal.raw_summary}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-500 ml-11">
                <span>{formatDate(signal.signal_date)}</span>
                <span>•</span>
                <span>{signal.company_name}</span>
              </div>
            </div>

            <button
              className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition whitespace-nowrap"
            >
              View Outreach →
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
