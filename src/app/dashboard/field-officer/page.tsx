'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

interface Hospital {
  hospital_id: number
  name: string
  location: string
  available_beds: number
  total_beds: number
  occupancy_pct: number
}

interface Report {
  report_id: number
  disaster_type: string
  severity_level: string
  location: string
  status: string
}

const sevBadge: Record<string, { bg: string; color: string; border: string }> = {
  critical: { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', border: 'rgba(239,68,68,0.3)'  },
  high:     { bg: 'rgba(249,115,22,0.12)', color: '#fb923c', border: 'rgba(249,115,22,0.3)' },
  medium:   { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
  low:      { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.3)' },
}

export default function FieldOfficerDashboard() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [user, setUser] = useState({ username: '', role: 'field_officer' })

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.username) setUser(d) })

    fetch('/api/hospitals').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setHospitals(d)
    })

    fetch('/api/reports?status=in_progress').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setReports(d.slice(0, 8))
    })
  }, [])

  const totalBeds = hospitals.reduce((s, h) => s + h.available_beds, 0)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#070d1c' }}>
      <Navbar username={user.username} role={user.role} />
      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', minWidth: 0 }}>

        {/* Header */}
        <div className="enter" style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
            Field Operations
          </h1>
          <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>
            Active incidents · hospital capacity at a glance
          </p>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          <div
            className="enter-1"
            style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderTop: '2px solid #3b82f6', borderRadius: '12px', padding: '18px 20px', transition: 'transform 0.2s, box-shadow 0.2s', textDecoration: 'none', display: 'block', cursor: 'pointer' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.35)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
          >
            <p style={{ color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>ACTIVE INCIDENTS</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#f1f5f9', margin: 0, letterSpacing: '-0.02em' }}>{reports.length}</p>
          </div>

          <div
            className="enter-2"
            style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderTop: '2px solid #10b981', borderRadius: '12px', padding: '18px 20px', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.35)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
          >
            <p style={{ color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>AVAILABLE BEDS</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#f1f5f9', margin: 0, letterSpacing: '-0.02em' }}>{totalBeds}</p>
          </div>

          <div
            className="enter-3"
            style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderTop: '2px solid #f59e0b', borderRadius: '12px', padding: '18px 20px', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.35)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
          >
            <p style={{ color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>REQUEST RESOURCES</p>
            <Link href="/resources" style={{ fontSize: '20px', fontWeight: '700', color: '#fbbf24', margin: 0, textDecoration: 'none', display: 'block' }}>→</Link>
          </div>

          <div
            className="enter-4"
            style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderTop: '2px solid #8b5cf6', borderRadius: '12px', padding: '18px 20px', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.35)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
          >
            <p style={{ color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>MY REQUESTS</p>
            <Link href="/approvals" style={{ fontSize: '20px', fontWeight: '700', color: '#a78bfa', margin: 0, textDecoration: 'none', display: 'block' }}>→</Link>
          </div>
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

          {/* Active Incidents */}
          <div className="enter-5" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6', boxShadow: '0 0 6px #3b82f6' }} />
              <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9', margin: 0 }}>Active Incidents</h2>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Incident</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Location</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Severity</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => {
                  const sev = sevBadge[r.severity_level] || sevBadge.low
                  return (
                    <tr
                      key={r.report_id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.025)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '12px 12px' }}>
                        <Link href={`/reports/${r.report_id}`} style={{ color: '#60a5fa', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
                          #{r.report_id}
                        </Link>
                        <p style={{ color: '#94a3b8', fontSize: '12px', margin: '2px 0 0' }}>{r.disaster_type}</p>
                      </td>
                      <td style={{ padding: '12px 12px', color: '#cbd5e1', fontSize: '13px' }}>{r.location}</td>
                      <td style={{ padding: '12px 12px' }}>
                        <span style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.border}`, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                          {r.severity_level}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {reports.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569' }}>
                <p style={{ fontSize: '13px', margin: 0 }}>No active incidents</p>
              </div>
            )}
          </div>

          {/* Hospital Capacity */}
          <div className="enter-6" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9', margin: 0 }}>Hospital Capacity</h2>
              <Link href="/hospitals" style={{ color: '#3b82f6', fontSize: '12px', textDecoration: 'none', fontWeight: '500' }}>View all →</Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto' }}>
              {hospitals.slice(0, 5).map(h => {
                const isFull = h.available_beds === 0
                const pct = Math.min(h.occupancy_pct, 100)
                const barColor = pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#10b981'
                return (
                  <div
                    key={h.hospital_id}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px 16px', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59,130,246,0.25)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#f1f5f9', margin: 0 }}>{h.name}</p>
                      <span style={{
                        background: isFull ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                        color: isFull ? '#f87171' : '#34d399',
                        border: `1px solid ${isFull ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                        padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600'
                      }}>
                        {h.available_beds}/{h.total_beds} beds
                      </span>
                    </div>
                    <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 8px' }}>{h.location}</p>
                    <div style={{ height: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: '4px', background: barColor, width: `${pct}%`, transition: 'width 0.4s ease' }} />
                    </div>
                    <p style={{ color: '#475569', fontSize: '11px', margin: '4px 0 0', textAlign: 'right' }}>{pct.toFixed(0)}% occupied</p>
                  </div>
                )
              })}
              {hospitals.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569' }}>
                  <p style={{ fontSize: '13px', margin: 0 }}>No hospital data</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="enter-7" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 14px' }}>Quick Actions</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/hospitals" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 14px rgba(59,130,246,0.3)', textDecoration: 'none', transition: 'all 0.2s' }}>
              Admit Patient
            </Link>
            <Link href="/resources" style={{ background: 'linear-gradient(135deg, #10b981, #047857)', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.3)', textDecoration: 'none', transition: 'all 0.2s' }}>
              Request Resources
            </Link>
            <Link href="/reports" style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none', transition: 'all 0.2s' }}>
              View All Reports
            </Link>
          </div>
        </div>

      </main>
    </div>
  )
}
