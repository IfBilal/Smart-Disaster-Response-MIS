'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { fmtDateTime } from '@/lib/fmt'

interface Notification {
  notification_id: number
  message: string
  notification_type: string
  is_read: boolean
  sent_at: string
}

const typeBadge: Record<string, { bg: string; color: string; border: string }> = {
  alert:      { bg: 'rgba(239,68,68,0.12)',   color: '#f87171', border: 'rgba(239,68,68,0.3)'   },
  assignment: { bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa', border: 'rgba(59,130,246,0.3)'  },
  approval:   { bg: 'rgba(16,185,129,0.12)',  color: '#34d399', border: 'rgba(16,185,129,0.3)'  },
  system:     { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)' },
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [user, setUser] = useState({ username: '', role: '' })
  const [loading, setLoading] = useState(true)

  function load() {
    fetch('/api/notifications').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setNotifications(d)
      setLoading(false)
    })
  }

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.username) setUser(d) })
    load()
  }, [])

  async function markRead(id?: number) {
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notification_id: id ?? null }),
    })
    load()
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#070d1c' }}>
        <Navbar username={user.username} role={user.role} />
        <main style={{ marginLeft: '220px', flex: 1, padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#475569', fontSize: '14px' }}>Loading notifications...</p>
        </main>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#070d1c' }}>
      <Navbar username={user.username} role={user.role} />

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', minWidth: 0 }}>
        <div className="enter" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{ marginLeft: '10px', background: '#ef4444', color: '#fff', fontSize: '12px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px' }}>
                  {unreadCount}
                </span>
              )}
            </h1>
            <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>
              System alerts, assignments, and approvals
            </p>
          </div>
          {unreadCount > 0 && (
            <button onClick={() => markRead()}
              style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              Mark all read
            </button>
          )}
        </div>

        <div className="enter-1" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden' }}>
          {notifications.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <p style={{ color: '#334155', fontSize: '14px', margin: 0 }}>No notifications</p>
            </div>
          ) : (
            notifications.map((n, i) => {
              const tb = typeBadge[n.notification_type] || typeBadge.system
              return (
                <div key={n.notification_id}
                  style={{
                    padding: '16px 20px',
                    borderBottom: i < notifications.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    background: n.is_read ? 'transparent' : 'rgba(59,130,246,0.04)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '16px',
                  }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ backgroundColor: tb.bg, color: tb.color, border: `1px solid ${tb.border}`, padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase' }}>
                        {n.notification_type}
                      </span>
                      {!n.is_read && (
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
                      )}
                    </div>
                    <p style={{ color: n.is_read ? '#64748b' : '#cbd5e1', fontSize: '13px', margin: '0 0 4px', lineHeight: '1.5' }}>{n.message}</p>
                    <p style={{ color: '#334155', fontSize: '11px', margin: 0 }}>{fmtDateTime(n.sent_at)}</p>
                  </div>
                  {!n.is_read && (
                    <button onClick={() => markRead(n.notification_id)}
                      style={{ background: 'none', border: 'none', color: '#475569', fontSize: '11px', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      Mark read
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}
