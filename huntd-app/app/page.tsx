'use client'

import { useState, useEffect } from 'react'
import SignalSidebar from './components/SignalSidebar'
import SignalFilterBar from './components/SignalFilterBar'
import SignalList from './components/SignalList'
import SignalDrawer from './components/SignalDrawer'

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

type Company = {
  id: string
  name: string
  domain: string | null
  ats_platforms: string[] | null
  tags: string[] | null
  signal_count_7d: number
}

export default function Home() {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [signalType, setSignalType] = useState<string>('')
  const [keyword, setKeyword] = useState('')
  const [since, setSince] = useState('')
  const [signals, setSignals] = useState<Signal[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null)
  const [totalSignals, setTotalSignals] = useState(0)

  useEffect(() => {
    const fetchSignals = async () => {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedCompany) params.set('company', selectedCompany)
      if (signalType) params.set('type', signalType)
      if (keyword) params.set('keyword', keyword)
      if (since) params.set('since', since)

      const response = await fetch(`/api/signals?${params}`)
      const data = await response.json()
      setSignals(data.signals || [])
      setTotalSignals(data.total || 0)
      setLoading(false)
    }

    fetchSignals()
  }, [selectedCompany, signalType, keyword, since])

  useEffect(() => {
    const fetchCompanies = async () => {
      console.log('前端：开始获取公司列表...')
      try {
        const response = await fetch('/api/companies')
        console.log('前端：API 响应状态', response.status)
        const data = await response.json()
        console.log('前端：收到的数据', data)
        setCompanies(data.companies || [])
      } catch (error) {
        console.error('前端：获取公司列表失败', error)
      }
    }

    fetchCompanies()
  }, [])

  return (
    <div className="flex h-screen">
      <SignalSidebar
        companies={companies}
        selectedCompany={selectedCompany}
        onSelectCompany={setSelectedCompany}
        totalSignals={totalSignals}
      />
      <div className="flex-1 flex flex-col">
        <SignalFilterBar
          signalType={signalType}
          onTypeChange={setSignalType}
          keyword={keyword}
          onKeywordChange={setKeyword}
          since={since}
          onSinceChange={setSince}
        />
        <div className="flex-1 overflow-y-auto">
          <SignalList
            signals={signals}
            loading={loading}
            onSignalClick={setSelectedSignal}
          />
        </div>
      </div>

      {selectedSignal && (
        <SignalDrawer
          signal={selectedSignal}
          onClose={() => setSelectedSignal(null)}
        />
      )}
    </div>
  )
}
