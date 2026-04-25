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

const sevBadge: Record<string, { bg: string; color: string; border: string }> = {
  critical: { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', border: 'rgba(239,68,68,0.3)'  },
  high:     { bg: 'rgba(249,115,22,0.12)', color: '#fb923c', border: 'rgba(249,115,22,0.3)' },
  medium:   { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
  low:      { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.3)' },
}

const statusBadge: Record<string, { bg: string; color: string; border: string }> = {
  pending:     { bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24', border: 'rgba(245,158,11,0.3)'  },
  in_progress: { bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa', border: 'rgba(59,130,246,0.3)'  },
  resolved:    { bg: 'rgba(16,185,129,0.12)',  color: '#34d399', border: 'rgba(16,185,129,0.3)'  },
  closed:      { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)' },
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
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#070d1c' }}>
      <Navbar username={user.username} role={user.role} />

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', minWidth: 0 }}>
        {/* Header */}
        <div className="enter" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', letterSpacing: '-0.02em', margin: '0 0 4px' }}>Emergency Reports</h1>
            <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>Live feed of all incoming disaster reports</p>
          </div>
          <Link href="/reports/new" style={{
            background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
            color: '#fff',
            border: 'none',
            padding: '9px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(239,68,68,0.3)',
            display: 'inline-block',
          }}>
            + New Report
          </Link>
        </div>

        {/* Filters */}
        <div className="enter-1" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Filter</span>
          {[
            { field: 'status', options: [['', 'All Statuses'], ['pending', 'Pending'], ['in_progress', 'In Progress'], ['resolved', 'Resolved'], ['closed', 'Closed']] },
            { field: 'severity', options: [['', 'All Severities'], ['critical', 'Critical'], ['high', 'High'], ['medium', 'Medium'], ['low', 'Low']] },
            { field: 'disaster_type', options: [['', 'All Types'], ['flood', 'Flood'], ['earthquake', 'Earthquake'], ['fire', 'Fire'], ['other', 'Other']] },
          ].map(f => (
            <select key={f.field} value={filters[f.field as keyof typeof filters]} onChange={e => sel(f.field, e.target.value)}>
              {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
          <button onClick={() => setFilters({ status: '', severity: '', disaster_type: '' })}
            style={{ fontSize: '12px', color: '#475569', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px' }}>
            Clear
          </button>
        </div>

        {/* Table */}
        <div className="enter-2" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden' }}>
          {loading ? (
            <p style={{ padding: '48px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>Loading reports...</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['ID', 'Type', 'Severity', 'Location', 'Status', 'Reporter', 'Date', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map(r => {
                  const sev = sevBadge[r.severity_level] || sevBadge.low
                  const st = statusBadge[r.status] || statusBadge.closed
                  return (
                    <tr key={r.report_id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.025)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <td style={{ padding: '12px 16px', color: '#475569', fontSize: '13px', fontWeight: '500' }}>#{r.report_id}</td>
                      <td style={{ padding: '12px 16px', color: '#cbd5e1', fontSize: '13px', fontWeight: '500', textTransform: 'capitalize' }}>{r.disaster_type}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ backgroundColor: sev.bg, color: sev.color, border: `1px solid ${sev.border}`, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                          {r.severity_level}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.location}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ backgroundColor: st.bg, color: st.color, border: `1px solid ${st.border}`, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                          {r.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#cbd5e1', fontSize: '13px' }}>{r.citizen_name}</td>
                      <td style={{ padding: '12px 16px', color: '#475569', fontSize: '12px' }}>{new Date(r.reported_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <Link href={`/reports/${r.report_id}`} style={{ color: '#60a5fa', fontWeight: '600', textDecoration: 'none', fontSize: '12px' }}>View →</Link>
                      </td>
                    </tr>
                  )
                })}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>No reports found</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
