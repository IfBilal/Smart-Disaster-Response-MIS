'use client'

import { useEffect, useState, use } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

interface ReportDetail {
  report_id: number
  disaster_type: string
  severity_level: string
  location: string
  latitude: number
  longitude: number
  status: string
  reported_at: string
  resolved_at: string
  citizen_name: string
  citizen_phone: string
  assigned_operator: string
  assignments: {
    assignment_id: number
    team_name: string
    team_type: string
    status: string
    assigned_at: string
  }[]
  allocations: {
    allocation_id: number
    resource_name: string
    qty_requested: number
    qty_dispatched: number
    status: string
  }[]
}

const statusColor: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-200 text-gray-500',
}

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [report, setReport] = useState<ReportDetail | null>(null)
  const [user, setUser] = useState({ username: '', role: '' })
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.username) setUser(d) })
    fetch(`/api/reports/${id}`).then(r => r.json()).then(d => {
      if (d.report_id) setReport(d)
    })
  }, [id])

  async function updateStatus(newStatus: string) {
    setUpdating(true)
    const res = await fetch(`/api/reports/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setUpdating(false)
    if (res.ok) {
      setReport(prev => prev ? { ...prev, status: newStatus } : prev)
    } else {
      const data = await res.json()
      alert(data.error || 'Update failed')
    }
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar username={user.username} role={user.role} />
        <div className="p-6 text-center text-gray-400">Loading report...</div>
      </div>
    )
  }

  const canUpdate = user.role === 'admin' || user.role === 'emergency_operator'

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar username={user.username} role={user.role} />

      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
          <Link href="/reports" className="hover:underline">Reports</Link>
          <span>/</span>
          <span>#{report.report_id}</span>
        </div>

        <div className="bg-white rounded shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800 capitalize">
                {report.disaster_type} Emergency — #{report.report_id}
              </h2>
              <p className="text-gray-500 text-sm mt-1">{report.location}</p>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded text-sm ${statusColor[report.status] || ''}`}>
                {report.status.replace('_', ' ')}
              </span>
              <span className="px-3 py-1 rounded text-sm bg-red-100 text-red-700">
                {report.severity_level}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Reporter</p>
              <p className="font-medium">{report.citizen_name}</p>
              {report.citizen_phone && <p className="text-gray-500">{report.citizen_phone}</p>}
            </div>
            <div>
              <p className="text-gray-500">Assigned Operator</p>
              <p className="font-medium">{report.assigned_operator || 'Unassigned'}</p>
            </div>
            <div>
              <p className="text-gray-500">Reported At</p>
              <p className="font-medium">{new Date(report.reported_at).toLocaleString()}</p>
            </div>
            {report.resolved_at && (
              <div>
                <p className="text-gray-500">Resolved At</p>
                <p className="font-medium">{new Date(report.resolved_at).toLocaleString()}</p>
              </div>
            )}
            {report.latitude && (
              <div>
                <p className="text-gray-500">Coordinates</p>
                <p className="font-medium">{report.latitude}, {report.longitude}</p>
              </div>
            )}
          </div>

          {canUpdate && (
            <div className="mt-4 pt-4 border-t flex gap-2">
              <span className="text-sm text-gray-500 self-center">Update Status:</span>
              {['pending', 'in_progress', 'resolved', 'closed'].map(s => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  disabled={updating || report.status === s}
                  className={`text-xs px-3 py-1.5 rounded border ${report.status === s ? 'bg-gray-200 text-gray-500 cursor-default' : 'hover:bg-gray-100'}`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Team Assignments</h3>
            {report.assignments?.length > 0 ? (
              <div className="space-y-2">
                {report.assignments.map(a => (
                  <div key={a.assignment_id} className="border rounded p-3 text-sm">
                    <p className="font-medium">{a.team_name}</p>
                    <p className="text-gray-500 text-xs">{a.team_type} • {a.status}</p>
                    <p className="text-gray-400 text-xs">{new Date(a.assigned_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No teams assigned</p>
            )}
          </div>

          <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Resource Allocations</h3>
            {report.allocations?.length > 0 ? (
              <div className="space-y-2">
                {report.allocations.map(a => (
                  <div key={a.allocation_id} className="border rounded p-3 text-sm">
                    <div className="flex justify-between">
                      <p className="font-medium">{a.resource_name}</p>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{a.status}</span>
                    </div>
                    <p className="text-gray-500 text-xs">
                      Requested: {a.qty_requested} | Dispatched: {a.qty_dispatched}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No resources allocated</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
