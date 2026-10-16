'use client'

type Job = {
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

type JobListProps = {
  jobs: Job[]
  loading: boolean
}

export default function JobList({ jobs, loading }: JobListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">暂无职位数据</div>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-800">
      {jobs.map((job) => (
        <div
          key={job.id}
          className={`p-6 hover:bg-gray-900 transition ${
            job.is_matched ? 'border-l-4 border-l-green-500' : ''
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-400">
                  {job.company_name}
                </span>
                <span className="text-xs px-2 py-1 rounded bg-blue-900 text-blue-300 capitalize">
                  {job.ats_platform}
                </span>
              </div>

              {job.location && (
                <div className="text-sm text-gray-400 mb-2">📍 {job.location}</div>
              )}

              {job.is_matched && job.matched_keywords.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {job.matched_keywords.slice(0, 5).map((kw, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 rounded bg-green-900 text-green-300"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              )}

              {job.description_snippet && (
                <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                  {job.description_snippet}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>首次发现：{new Date(job.first_seen_at).toLocaleDateString('zh-CN')}</span>
                <span>最后更新：{new Date(job.updated_at).toLocaleDateString('zh-CN')}</span>
              </div>
            </div>

            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition"
            >
              查看详情 →
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}
