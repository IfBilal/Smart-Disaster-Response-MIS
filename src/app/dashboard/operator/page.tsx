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
  available:   { bg: 'rgba(16,185,129,0.12)',  color: '#34d399', border: 'rgba(16,185,129,0.3)'  },
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
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#070d1c' }}>
      <Navbar username={user.username} role={user.role} />
      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', minWidth: 0 }}>

        {/* Header */}
        <div className="enter" style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
              Emergency Operations Center
            </h1>
            <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>
              Live incident feed · auto-refreshes every 30 seconds
            </p>
          </div>
          <Link
            href="/reports/new"
            style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 14px rgba(239,68,68,0.3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span style={{ fontSize: '16px', lineHeight: 1 }}>＋</span> New Report
          </Link>
        </div>

        {/* Stat row */}
        <div className="enter-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
          <div
            style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderTop: '2px solid #ef4444', borderRadius: '12px', padding: '18px 20px', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.35)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
          >
            <p style={{ color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>PENDING REPORTS</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#f1f5f9', margin: 0, letterSpacing: '-0.02em' }}>{reports.length}</p>
          </div>
          <div
            style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderTop: '2px solid #10b981', borderRadius: '12px', padding: '18px 20px', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.35)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
          >
            <p style={{ color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>AVAILABLE TEAMS</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#f1f5f9', margin: 0, letterSpacing: '-0.02em' }}>{teams.length}</p>
          </div>
          <div
            style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderTop: '2px solid #f97316', borderRadius: '12px', padding: '18px 20px', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.35)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
          >
            <p style={{ color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>CRITICAL / HIGH</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#f1f5f9', margin: 0, letterSpacing: '-0.02em' }}>
              {reports.filter(r => r.severity_level === 'critical' || r.severity_level === 'high').length}
            </p>
          </div>
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', alignItems: 'start' }}>

          {/* Pending Reports */}
          <div className="enter-2" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444', boxShadow: '0 0 6px #ef4444', animation: 'pulse 2s infinite' }} />
                <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9', margin: 0 }}>Pending Reports</h2>
                <span style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>{reports.length}</span>
              </div>
              <Link href="/reports" style={{ color: '#3b82f6', fontSize: '12px', textDecoration: 'none', fontWeight: '500' }}>View all →</Link>
            </div>

            <div style={{ overflowY: 'auto', maxHeight: '520px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ID / Type</th>
                    <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Location</th>
                    <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Severity</th>
                    <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Assign</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(r => {
                    const sev = sevBadge[r.severity_level] || sevBadge.low
                    const st = statusBadge[r.status] || statusBadge.pending
                    return (
                      <tr
                        key={r.report_id}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.025)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <Link href={`/reports/${r.report_id}`} style={{ color: '#60a5fa', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
                            #{r.report_id}
                          </Link>
                          <p style={{ color: '#94a3b8', fontSize: '12px', margin: '2px 0 0' }}>{r.disaster_type}</p>
                          <p style={{ color: '#475569', fontSize: '11px', margin: '1px 0 0' }}>by {r.citizen_name}</p>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#cbd5e1', fontSize: '13px' }}>{r.location}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.border}`, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                            {r.severity_level}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                            {r.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {teams.slice(0, 3).map(t => (
                              <button
                                key={t.team_id}
                                onClick={() => assignTeam(t.team_id, r.report_id)}
                                style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.22)' }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.12)' }}
                              >
                                {t.team_name}
                              </button>
                            ))}
                            {teams.length === 0 && <span style={{ color: '#475569', fontSize: '12px' }}>No teams</span>}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {reports.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#475569' }}>
                  <p style={{ fontSize: '32px', margin: '0 0 8px' }}>✓</p>
                  <p style={{ fontSize: '13px', margin: 0 }}>No pending reports</p>
                </div>
              )}
            </div>
          </div>

          {/* Available Teams */}
          <div className="enter-3" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9', margin: 0 }}>Available Teams</h2>
                <span style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>{teams.length}</span>
              </div>
              <Link href="/teams" style={{ color: '#3b82f6', fontSize: '12px', textDecoration: 'none', fontWeight: '500' }}>All →</Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '520px', overflowY: 'auto' }}>
              {teams.map(t => (
                <div
                  key={t.team_id}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px 16px', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(16,185,129,0.25)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#f1f5f9', margin: 0 }}>{t.team_name}</p>
                    <span style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                      Available
                    </span>
                  </div>
                  <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 2px' }}>{t.team_type} · {t.current_members} members</p>
                  <p style={{ color: '#475569', fontSize: '11px', margin: 0 }}>{t.current_location || 'Location unknown'}</p>
                </div>
              ))}
              {teams.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569' }}>
                  <p style={{ fontSize: '13px', margin: 0 }}>No available teams</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="enter-4" style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 5px #10b981' }} />
          <span style={{ color: '#475569', fontSize: '12px' }}>Live · auto-refreshes every 30 seconds</span>
        </div>

      </main>
    </div>
  )
}
