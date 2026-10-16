'use client'

type SignalFilterBarProps = {
  signalType: string
  onTypeChange: (type: string) => void
  keyword: string
  onKeywordChange: (keyword: string) => void
  since: string
  onSinceChange: (since: string) => void
}

export default function SignalFilterBar({
  signalType,
  onTypeChange,
  keyword,
  onKeywordChange,
  since,
  onSinceChange,
}: SignalFilterBarProps) {
  const types = [
    { value: '', label: 'All Signals' },
    { value: 'hiring', label: '🔴 Hiring' },
    { value: 'funding', label: '💰 Funding' },
    { value: 'executive', label: '👤 Executive' },
  ]

  return (
    <div className="bg-gray-900 border-b border-gray-800 p-4">
      <div className="flex gap-4 items-center">
        <div className="flex gap-2">
          {types.map((t) => (
            <button
              key={t.value}
              onClick={() => onTypeChange(t.value)}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                signalType === t.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1">
          <input
            type="text"
            placeholder="Search signals..."
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={since}
          onChange={(e) => onSinceChange(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">All time</option>
          <option value={new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]}>
            Last 24 hours
          </option>
          <option value={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}>
            Last 7 days
          </option>
          <option value={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}>
            Last 30 days
          </option>
        </select>
      </div>
    </div>
  )
}
