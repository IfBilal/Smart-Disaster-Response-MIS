'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

interface Stats {
  totalReports: number
  activeTeams: number
  lowStock: number
  pendingApprovals: number
  totalDonations: number
  netBalance: number
}

interface AuditEntry {
  log_id: number
  performed_by: string
  action_type: string
  table_affected: string
  action_timestamp: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [audit, setAudit] = useState<AuditEntry[]>([])
  const [user, setUser] = useState({ username: '', role: 'admin' })

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.username) setUser(d)
    })

    fetch('/api/analytics/incidents').then(r => r.json()).then(data => {
      const total = data.byType?.reduce((s: number, x: { count: number }) => s + x.count, 0) || 0
      setStats(prev => ({ ...prev, totalReports: total } as Stats))
    })

    fetch('/api/analytics/financial').then(r => r.json()).then(data => {
      setStats(prev => ({
        ...prev,
        totalDonations: data.summary?.total_donations || 0,
        netBalance: data.summary?.net_balance || 0,
      } as Stats))
    })

    fetch('/api/teams').then(r => r.json()).then(data => {
      const active = Array.isArray(data) ? data.filter((t: { availability_status: string }) => t.availability_status === 'assigned').length : 0
      setStats(prev => ({ ...prev, activeTeams: active } as Stats))
    })

    fetch('/api/resources/inventory?low_stock=true').then(r => r.json()).then(data => {
      setStats(prev => ({ ...prev, lowStock: Array.isArray(data) ? data.length : 0 } as Stats))
    })

    fetch('/api/approvals').then(r => r.json()).then(data => {
      setStats(prev => ({ ...prev, pendingApprovals: Array.isArray(data) ? data.length : 0 } as Stats))
    })

    fetch('/api/audit').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setAudit(data.slice(0, 8))
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar username={user.username} role={user.role} />

      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Admin Dashboard</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Reports" value={stats?.totalReports ?? '—'} color="blue" />
          <StatCard label="Active Teams" value={stats?.activeTeams ?? '—'} color="green" />
          <StatCard label="Low Stock Alerts" value={stats?.lowStock ?? '—'} color="yellow" />
          <StatCard label="Pending Approvals" value={stats?.pendingApprovals ?? '—'} color="red" />
          <StatCard label="Total Donations (PKR)" value={stats?.totalDonations ? stats.totalDonations.toLocaleString() : '—'} color="purple" />
          <StatCard label="Net Balance (PKR)" value={stats?.netBalance ? stats.netBalance.toLocaleString() : '—'} color="teal" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/reports" className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm px-3 py-2 rounded text-center">View Reports</Link>
              <Link href="/teams" className="bg-green-50 hover:bg-green-100 text-green-700 text-sm px-3 py-2 rounded text-center">Manage Teams</Link>
              <Link href="/approvals" className="bg-red-50 hover:bg-red-100 text-red-700 text-sm px-3 py-2 rounded text-center">Approvals Queue</Link>
              <Link href="/resources" className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 text-sm px-3 py-2 rounded text-center">Inventory</Link>
              <Link href="/financial" className="bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm px-3 py-2 rounded text-center">Financial</Link>
              <Link href="/audit" className="bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm px-3 py-2 rounded text-center">Audit Log</Link>
            </div>
          </div>

          <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Recent Activity</h3>
            <div className="space-y-2">
              {audit.map((entry) => (
                <div key={entry.log_id} className="text-sm border-b pb-1">
                  <span className="font-medium">{entry.performed_by}</span>
                  {' '}
                  <span className="text-gray-500">{entry.action_type}</span>
                  {' on '}
                  <span className="text-blue-600">{entry.table_affected}</span>
                  <div className="text-xs text-gray-400">{new Date(entry.action_timestamp).toLocaleString()}</div>
                </div>
              ))}
              {audit.length === 0 && <p className="text-sm text-gray-400">No recent activity</p>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-2">Analytics</h3>
          <Link href="/analytics" className="text-blue-600 text-sm hover:underline">View full analytics dashboard →</Link>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    teal: 'bg-teal-50 border-teal-200 text-teal-800',
  }
  return (
    <div className={`border rounded p-4 ${colors[color]}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  )
}
