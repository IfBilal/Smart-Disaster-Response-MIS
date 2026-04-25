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
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.username) setUser(d) })

    fetch('/api/analytics/incidents').then(r => r.json()).then(data => {
      const total = data.byType?.reduce((s: number, x: { count: number }) => s + x.count, 0) || 0
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

  const statCards = [
    { label: 'Total Reports', value: stats?.totalReports ?? '—', bg: '#dbeafe', border: '#93c5fd', text: '#1e40af' },
    { label: 'Active Teams', value: stats?.activeTeams ?? '—', bg: '#dcfce7', border: '#86efac', text: '#166534' },
    { label: 'Low Stock Alerts', value: stats?.lowStock ?? '—', bg: '#fef9c3', border: '#fde047', text: '#854d0e' },
    { label: 'Pending Approvals', value: stats?.pendingApprovals ?? '—', bg: '#fee2e2', border: '#fca5a5', text: '#991b1b' },
    { label: 'Total Donations (PKR)', value: stats?.totalDonations ? stats.totalDonations.toLocaleString() : '—', bg: '#f3e8ff', border: '#d8b4fe', text: '#6b21a8' },
    { label: 'Net Balance (PKR)', value: stats?.netBalance ? stats.netBalance.toLocaleString() : '—', bg: '#ccfbf1', border: '#5eead4', text: '#134e4a' },
  ]

  const quickLinks = [
    { label: 'View Reports', href: '/reports', bg: '#eff6ff', color: '#1d4ed8' },
    { label: 'Manage Teams', href: '/teams', bg: '#f0fdf4', color: '#166534' },
    { label: 'Approvals Queue', href: '/approvals', bg: '#fff1f2', color: '#9f1239' },
    { label: 'Inventory', href: '/resources', bg: '#fefce8', color: '#854d0e' },
    { label: 'Financial', href: '/financial', bg: '#faf5ff', color: '#6b21a8' },
    { label: 'Audit Log', href: '/audit', bg: '#f9fafb', color: '#374151' },
  ]

  const actionColors: Record<string, string> = { INSERT: '#16a34a', UPDATE: '#2563eb', DELETE: '#dc2626', LOGIN: '#7c3aed', LOGOUT: '#6b7280' }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
      <Navbar username={user.username} role={user.role} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', marginBottom: '24px' }}>Admin Dashboard</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {statCards.map(c => (
            <div key={c.label} style={{ backgroundColor: c.bg, border: `1px solid ${c.border}`, borderRadius: '10px', padding: '20px' }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: c.text, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</p>
              <p style={{ fontSize: '26px', fontWeight: '700', color: c.text, margin: 0 }}>{c.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', marginTop: 0, marginBottom: '16px' }}>Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {quickLinks.map(l => (
                <Link key={l.href} href={l.href} style={{ backgroundColor: l.bg, color: l.color, border: '1px solid currentColor', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', fontWeight: '500', textDecoration: 'none', display: 'block', textAlign: 'center', opacity: 0.9 }}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', marginTop: 0, marginBottom: '12px' }}>Recent Activity</h3>
            <div>
              {audit.map(entry => (
                <div key={entry.log_id} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#ffffff', backgroundColor: actionColors[entry.action_type] || '#6b7280', padding: '2px 6px', borderRadius: '4px' }}>{entry.action_type}</span>
                    <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>{entry.performed_by}</span>
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>on</span>
                    <span style={{ fontSize: '13px', color: '#1d4ed8' }}>{entry.table_affected}</span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>{new Date(entry.action_timestamp).toLocaleString()}</p>
                </div>
              ))}
              {audit.length === 0 && <p style={{ fontSize: '13px', color: '#9ca3af' }}>No recent activity</p>}
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: '#1e3a5f', borderRadius: '10px', padding: '20px', color: '#ffffff' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 8px' }}>MIS Analytics</h3>
          <p style={{ fontSize: '13px', color: '#93c5fd', margin: '0 0 12px' }}>View incident trends, resource utilization, and financial reports</p>
          <Link href="/analytics" style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '8px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
            Open Analytics Dashboard →
          </Link>
        </div>
      </div>
    </div>
  )
}
