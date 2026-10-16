'use client'

import { useState } from 'react'

type FilterProps = {
  matched: boolean | null
  onMatchedChange: (matched: boolean | null) => void
  keyword: string
  onKeywordChange: (keyword: string) => void
  since: string
  onSinceChange: (since: string) => void
}

export default function FilterBar({
  matched,
  onMatchedChange,
  keyword,
  onKeywordChange,
  since,
  onSinceChange,
}: FilterProps) {
  return (
    <div className="bg-gray-900 border-b border-gray-800 p-4">
      <div className="flex gap-4 items-center">
        {/* 关键词筛选 */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="搜索职位标题或描述..."
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* 匹配状态 */}
        <div className="flex gap-2">
          <button
            onClick={() => onMatchedChange(null)}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              matched === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => onMatchedChange(true)}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              matched === true
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            ✓ 匹配关键词
          </button>
          <button
            onClick={() => onMatchedChange(false)}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              matched === false
                ? 'bg-gray-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            其他
          </button>
        </div>

        {/* 时间筛选 */}
        <select
          value={since}
          onChange={(e) => onSinceChange(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">全部时间</option>
          <option value={new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}>
            24小时内
          </option>
          <option value={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}>
            7天内
          </option>
          <option value={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}>
            30天内
          </option>
        </select>
      </div>
    </div>
  )
}
