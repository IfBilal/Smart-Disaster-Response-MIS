'use client'

import { useEffect, useState, useCallback } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

interface Report {
  report_id: number
  disaster_type: string
  severity_level: string
  location: string
  status: string
  citizen_name: string
  reported_at: string
}

interface Team {
  team_id: number
  team_name: string
  team_type: string
  availability_status: string
  current_location: string
  current_members: number
}

const severityColor: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
}

export default function OperatorDashboard() {
  const [reports, setReports] = useState<Report[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [user, setUser] = useState({ username: '', role: 'emergency_operator' })

  const loadData = useCallback(() => {
    fetch('/api/reports?status=pending').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setReports(d.slice(0, 10))
    })
    fetch('/api/teams').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setTeams(d.filter((t: Team) => t.availability_status === 'available'))
    })
  }, [])

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.username) setUser(d) })
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [loadData])

  async function assignTeam(teamId: number, reportId: number) {
    const res = await fetch(`/api/teams/${teamId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report_id: reportId }),
    })
    if (res.ok) {
      alert('Team assigned successfully')
      loadData()
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to assign team')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar username={user.username} role={user.role} />

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Emergency Operator Dashboard</h2>
          <Link href="/reports/new" className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700">
            + New Report
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Pending Reports ({reports.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {reports.map(r => (
                <div key={r.report_id} className="border rounded p-3 text-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link href={`/reports/${r.report_id}`} className="font-medium text-blue-600 hover:underline">
                        #{r.report_id} — {r.disaster_type}
                      </Link>
                      <p className="text-gray-500 text-xs">{r.location}</p>
                      <p className="text-gray-500 text-xs">Reported by: {r.citizen_name}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${severityColor[r.severity_level] || 'bg-gray-100 text-gray-600'}`}>
                      {r.severity_level}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    {teams.slice(0, 3).map(t => (
                      <button
                        key={t.team_id}
                        onClick={() => assignTeam(t.team_id, r.report_id)}
                        className="bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700"
                      >
                        Assign {t.team_name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {reports.length === 0 && <p className="text-sm text-gray-400">No pending reports</p>}
            </div>
            <Link href="/reports" className="text-blue-600 text-xs mt-3 block hover:underline">View all reports →</Link>
          </div>

          <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Available Teams ({teams.length})</h3>
            <div className="space-y-2">
              {teams.map(t => (
                <div key={t.team_id} className="border rounded p-3 text-sm">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{t.team_name}</p>
                      <p className="text-gray-500 text-xs">{t.team_type} • {t.current_members} members</p>
                      <p className="text-gray-500 text-xs">{t.current_location || 'Location unknown'}</p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded h-fit">Available</span>
                  </div>
                </div>
              ))}
              {teams.length === 0 && <p className="text-sm text-gray-400">No available teams</p>}
            </div>
            <Link href="/teams" className="text-blue-600 text-xs mt-3 block hover:underline">View all teams →</Link>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-400 text-right">Auto-refreshes every 30 seconds</div>
      </div>
    </div>
  )
}
