'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'

interface AuditEntry {
  log_id: number
  action_type: string
  table_affected: string
  record_id: number
  performed_by: string
  old_value: string
  new_value: string
  ip_address: string
  action_timestamp: string
}

const actionColor: Record<string, string> = {
  INSERT: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  LOGIN: 'bg-purple-100 text-purple-700',
  LOGOUT: 'bg-gray-100 text-gray-600',
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [user, setUser] = useState({ username: '', role: '' })
  const [filters, setFilters] = useState({ table: '', action: '' })
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)

  function load() {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.table) params.set('table', filters.table)
    if (filters.action) params.set('action', filters.action)
    fetch(`/api/audit?${params.toString()}`).then(r => r.json()).then(d => {
      if (Array.isArray(d)) setLogs(d)
      setLoading(false)
    })
  }

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.username) setUser(d) })
  }, [])

  useEffect(() => {
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  if (user.role && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar username={user.username} role={user.role} />
        <div className="p-6 text-center text-red-500">Access denied. Audit log is admin only.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar username={user.username} role={user.role} />

      <div className="max-w-7xl mx-auto p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">System Audit Log</h2>

        <div className="bg-white rounded shadow p-4 mb-4">
          <div className="flex gap-3">
            <select
              value={filters.table}
              onChange={e => setFilters(prev => ({ ...prev, table: e.target.value }))}
              className="border rounded px-3 py-1.5 text-sm"
            >
              <option value="">All Tables</option>
              <option value="EmergencyReports">EmergencyReports</option>
              <option value="ResourceAllocations">ResourceAllocations</option>
              <option value="FinanceTransactions">FinanceTransactions</option>
              <option value="TeamAssignments">TeamAssignments</option>
              <option value="Patients">Patients</option>
              <option value="ApprovalRequests">ApprovalRequests</option>
              <option value="Users">Users</option>
            </select>
            <select
              value={filters.action}
              onChange={e => setFilters(prev => ({ ...prev, action: e.target.value }))}
              className="border rounded px-3 py-1.5 text-sm"
            >
              <option value="">All Actions</option>
              <option value="INSERT">INSERT</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="LOGIN">LOGIN</option>
              <option value="LOGOUT">LOGOUT</option>
            </select>
            <button
              onClick={() => setFilters({ table: '', action: '' })}
              className="text-sm text-gray-500 hover:text-gray-700 px-2"
            >
              Clear
            </button>
            <span className="text-sm text-gray-400 self-center ml-auto">
              Showing {logs.length} entries (max 200)
            </span>
          </div>
        </div>

        <div className="bg-white rounded shadow overflow-hidden">
          {loading ? (
            <p className="p-6 text-center text-gray-400">Loading audit log...</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600">Log ID</th>
                  <th className="px-4 py-3 text-left text-gray-600">Action</th>
                  <th className="px-4 py-3 text-left text-gray-600">Table</th>
                  <th className="px-4 py-3 text-left text-gray-600">Record</th>
                  <th className="px-4 py-3 text-left text-gray-600">Performed By</th>
                  <th className="px-4 py-3 text-left text-gray-600">IP</th>
                  <th className="px-4 py-3 text-left text-gray-600">Timestamp</th>
                  <th className="px-4 py-3 text-left text-gray-600">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(entry => (
                  <>
                    <tr key={entry.log_id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500">#{entry.log_id}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded ${actionColor[entry.action_type] || 'bg-gray-100 text-gray-600'}`}>
                          {entry.action_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">{entry.table_affected}</td>
                      <td className="px-4 py-3 text-gray-500">{entry.record_id || '—'}</td>
                      <td className="px-4 py-3 font-medium">{entry.performed_by}</td>
                      <td className="px-4 py-3 text-gray-400">{entry.ip_address || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(entry.action_timestamp).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {(entry.old_value || entry.new_value) && (
                          <button
                            onClick={() => setExpanded(expanded === entry.log_id ? null : entry.log_id)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            {expanded === entry.log_id ? 'Hide' : 'Show'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expanded === entry.log_id && (
                      <tr key={`${entry.log_id}-expanded`} className="bg-gray-50">
                        <td colSpan={8} className="px-4 py-3">
                          <div className="grid grid-cols-2 gap-4">
                            {entry.old_value && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Before</p>
                                <pre className="text-xs bg-red-50 border border-red-100 rounded p-2 overflow-auto max-h-40">
                                  {JSON.stringify(JSON.parse(entry.old_value), null, 2)}
                                </pre>
                              </div>
                            )}
                            {entry.new_value && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">After</p>
                                <pre className="text-xs bg-green-50 border border-green-100 rounded p-2 overflow-auto max-h-40">
                                  {JSON.stringify(JSON.parse(entry.new_value), null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-400">No audit entries found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
