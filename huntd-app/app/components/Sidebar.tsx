'use client'

import { useState, useEffect } from 'react'
import companiesConfig from '@/config/companies.json'

type Company = {
  id: string
  name: string
  ats: string
  tags: string[]
}

type SidebarProps = {
  selectedCompany: string | null
  onSelectCompany: (companyId: string | null) => void
  jobCounts: Record<string, number>
}

export default function Sidebar({ selectedCompany, onSelectCompany, jobCounts }: SidebarProps) {
  const companies: Company[] = companiesConfig.companies

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-screen">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold">Huntd</h1>
        <p className="text-sm text-gray-400 mt-1">招聘信号监控</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        <button
          onClick={() => onSelectCompany(null)}
          className={`
            w-full text-left px-4 py-2.5 rounded-lg text-sm transition
            ${selectedCompany === null
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-800'
            }
          `}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">所有公司</span>
            <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">
              {Object.values(jobCounts).reduce((sum, count) => sum + count, 0)}
            </span>
          </div>
        </button>

        <div className="pt-4 pb-2 px-4 text-xs font-semibold text-gray-500 uppercase">
          公司列表
        </div>

        {companies.map((company) => (
          <button
            key={company.id}
            onClick={() => onSelectCompany(company.id)}
            className={`
              w-full text-left px-4 py-2.5 rounded-lg text-sm transition
              ${selectedCompany === company.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{company.name}</div>
                <div className="text-xs text-gray-400 capitalize">
                  {company.ats}
                </div>
              </div>
              <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">
                {jobCounts[company.id] || 0}
              </span>
            </div>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800 text-xs text-gray-500">
        <div className="mb-1">数据来源：ATS 公开 API</div>
        <div>每小时自动更新</div>
      </div>
    </div>
  )
}
