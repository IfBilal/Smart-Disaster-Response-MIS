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
}

const severityStyle: Record<string, { bg: string; color: string }> = {
  critical: { bg: '#fee2e2', color: '#991b1b' },
  high:     { bg: '#ffedd5', color: '#9a3412' },
  medium:   { bg: '#fef9c3', color: '#854d0e' },
  low:      { bg: '#dcfce7', color: '#166534' },
}

const statusStyle: Record<string, { bg: string; color: string }> = {
  pending:     { bg: '#f1f5f9', color: '#475569' },
  in_progress: { bg: '#dbeafe', color: '#1e40af' },
  resolved:    { bg: '#dcfce7', color: '#166534' },
  closed:      { bg: '#e5e7eb', color: '#6b7280' },
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [user, setUser] = useState({ username: '', role: '' })
  const [filters, setFilters] = useState({ status: '', severity: '', disaster_type: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.username) setUser(d) })
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.severity) params.set('severity', filters.severity)
    if (filters.disaster_type) params.set('disaster_type', filters.disaster_type)
    fetch(`/api/reports?${params.toString()}`).then(r => r.json()).then(d => {
      if (Array.isArray(d)) setReports(d)
      setLoading(false)
    })
  }, [filters])

  const sel = (field: string, value: string) => setFilters(prev => ({ ...prev, [field]: value }))

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
      <Navbar username={user.username} role={user.role} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Emergency Reports</h2>
          <Link href="/reports/new" style={{ backgroundColor: '#dc2626', color: '#ffffff', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}>
            + New Report
          </Link>
        </div>

        {/* Filters */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '16px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Filter:</span>
          {[
            { field: 'status', label: 'Status', options: [['', 'All Statuses'], ['pending', 'Pending'], ['in_progress', 'In Progress'], ['resolved', 'Resolved'], ['closed', 'Closed']] },
            { field: 'severity', label: 'Severity', options: [['', 'All Severities'], ['critical', 'Critical'], ['high', 'High'], ['medium', 'Medium'], ['low', 'Low']] },
            { field: 'disaster_type', label: 'Type', options: [['', 'All Types'], ['flood', 'Flood'], ['earthquake', 'Earthquake'], ['fire', 'Fire'], ['other', 'Other']] },
          ].map(f => (
            <select key={f.field} value={filters[f.field as keyof typeof filters]} onChange={e => sel(f.field, e.target.value)}
              style={{ border: '1.5px solid #d1d5db', borderRadius: '6px', padding: '7px 12px', fontSize: '13px', color: '#111827', backgroundColor: '#ffffff', cursor: 'pointer' }}>
              {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
          <button onClick={() => setFilters({ status: '', severity: '', disaster_type: '' })}
            style={{ fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: '7px 8px' }}>
            Clear
          </button>
        </div>

        {/* Table */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          {loading ? (
            <p style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Loading...</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  {['ID', 'Type', 'Severity', 'Location', 'Status', 'Reporter', 'Date', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.report_id} style={{ borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}>
                    <td style={{ padding: '14px 16px', color: '#64748b', fontWeight: '500' }}>#{r.report_id}</td>
                    <td style={{ padding: '14px 16px', color: '#0f172a', fontWeight: '500', textTransform: 'capitalize' }}>{r.disaster_type}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ ...severityStyle[r.severity_level], padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                        {r.severity_level}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#374151', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.location}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ ...statusStyle[r.status], padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#374151' }}>{r.citizen_name}</td>
                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '13px' }}>{new Date(r.reported_at).toLocaleDateString()}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <Link href={`/reports/${r.report_id}`} style={{ color: '#2563eb', fontWeight: '500', textDecoration: 'none', fontSize: '13px' }}>View →</Link>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>No reports found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
