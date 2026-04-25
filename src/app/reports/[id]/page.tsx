'use client'

import { useEffect, useState, use, useRef } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

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
}

interface Attachment {
  attachment_id: number
  file_url: string
  media_type: string
  uploaded_at: string
}

const statusColor: Record<string, { bg: string; color: string }> = {
  pending:     { bg: '#f1f5f9', color: '#475569' },
  in_progress: { bg: '#dbeafe', color: '#1e40af' },
  resolved:    { bg: '#dcfce7', color: '#166534' },
  closed:      { bg: '#e5e7eb', color: '#6b7280' },
}

const severityColor: Record<string, { bg: string; color: string }> = {
  critical: { bg: '#fee2e2', color: '#991b1b' },
  high:     { bg: '#ffedd5', color: '#9a3412' },
  medium:   { bg: '#fef9c3', color: '#854d0e' },
  low:      { bg: '#dcfce7', color: '#166534' },
}

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [report, setReport] = useState<ReportDetail | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [user, setUser] = useState({ username: '', role: '' })
  const [updating, setUpdating] = useState(false)
  const [uploading, setUploading] = useState(false)
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
      <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
        <Navbar username={user.username} role={user.role} />
        <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading report...</div>
      </div>
    )
  }

  const canUpdate = user.role === 'admin' || user.role === 'emergency_operator'
  const sv = severityColor[report.severity_level] || { bg: '#f1f5f9', color: '#475569' }
  const st = statusColor[report.status] || { bg: '#f1f5f9', color: '#475569' }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
      <Navbar username={user.username} role={user.role} />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', fontSize: '13px', color: '#64748b' }}>
          <Link href="/reports" style={{ color: '#2563eb', textDecoration: 'none' }}>Reports</Link>
          <span>/</span>
          <span>#{report.report_id}</span>
        </div>

        {/* Main card */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px', textTransform: 'capitalize' }}>
                {report.disaster_type} Emergency — #{report.report_id}
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>{report.location}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ ...st, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                {report.status.replace('_', ' ')}
              </span>
              <span style={{ ...sv, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                {report.severity_level}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px', marginBottom: '20px' }}>
            <div>
              <p style={{ color: '#64748b', margin: '0 0 2px', fontSize: '12px' }}>Reporter</p>
              <p style={{ fontWeight: '600', color: '#0f172a', margin: 0 }}>{report.citizen_name}</p>
              {report.citizen_phone && <p style={{ color: '#64748b', margin: 0 }}>{report.citizen_phone}</p>}
            </div>
            <div>
              <p style={{ color: '#64748b', margin: '0 0 2px', fontSize: '12px' }}>Assigned Operator</p>
              <p style={{ fontWeight: '600', color: '#0f172a', margin: 0 }}>{report.assigned_operator || 'Unassigned'}</p>
            </div>
            <div>
              <p style={{ color: '#64748b', margin: '0 0 2px', fontSize: '12px' }}>Reported At</p>
              <p style={{ fontWeight: '500', color: '#0f172a', margin: 0 }}>{new Date(report.reported_at).toLocaleString()}</p>
            </div>
            {report.resolved_at && (
              <div>
                <p style={{ color: '#64748b', margin: '0 0 2px', fontSize: '12px' }}>Resolved At</p>
                <p style={{ fontWeight: '500', color: '#0f172a', margin: 0 }}>{new Date(report.resolved_at).toLocaleString()}</p>
              </div>
            )}
            {report.latitude && (
              <div>
                <p style={{ color: '#64748b', margin: '0 0 2px', fontSize: '12px' }}>Coordinates</p>
                <p style={{ fontWeight: '500', color: '#0f172a', margin: 0 }}>{report.latitude}, {report.longitude}</p>
              </div>
            )}
          </div>

          {canUpdate && (
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Update Status:</span>
              {['pending', 'in_progress', 'resolved', 'closed'].map(s => (
                <button key={s} onClick={() => updateStatus(s)} disabled={updating || report.status === s}
                  style={{
                    fontSize: '12px', padding: '6px 14px', borderRadius: '6px', border: '1.5px solid',
                    cursor: report.status === s ? 'default' : 'pointer',
                    backgroundColor: report.status === s ? '#f1f5f9' : '#ffffff',
                    borderColor: report.status === s ? '#cbd5e1' : '#94a3b8',
                    color: report.status === s ? '#94a3b8' : '#374151',
                    fontWeight: report.status === s ? '400' : '500',
                  }}>
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          {/* Assignments */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', marginTop: 0, marginBottom: '12px' }}>Team Assignments</h3>
            {report.assignments?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {report.assignments.map(a => (
                  <div key={a.assignment_id} style={{ border: '1px solid #f1f5f9', borderRadius: '8px', padding: '12px' }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', margin: '0 0 2px' }}>{a.team_name}</p>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 2px' }}>{a.team_type} • {a.status}</p>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>{new Date(a.assigned_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>No teams assigned</p>
            )}
          </div>

          {/* Allocations */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', marginTop: 0, marginBottom: '12px' }}>Resource Allocations</h3>
            {report.allocations?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {report.allocations.map(a => (
                  <div key={a.allocation_id} style={{ border: '1px solid #f1f5f9', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', margin: 0 }}>{a.resource_name}</p>
                      <span style={{ fontSize: '11px', backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '10px' }}>{a.status}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>
                      Requested: {a.qty_requested} | Dispatched: {a.qty_dispatched}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>No resources allocated</p>
            )}
          </div>
        </div>

        {/* Media Attachments */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', margin: 0 }}>
              Media Attachments ({attachments.length})
            </h3>
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
                backgroundColor: uploading ? '#93c5fd' : '#1d4ed8',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: uploading ? 'not-allowed' : 'pointer',
              }}>
                {uploading ? 'Uploading...' : '+ Upload File'}
              </label>
            </div>
          </div>

          {attachments.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '24px 0' }}>
              No attachments yet. Upload images, videos or documents related to this incident.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
              {attachments.map(a => (
                <div key={a.attachment_id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  {a.media_type === 'image' ? (
                    <a href={a.file_url} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={a.file_url} alt="attachment" style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} />
                    </a>
                  ) : (
                    <a href={a.file_url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px', backgroundColor: '#f8fafc', textDecoration: 'none' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '32px' }}>
                          {a.media_type === 'video' ? '🎬' : a.media_type === 'audio' ? '🎵' : '📄'}
                        </div>
                        <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0' }}>{a.media_type}</p>
                      </div>
                    </a>
                  )}
                  <div style={{ padding: '8px' }}>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>{new Date(a.uploaded_at).toLocaleDateString()}</p>
                    {user.role === 'admin' && (
                      <button onClick={() => deleteAttachment(a.attachment_id)}
                        style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: '4px' }}>
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
