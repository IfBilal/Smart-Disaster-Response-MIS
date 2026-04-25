'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'

interface Approval {
  approval_id: number
  request_type: string
  reference_id: number
  status: string
  requested_at: string
  remarks: string
  requested_by_name: string
  requested_by_role: string
  reviewed_by_name: string
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [user, setUser] = useState({ username: '', role: '' })
  const [remarks, setRemarks] = useState<Record<number, string>>({})
  const [processing, setProcessing] = useState<number | null>(null)

  function load() {
    fetch('/api/approvals').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setApprovals(d)
    })
  }

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.username) setUser(d) })
    load()
  }, [])

  async function review(approvalId: number, decision: 'approved' | 'rejected') {
    if (!confirm(`${decision === 'approved' ? 'Approve' : 'Reject'} this request?`)) return
    setProcessing(approvalId)
    const res = await fetch(`/api/approvals/${approvalId}/review`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: decision, remarks: remarks[approvalId] || '' }),
    })
    setProcessing(null)
    if (res.ok) {
      load()
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to process request')
    }
  }

  const canReview = user.role === 'admin' || user.role === 'warehouse_manager' || user.role === 'finance_officer'

  const typeBadgeStyle = (type: string): React.CSSProperties => {
    const map: Record<string, { bg: string; color: string; border: string }> = {
      resource_allocation: { bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
      financial:           { bg: 'rgba(16,185,129,0.12)',  color: '#34d399', border: 'rgba(16,185,129,0.3)' },
      deployment:          { bg: 'rgba(139,92,246,0.12)',  color: '#a78bfa', border: 'rgba(139,92,246,0.3)' },
    }
    const s = map[type] || { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)' }
    return {
      backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`,
      padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', display: 'inline-block',
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#070d1c' }}>
      <Navbar username={user.username} role={user.role} />

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', minWidth: 0 }}>
        <div className="enter" style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
            Approvals Queue
          </h1>
          <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>
            Review and process pending approval requests
          </p>
        </div>

        {approvals.length === 0 ? (
          <div className="enter-1" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '60px 20px', textAlign: 'center' }}>
            <p style={{ color: '#475569', fontSize: '14px', margin: 0 }}>No pending approval requests</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {approvals.map((a, idx) => (
              <div key={a.approval_id} className={`enter-${Math.min(idx + 1, 8)}`} style={{
                background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={{ color: '#60a5fa', fontSize: '13px', fontWeight: '700' }}>#{a.approval_id}</span>
                      <span style={typeBadgeStyle(a.request_type)}>
                        {a.request_type.replace('_', ' ')}
                      </span>
                      <span style={{
                        backgroundColor: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)',
                        padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', display: 'inline-block',
                      }}>
                        {a.status}
                      </span>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 4px' }}>
                      Requested by:{' '}
                      <strong style={{ color: '#cbd5e1' }}>{a.requested_by_name}</strong>
                      {' '}
                      <span style={{ color: '#64748b' }}>({a.requested_by_role.replace('_', ' ')})</span>
                    </p>
                    <p style={{ color: '#475569', fontSize: '12px', margin: '0 0 4px' }}>
                      {new Date(a.requested_at).toLocaleString()}
                    </p>
                    {a.reference_id && (
                      <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 4px' }}>
                        Reference ID: <span style={{ color: '#94a3b8' }}>#{a.reference_id}</span>
                      </p>
                    )}
                    {a.remarks && (
                      <p style={{ color: '#64748b', fontSize: '12px', margin: '0', fontStyle: 'italic' }}>{a.remarks}</p>
                    )}
                  </div>
                </div>

                {canReview && a.status === 'pending' && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Remarks (optional)"
                      value={remarks[a.approval_id] || ''}
                      onChange={e => setRemarks(prev => ({ ...prev, [a.approval_id]: e.target.value }))}
                      style={{ flex: 1 }}
                    />
                    <button
                      onClick={() => review(a.approval_id, 'approved')}
                      disabled={processing === a.approval_id}
                      style={{
                        background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                        color: '#fff', border: 'none', padding: '7px 16px', borderRadius: '7px',
                        fontSize: '12px', fontWeight: '600', cursor: processing === a.approval_id ? 'not-allowed' : 'pointer',
                        opacity: processing === a.approval_id ? 0.6 : 1, whiteSpace: 'nowrap',
                      }}
                    >
                      {processing === a.approval_id ? 'Processing…' : 'Approve'}
                    </button>
                    <button
                      onClick={() => review(a.approval_id, 'rejected')}
                      disabled={processing === a.approval_id}
                      style={{
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                        color: '#f87171', padding: '7px 16px', borderRadius: '7px',
                        fontSize: '12px', fontWeight: '600', cursor: processing === a.approval_id ? 'not-allowed' : 'pointer',
                        opacity: processing === a.approval_id ? 0.6 : 1, whiteSpace: 'nowrap',
                      }}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
