'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { fmtTime } from '@/lib/fmt'

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

const actionBadge: Record<string, { bg: string; color: string }> = {
  INSERT:  { bg: 'rgba(16,185,129,0.12)',  color: '#34d399' },
  UPDATE:  { bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa' },
  DELETE:  { bg: 'rgba(239,68,68,0.12)',   color: '#f87171' },
  LOGIN:   { bg: 'rgba(139,92,246,0.12)',  color: '#a78bfa' },
  LOGOUT:  { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8' },
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [audit, setAudit] = useState<AuditEntry[]>([])
  const [user, setUser] = useState({ username: '', role: 'admin' })

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.username) setUser(d) })

    fetch('/api/analytics/incidents').then(r => r.json()).then(data => {
      const total = data.byType?.reduce((s: number, x: { total: number }) => s + x.total, 0) || 0
      setStats(prev => ({ ...(prev as Stats), totalReports: total }))
    })
    fetch('/api/analytics/financial').then(r => r.json()).then(data => {
      setStats(prev => ({ ...(prev as Stats), totalDonations: data.summary?.total_donations || 0, netBalance: data.summary?.net_balance || 0 }))
    })
    fetch('/api/teams').then(r => r.json()).then(data => {
      const active = Array.isArray(data) ? data.filter((t: { availability_status: string }) => t.availability_status === 'assigned').length : 0
      setStats(prev => ({ ...(prev as Stats), activeTeams: active }))
    })
    fetch('/api/resources/inventory?low_stock=true').then(r => r.json()).then(data => {
      setStats(prev => ({ ...(prev as Stats), lowStock: Array.isArray(data) ? data.length : 0 }))
    })
    fetch('/api/approvals').then(r => r.json()).then(data => {
      setStats(prev => ({ ...(prev as Stats), pendingApprovals: Array.isArray(data) ? data.length : 0 }))
    })
    fetch('/api/audit').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setAudit(data.slice(0, 8))
    })
  }, [])

  const cards = [
    { label: 'Total Reports',     value: stats?.totalReports ?? '—',                                                                    accent: '#ef4444', icon: '🚨', note: 'All time' },
    { label: 'Active Teams',      value: stats?.activeTeams  ?? '—',                                                                    accent: '#3b82f6', icon: '👥', note: 'Deployed' },
    { label: 'Low Stock Alerts',  value: stats?.lowStock     ?? '—',                                                                    accent: '#f59e0b', icon: '⚠️', note: 'Below threshold' },
    { label: 'Pending Approvals', value: stats?.pendingApprovals ?? '—',                                                                accent: '#f97316', icon: '⏳', note: 'Action required' },
    { label: 'Total Donations',   value: stats?.totalDonations ? `PKR ${(stats.totalDonations as number).toLocaleString()}` : '—',      accent: '#10b981', icon: '💰', note: 'Received' },
    { label: 'Net Balance',       value: stats?.netBalance     ? `PKR ${(stats.netBalance as number).toLocaleString()}`     : '—',      accent: '#8b5cf6', icon: '📊', note: 'Donations − Expenses' },
  ]

  const quickLinks = [
    { label: '+ New Report',    href: '/reports/new', accent: '#ef4444' },
    { label: 'Manage Teams',    href: '/teams',        accent: '#3b82f6' },
    { label: 'Approvals Queue', href: '/approvals',    accent: '#f97316' },
    { label: 'Inventory',       href: '/resources',    accent: '#f59e0b' },
    { label: 'Financial',       href: '/financial',    accent: '#10b981' },
    { label: 'Audit Log',       href: '/audit',        accent: '#8b5cf6' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#070d1c' }}>
      <Navbar username={user.username} role={user.role} />
      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', minWidth: 0 }}>

        {/* Header */}
        <div className="enter" style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
            Admin Dashboard
          </h1>
          <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>
            System overview — Emergency Management Information System
          </p>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          {cards.map((c, i) => (
            <div
              key={c.label}
              className={`enter-${i + 1}`}
              style={{
                background: '#0c1829', borderRadius: '12px', padding: '18px 20px',
                border: '1px solid rgba(255,255,255,0.07)',
                borderTop: `2px solid ${c.accent}`,
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.35)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';   (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>{c.label}</p>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: '#f1f5f9', margin: '0 0 4px', letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.value}</p>
                  <p style={{ fontSize: '11px', color: '#475569', margin: 0 }}>{c.note}</p>
                </div>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0, marginLeft: '12px',
                  background: `${c.accent}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                }}>{c.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Lower grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '16px' }}>

          {/* Quick Actions */}
          <div className="enter-7" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px' }}>
            <p style={{ fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>Quick Actions</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {quickLinks.map(l => (
                <Link key={l.href} href={l.href} style={{
                  display: 'block', padding: '10px 12px', borderRadius: '9px',
                  background: `${l.accent}0f`, border: `1px solid ${l.accent}28`,
                  color: l.accent, fontSize: '12px', fontWeight: '600',
                  textDecoration: 'none', textAlign: 'center', transition: 'all 0.18s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${l.accent}20`; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${l.accent}0f`; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="enter-8" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Recent Activity</p>
              <Link href="/audit" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}>View all →</Link>
            </div>
            {audit.length === 0 ? (
              <p style={{ color: '#334155', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No activity yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {audit.map(a => {
                  const b = actionBadge[a.action_type] || { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8' }
                  return (
                    <div key={a.log_id} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.04em', flexShrink: 0, background: b.bg, color: b.color }}>
                        {a.action_type}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: '#cbd5e1', fontSize: '12px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: '600' }}>{a.performed_by}</span>
                          <span style={{ color: '#475569' }}> · {a.table_affected}</span>
                        </p>
                      </div>
                      <p style={{ color: '#334155', fontSize: '11px', margin: 0, flexShrink: 0 }}>
                        {fmtTime(a.action_timestamp)}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
