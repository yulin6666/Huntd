'use client'

type Company = {
  id: string
  name: string
  domain: string | null
  ats_platforms: string[] | null
  tags: string[] | null
  signal_count_7d: number
}

type SignalSidebarProps = {
  companies: Company[]
  selectedCompany: string | null
  onSelectCompany: (companyId: string | null) => void
  totalSignals: number
}

export default function SignalSidebar({
  companies,
  selectedCompany,
  onSelectCompany,
  totalSignals,
}: SignalSidebarProps) {
  const totalCount7d = companies.reduce((sum, c) => sum + c.signal_count_7d, 0)

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-screen">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white">Huntd</h1>
        <p className="text-sm text-gray-400 mt-1">Buy Signal Platform</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        <button
          onClick={() => onSelectCompany(null)}
          className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition ${
            selectedCompany === null
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">All Companies</span>
            <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">{totalSignals}</span>
          </div>
        </button>

        <div className="pt-4 pb-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Companies (7d signals)
        </div>

        {companies.map((company) => (
          <button
            key={company.id}
            onClick={() => onSelectCompany(company.id)}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition ${
              selectedCompany === company.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{company.name}</div>
                {company.ats_platforms && company.ats_platforms.length > 0 && (
                  <div className="text-xs text-gray-400 capitalize">
                    {company.ats_platforms.join(', ')}
                  </div>
                )}
              </div>
              <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">
                {company.signal_count_7d}
              </span>
            </div>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800 space-y-1">
        <a
          href="/executives"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition w-full"
        >
          <span>👤</span>
          <span>Executives</span>
        </a>
        <a
          href="/executive-review"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition w-full"
        >
          <span>📋</span>
          <span>Review Queue</span>
        </a>
        <div className="px-4 pt-2 text-xs text-gray-500">
          <div className="mb-1">Sources: ATS APIs, RSS, LinkedIn</div>
          <div>Signals refresh daily</div>
        </div>
      </div>
    </div>
  )
}
