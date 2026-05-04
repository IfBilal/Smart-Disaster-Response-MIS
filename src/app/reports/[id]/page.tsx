'use client'

import { useEffect, useState, use, useRef } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { fmtDateTime, fmtDate } from '@/lib/fmt'

interface ReportDetail {
  report_id: number
  disaster_type: string
  severity_level: string
  location: string
  latitude: number
  longitude: number
  status: string
  reported_at: string
  resolved_at: string
  citizen_name: string
  citizen_phone: string
  assigned_operator: string
  assignments: {
    assignment_id: number
    team_name: string
    team_type: string
    status: string
    assigned_at: string
  }[]
  allocations: {
    allocation_id: number
    resource_name: string
    qty_requested: number
    qty_dispatched: number
    status: string
  }[]
  budget: {
    total_allocations: number
    total_qty_requested: number
    total_qty_dispatched: number
    total_expenses: number
    total_amount_spent: number
  } | null
}

interface Attachment {
  attachment_id: number
  file_url: string
  media_type: string
  uploaded_at: string
}

const statusBadge: Record<string, { bg: string; color: string; border: string }> = {
  pending:     { bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24', border: 'rgba(245,158,11,0.3)'  },
  in_progress: { bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa', border: 'rgba(59,130,246,0.3)'  },
  resolved:    { bg: 'rgba(16,185,129,0.12)',  color: '#34d399', border: 'rgba(16,185,129,0.3)'  },
  closed:      { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)' },
}

const sevBadge: Record<string, { bg: string; color: string; border: string }> = {
  critical: { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', border: 'rgba(239,68,68,0.3)'  },
  high:     { bg: 'rgba(249,115,22,0.12)', color: '#fb923c', border: 'rgba(249,115,22,0.3)' },
  medium:   { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
  low:      { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.3)' },
}

const teamTypeBadge: Record<string, { bg: string; color: string; border: string }> = {
  medical: { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', border: 'rgba(239,68,68,0.3)'  },
  fire:    { bg: 'rgba(249,115,22,0.12)', color: '#fb923c', border: 'rgba(249,115,22,0.3)' },
  rescue:  { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
}

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [report, setReport] = useState<ReportDetail | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [user, setUser] = useState({ username: '', role: '' })
  const [updating, setUpdating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [assignmentUpdating, setAssignmentUpdating] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function loadAttachments() {
    fetch(`/api/reports/${id}/attachments`).then(r => r.json()).then(d => {
      if (Array.isArray(d)) setAttachments(d)
    })
  }

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.username) setUser(d) })
    fetch(`/api/reports/${id}`).then(r => r.json()).then(d => { if (d.report_id) setReport(d) })
    loadAttachments()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function updateStatus(newStatus: string) {
    setUpdating(true)
    const res = await fetch(`/api/reports/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setUpdating(false)
    if (res.ok) {
      setReport(prev => prev ? { ...prev, status: newStatus } : prev)
    } else {
      const data = await res.json()
      alert(data.error || 'Update failed')
    }
  }

  async function updateAssignment(assignmentId: number, newStatus: string) {
    setAssignmentUpdating(assignmentId)
    const res = await fetch(`/api/teams/assignments/${assignmentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setAssignmentUpdating(null)
    if (res.ok) {
      fetch(`/api/reports/${id}`).then(r => r.json()).then(d => { if (d.report_id) setReport(d) })
    } else {
      const data = await res.json()
      alert(data.error || 'Update failed')
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(`/api/reports/${id}/attachments`, {
      method: 'POST',
      body: formData,
    })
    setUploading(false)

    if (res.ok) {
      loadAttachments()
    } else {
      const data = await res.json()
      alert(data.error || 'Upload failed')
    }

    // reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function deleteAttachment(attachmentId: number) {
    if (!confirm('Delete this attachment?')) return
    const res = await fetch(`/api/reports/${id}/attachments`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attachment_id: attachmentId }),
    })
    if (res.ok) loadAttachments()
  }

  if (!report) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#070d1c' }}>
        <Navbar username={user.username} role={user.role} />
        <main style={{ marginLeft: '220px', flex: 1, padding: '32px', minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#475569', fontSize: '14px' }}>Loading report...</p>
        </main>
      </div>
    )
  }

  const canUpdate = user.role === 'admin' || user.role === 'emergency_operator'
  const sv = sevBadge[report.severity_level] || sevBadge.low
  const st = statusBadge[report.status] || statusBadge.closed

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#070d1c' }}>
      <Navbar username={user.username} role={user.role} />

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', minWidth: 0 }}>
        {/* Breadcrumb */}
        <div className="enter" style={{ display: 'flex', gap: '6px', marginBottom: '20px', fontSize: '12px', color: '#475569', alignItems: 'center' }}>
          <Link href="/reports" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: '500' }}>Reports</Link>
          <span style={{ color: '#334155' }}>/</span>
          <span style={{ color: '#94a3b8' }}>#{report.report_id}</span>
        </div>

        {/* Page title row */}
        <div className="enter" style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', letterSpacing: '-0.02em', margin: 0, textTransform: 'capitalize' }}>
              {report.disaster_type} Emergency
            </h1>
            <span style={{ backgroundColor: sv.bg, color: sv.color, border: `1px solid ${sv.border}`, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
              {report.severity_level}
            </span>
            <span style={{ backgroundColor: st.bg, color: st.color, border: `1px solid ${st.border}`, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
              {report.status.replace('_', ' ')}
            </span>
          </div>
          <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>{report.location}</p>
        </div>

        {/* Main info card */}
        <div className="enter-1" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: canUpdate ? '20px' : '0' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Reporter</p>
              <p style={{ fontWeight: '600', color: '#f1f5f9', margin: '0 0 2px', fontSize: '14px' }}>{report.citizen_name}</p>
              {report.citizen_phone && <p style={{ color: '#64748b', margin: 0, fontSize: '13px' }}>{report.citizen_phone}</p>}
            </div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Assigned Operator</p>
              <p style={{ fontWeight: '600', color: report.assigned_operator ? '#f1f5f9' : '#334155', margin: 0, fontSize: '14px' }}>
                {report.assigned_operator || 'Unassigned'}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Reported At</p>
              <p style={{ fontWeight: '500', color: '#cbd5e1', margin: 0, fontSize: '13px' }}>{fmtDateTime(report.reported_at)}</p>
            </div>
            {report.resolved_at && (
              <div>
                <p style={{ fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Resolved At</p>
                <p style={{ fontWeight: '500', color: '#34d399', margin: 0, fontSize: '13px' }}>{fmtDateTime(report.resolved_at)}</p>
              </div>
            )}
            {report.latitude && (
              <div>
                <p style={{ fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Coordinates</p>
                <p style={{ fontWeight: '500', color: '#cbd5e1', margin: 0, fontSize: '13px' }}>{report.latitude}, {report.longitude}</p>
              </div>
            )}
          </div>

          {canUpdate && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '18px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Update Status:</span>
                {['pending', 'in_progress', 'resolved', 'closed'].map(s => {
                  const b = statusBadge[s]
                  const isActive = report.status === s
                  const hasTeam = report.assignments?.length > 0
                  const blocked = s === 'in_progress' && !hasTeam
                  return (
                    <button key={s} onClick={() => !blocked && updateStatus(s)} disabled={updating || isActive || blocked}
                      title={blocked ? 'Assign a rescue team first before marking in progress' : undefined}
                      style={{
                        fontSize: '12px',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: isActive ? `1px solid ${b.border}` : '1px solid rgba(255,255,255,0.08)',
                        cursor: isActive || blocked ? 'not-allowed' : 'pointer',
                        backgroundColor: isActive ? b.bg : 'rgba(255,255,255,0.03)',
                        color: isActive ? b.color : blocked ? '#334155' : '#64748b',
                        fontWeight: isActive ? '600' : '400',
                        opacity: blocked ? 0.45 : 1,
                        transition: 'all 0.15s',
                      }}>
                      {s.replace('_', ' ')}
                    </button>
                  )
                })}
                {updating && <span style={{ fontSize: '12px', color: '#475569' }}>Updating...</span>}
              </div>
              {report.assignments?.length === 0 && (
                <p style={{ fontSize: '12px', color: '#475569', margin: '10px 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#f59e0b' }}>⚠</span>
                  Go to <strong style={{ color: '#60a5fa' }}>Teams</strong> and assign a rescue team to enable the &quot;in progress&quot; status.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Assignments + Allocations */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          {/* Assignments */}
          <div className="enter-2" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px' }}>Team Assignments</h3>
            {report.assignments?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {report.assignments.map(a => {
                  const tb = teamTypeBadge[a.team_type] || teamTypeBadge.rescue
                  const ab = statusBadge[a.status] || statusBadge.pending
                  return (
                    <div key={a.assignment_id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#f1f5f9', margin: 0 }}>{a.team_name}</p>
                        <span style={{ backgroundColor: ab.bg, color: ab.color, border: `1px solid ${ab.border}`, padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '600' }}>{a.status}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: canUpdate ? '8px' : '0' }}>
                        <span style={{ backgroundColor: tb.bg, color: tb.color, border: `1px solid ${tb.border}`, padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '600' }}>{a.team_type}</span>
                        <span style={{ color: '#475569', fontSize: '11px' }}>{fmtDateTime(a.assigned_at)}</span>
                      </div>
                      {canUpdate && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {a.status === 'assigned' && (
                            <button
                              onClick={() => updateAssignment(a.assignment_id, 'in_progress')}
                              disabled={assignmentUpdating === a.assignment_id}
                              style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(59,130,246,0.4)', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', cursor: 'pointer', fontWeight: '600' }}>
                              {assignmentUpdating === a.assignment_id ? '...' : 'Mark Active'}
                            </button>
                          )}
                          {a.status === 'in_progress' && (
                            <button
                              onClick={() => updateAssignment(a.assignment_id, 'completed')}
                              disabled={assignmentUpdating === a.assignment_id}
                              style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.1)', color: '#34d399', cursor: 'pointer', fontWeight: '600' }}>
                              {assignmentUpdating === a.assignment_id ? '...' : 'Mark Complete'}
                            </button>
                          )}
                          {(a.status === 'assigned' || a.status === 'in_progress') && (
                            <button
                              onClick={() => updateAssignment(a.assignment_id, 'cancelled')}
                              disabled={assignmentUpdating === a.assignment_id}
                              style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.07)', color: '#f87171', cursor: 'pointer', fontWeight: '600' }}>
                              Cancel
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#334155', textAlign: 'center', padding: '16px 0' }}>No teams assigned</p>
            )}
          </div>

          {/* Allocations */}
          <div className="enter-3" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px' }}>Resource Allocations</h3>
            {report.allocations?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {report.allocations.map(a => {
                  const ab = statusBadge[a.status] || statusBadge.pending
                  return (
                    <div key={a.allocation_id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#f1f5f9', margin: 0 }}>{a.resource_name}</p>
                        <span style={{ backgroundColor: ab.bg, color: ab.color, border: `1px solid ${ab.border}`, padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '600' }}>{a.status}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                        Requested: <span style={{ color: '#94a3b8' }}>{a.qty_requested}</span>
                        &nbsp;&nbsp;·&nbsp;&nbsp;
                        Dispatched: <span style={{ color: '#60a5fa' }}>{a.qty_dispatched}</span>
                      </p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#334155', textAlign: 'center', padding: '16px 0' }}>No resources allocated</p>
            )}
          </div>
        </div>

        {/* Budget Summary */}
        {report.budget && (
          <div className="enter-3b" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px' }}>Budget Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
              {[
                { label: 'Allocations', value: report.budget.total_allocations, color: '#60a5fa' },
                { label: 'Qty Requested', value: report.budget.total_qty_requested, color: '#94a3b8' },
                { label: 'Qty Dispatched', value: report.budget.total_qty_dispatched, color: '#34d399' },
                { label: 'Expenses', value: report.budget.total_expenses, color: '#f59e0b' },
                { label: 'Amount Spent', value: `PKR ${report.budget.total_amount_spent.toLocaleString()}`, color: '#f87171' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p style={{ fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>{label}</p>
                  <p style={{ fontSize: '18px', fontWeight: '700', color, margin: 0 }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Media Attachments */}
        <div className="enter-4" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 2px' }}>
                Media Attachments
              </h3>
              <p style={{ fontSize: '12px', color: '#334155', margin: 0 }}>{attachments.length} file{attachments.length !== 1 ? 's' : ''}</p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                onChange={handleUpload}
                style={{ display: 'none' }}
                id="file-upload"
              />
              <label htmlFor="file-upload" style={{
                background: uploading ? 'rgba(59,130,246,0.08)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: uploading ? '#60a5fa' : '#fff',
                border: uploading ? '1px solid rgba(59,130,246,0.3)' : 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: uploading ? 'not-allowed' : 'pointer',
                boxShadow: uploading ? 'none' : '0 4px 14px rgba(59,130,246,0.3)',
                display: 'inline-block',
              }}>
                {uploading ? 'Uploading...' : '+ Upload File'}
              </label>
            </div>
          </div>

          {attachments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <p style={{ fontSize: '13px', color: '#334155', margin: 0 }}>
                No attachments yet. Upload images, videos or documents related to this incident.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
              {attachments.map(a => (
                <div key={a.attachment_id} style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', overflow: 'hidden', background: 'rgba(255,255,255,0.02)' }}>
                  {a.media_type === 'image' ? (
                    <a href={a.file_url} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.file_url} alt="attachment" style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} />
                    </a>
                  ) : (
                    <a href={a.file_url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px', backgroundColor: 'rgba(255,255,255,0.03)', textDecoration: 'none' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '32px' }}>
                          {a.media_type === 'video' ? '🎬' : a.media_type === 'audio' ? '🎵' : '📄'}
                        </div>
                        <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0' }}>{a.media_type}</p>
                      </div>
                    </a>
                  )}
                  <div style={{ padding: '8px 10px' }}>
                    <p style={{ fontSize: '11px', color: '#475569', margin: 0 }}>{fmtDate(a.uploaded_at)}</p>
                    {user.role === 'admin' && (
                      <button onClick={() => deleteAttachment(a.attachment_id)}
                        style={{ fontSize: '11px', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: '4px', fontWeight: '600' }}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
