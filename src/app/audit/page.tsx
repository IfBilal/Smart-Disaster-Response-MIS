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

const actionBadgeStyle = (action: string): React.CSSProperties => {
  const map: Record<string, { bg: string; color: string }> = {
    INSERT: { bg: 'rgba(16,185,129,0.12)',  color: '#34d399' },
    UPDATE: { bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa' },
    DELETE: { bg: 'rgba(239,68,68,0.12)',   color: '#f87171' },
    LOGIN:  { bg: 'rgba(139,92,246,0.12)',  color: '#a78bfa' },
    LOGOUT: { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8' },
  }
  const s = map[action] || { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8' }
  return {
    backgroundColor: s.bg, color: s.color,
    padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', display: 'inline-block',
  }
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

  const selectStyle: React.CSSProperties = {
    background: '#0c1829', border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1',
    padding: '7px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
  }

  const thStyle: React.CSSProperties = {
    textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: '600',
    color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em',
  }
  const tdStyle: React.CSSProperties = { padding: '12px 16px', color: '#cbd5e1', fontSize: '13px' }

  if (user.role && user.role !== 'admin') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#070d1c' }}>
        <Navbar username={user.username} role={user.role} />
        <main style={{ marginLeft: '220px', flex: 1, padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#0c1829', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '32px 40px', textAlign: 'center' }}>
            <p style={{ color: '#f87171', fontSize: '14px', margin: 0, fontWeight: '600' }}>Access Denied</p>
            <p style={{ color: '#475569', fontSize: '13px', margin: '8px 0 0' }}>Audit log is restricted to admins only.</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#070d1c' }}>
      <Navbar username={user.username} role={user.role} />

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', minWidth: 0 }}>
        <div className="enter" style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
            System Audit Log
          </h1>
          <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>
            Full history of system actions, data changes, and authentication events
          </p>
        </div>

        {/* Filters */}
        <div className="enter-1" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={filters.table} onChange={e => setFilters(prev => ({ ...prev, table: e.target.value }))} style={selectStyle}>
            <option value="">All Tables</option>
            <option value="EmergencyReports">EmergencyReports</option>
            <option value="ResourceAllocations">ResourceAllocations</option>
            <option value="FinanceTransactions">FinanceTransactions</option>
            <option value="TeamAssignments">TeamAssignments</option>
            <option value="Patients">Patients</option>
            <option value="ApprovalRequests">ApprovalRequests</option>
            <option value="Users">Users</option>
          </select>
          <select value={filters.action} onChange={e => setFilters(prev => ({ ...prev, action: e.target.value }))} style={selectStyle}>
            <option value="">All Actions</option>
            <option value="INSERT">INSERT</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
          </select>
          <button onClick={() => setFilters({ table: '', action: '' })} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            color: '#64748b', padding: '7px 14px', borderRadius: '8px', fontSize: '13px',
            cursor: 'pointer', transition: 'all 0.18s',
          }}>
            Clear
          </button>
          <span style={{ color: '#475569', fontSize: '12px', marginLeft: 'auto' }}>
            Showing {logs.length} entries (max 200)
          </span>
        </div>

        {/* Table */}
        <div className="enter-2" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden' }}>
          {loading ? (
            <p style={{ padding: '40px 16px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>Loading audit log...</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Log ID', 'Action', 'Table', 'Record', 'Performed By', 'IP', 'Timestamp', 'Details'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(entry => (
                  <>
                    <tr key={entry.log_id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.025)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ ...tdStyle, color: '#475569' }}>#{entry.log_id}</td>
                      <td style={tdStyle}>
                        <span style={actionBadgeStyle(entry.action_type)}>{entry.action_type}</span>
                      </td>
                      <td style={{ ...tdStyle, color: '#94a3b8' }}>{entry.table_affected}</td>
                      <td style={{ ...tdStyle, color: '#64748b' }}>{entry.record_id || '—'}</td>
                      <td style={{ ...tdStyle, color: '#f1f5f9', fontWeight: '500' }}>{entry.performed_by}</td>
                      <td style={{ ...tdStyle, color: '#475569', fontFamily: 'monospace', fontSize: '12px' }}>{entry.ip_address || '—'}</td>
                      <td style={{ ...tdStyle, color: '#64748b', whiteSpace: 'nowrap' }}>{new Date(entry.action_timestamp).toLocaleString()}</td>
                      <td style={tdStyle}>
                        {(entry.old_value || entry.new_value) && (
                          <button
                            onClick={() => setExpanded(expanded === entry.log_id ? null : entry.log_id)}
                            style={{
                              background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                              color: '#60a5fa', padding: '3px 10px', borderRadius: '6px',
                              fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                            }}
                          >
                            {expanded === entry.log_id ? 'Hide' : 'Show'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expanded === entry.log_id && (
                      <tr key={`${entry.log_id}-expanded`} style={{ backgroundColor: 'rgba(12,24,41,0.8)' }}>
                        <td colSpan={8} style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {entry.old_value && (
                              <div>
                                <p style={{ fontSize: '11px', fontWeight: '600', color: '#f87171', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Before</p>
                                <pre style={{
                                  fontSize: '12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                                  borderRadius: '8px', padding: '12px', overflowX: 'auto', maxHeight: '160px',
                                  color: '#fca5a5', fontFamily: 'monospace', margin: 0, lineHeight: '1.5',
                                }}>
                                  {JSON.stringify(JSON.parse(entry.old_value), null, 2)}
                                </pre>
                              </div>
                            )}
                            {entry.new_value && (
                              <div>
                                <p style={{ fontSize: '11px', fontWeight: '600', color: '#34d399', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>After</p>
                                <pre style={{
                                  fontSize: '12px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
                                  borderRadius: '8px', padding: '12px', overflowX: 'auto', maxHeight: '160px',
                                  color: '#6ee7b7', fontFamily: 'monospace', margin: 0, lineHeight: '1.5',
                                }}>
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
                  <tr><td colSpan={8} style={{ padding: '40px 16px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>No audit entries found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
