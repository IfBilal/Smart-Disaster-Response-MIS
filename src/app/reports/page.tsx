'use client'

import { useEffect, useState } from 'react'
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
  assigned_operator: string
}

const severityColor: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
}

const statusColor: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-200 text-gray-500',
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [user, setUser] = useState({ username: '', role: '' })
  const [filters, setFilters] = useState({ status: '', severity: '', disaster_type: '' })
  const [loading, setLoading] = useState(true)

  function buildQuery() {
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.severity) params.set('severity', filters.severity)
    if (filters.disaster_type) params.set('disaster_type', filters.disaster_type)
    return params.toString()
  }

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.username) setUser(d) })
  }, [])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/reports?${buildQuery()}`).then(r => r.json()).then(d => {
      if (Array.isArray(d)) setReports(d)
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar username={user.username} role={user.role} />

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Emergency Reports</h2>
          <Link href="/reports/new" className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700">
            + New Report
          </Link>
        </div>

        <div className="bg-white rounded shadow p-4 mb-4">
          <div className="flex gap-3 flex-wrap">
            <select
              value={filters.status}
              onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="border rounded px-3 py-1.5 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={filters.severity}
              onChange={e => setFilters(prev => ({ ...prev, severity: e.target.value }))}
              className="border rounded px-3 py-1.5 text-sm"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={filters.disaster_type}
              onChange={e => setFilters(prev => ({ ...prev, disaster_type: e.target.value }))}
              className="border rounded px-3 py-1.5 text-sm"
            >
              <option value="">All Types</option>
              <option value="flood">Flood</option>
              <option value="earthquake">Earthquake</option>
              <option value="fire">Fire</option>
              <option value="other">Other</option>
            </select>
            <button
              onClick={() => setFilters({ status: '', severity: '', disaster_type: '' })}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="bg-white rounded shadow overflow-hidden">
          {loading ? (
            <p className="p-6 text-sm text-gray-400">Loading...</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600">ID</th>
                  <th className="px-4 py-3 text-left text-gray-600">Type</th>
                  <th className="px-4 py-3 text-left text-gray-600">Severity</th>
                  <th className="px-4 py-3 text-left text-gray-600">Location</th>
                  <th className="px-4 py-3 text-left text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-gray-600">Reporter</th>
                  <th className="px-4 py-3 text-left text-gray-600">Reported At</th>
                  <th className="px-4 py-3 text-left text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.report_id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">#{r.report_id}</td>
                    <td className="px-4 py-3 capitalize">{r.disaster_type}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${severityColor[r.severity_level] || ''}`}>
                        {r.severity_level}
                      </span>
                    </td>
                    <td className="px-4 py-3">{r.location}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${statusColor[r.status] || ''}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{r.citizen_name}</td>
                    <td className="px-4 py-3">{new Date(r.reported_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Link href={`/reports/${r.report_id}`} className="text-blue-600 hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-gray-400">No reports found</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
