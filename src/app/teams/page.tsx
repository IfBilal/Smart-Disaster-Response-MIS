'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'

interface Team {
  team_id: number
  team_name: string
  team_type: string
  current_location: string
  availability_status: string
  capacity: number
  current_members: number
}

interface Report {
  report_id: number
  disaster_type: string
  severity_level: string
  location: string
  status: string
}

const statusBadge: Record<string, { bg: string; color: string; border: string }> = {
  available: { bg: 'rgba(16,185,129,0.12)',  color: '#34d399', border: 'rgba(16,185,129,0.3)'  },
  assigned:  { bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa', border: 'rgba(59,130,246,0.3)'  },
  busy:      { bg: 'rgba(249,115,22,0.12)',  color: '#fb923c', border: 'rgba(249,115,22,0.3)'  },
  completed: { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)' },
}

const typeBadge: Record<string, { bg: string; color: string; border: string }> = {
  medical: { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', border: 'rgba(239,68,68,0.3)'  },
  fire:    { bg: 'rgba(249,115,22,0.12)', color: '#fb923c', border: 'rgba(249,115,22,0.3)' },
  rescue:  { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
}

const severityColor: Record<string, string> = {
  critical: '#f87171',
  high:     '#fb923c',
  medium:   '#fbbf24',
  low:      '#34d399',
}

export default function TeamsPage() {
  const [teams, setTeams]               = useState<Team[]>([])
  const [user, setUser]                 = useState({ username: '', role: '', user_id: 0 })
  const [showForm, setShowForm]         = useState(false)
  const [form, setForm]                 = useState({ team_name: '', team_type: 'rescue', current_location: '', capacity: '5' })
  const [loading, setLoading]           = useState(false)
  const [filterStatus, setFilterStatus] = useState('')

  // Assign modal state
  const [assignTarget, setAssignTarget] = useState<Team | null>(null)
  const [reports, setReports]           = useState<Report[]>([])
  const [assignForm, setAssignForm]     = useState({ report_id: '', notes: '' })
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignError, setAssignError]   = useState('')

  // Members modal state
  interface Member { team_id: number; member_id: number; username: string; user_role: string; member_role: string; phone: string; joined_at: string }
  const [membersTarget, setMembersTarget] = useState<Team | null>(null)
  const [members, setMembers]             = useState<Member[]>([])
  const [memberForm, setMemberForm]       = useState({ user_id: '', member_role: '' })
  const [memberSubmitting, setMemberSubmitting] = useState(false)
  const [memberError, setMemberError]     = useState('')

  const canAssign = ['admin', 'emergency_operator'].includes(user.role)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.username) setUser(d) })
    loadTeams()
  }, [])

  function loadTeams() {
    fetch('/api/teams').then(r => r.json()).then(d => { if (Array.isArray(d)) setTeams(d) })
  }

  function openAssignModal(team: Team) {
    setAssignTarget(team)
    setAssignForm({ report_id: '', notes: '' })
    setAssignError('')
    // Fetch open reports
    fetch('/api/reports?status=pending')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) {
          setReports(d)
        } else {
          setReports([])
        }
      })
  }

  async function submitAssign(e: React.FormEvent) {
    e.preventDefault()
    if (!assignTarget || !assignForm.report_id) return
    setAssignLoading(true)
    setAssignError('')
    const res = await fetch(`/api/teams/${assignTarget.team_id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report_id: parseInt(assignForm.report_id), notes: assignForm.notes }),
    })
    setAssignLoading(false)
    if (res.ok) {
      setAssignTarget(null)
      loadTeams()
    } else {
      const data = await res.json()
      setAssignError(data.error || 'Assignment failed')
    }
  }

  function openMembersModal(team: Team) {
    setMembersTarget(team)
    setMemberForm({ user_id: '', member_role: '' })
    setMemberError('')
    fetch(`/api/teams/${team.team_id}/members`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setMembers(d) })
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault()
    if (!membersTarget) return
    setMemberSubmitting(true)
    setMemberError('')
    const res = await fetch(`/api/teams/${membersTarget.team_id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: parseInt(memberForm.user_id), member_role: memberForm.member_role }),
    })
    setMemberSubmitting(false)
    if (res.ok) {
      setMemberForm({ user_id: '', member_role: '' })
      fetch(`/api/teams/${membersTarget.team_id}/members`).then(r => r.json()).then(d => { if (Array.isArray(d)) setMembers(d) })
      loadTeams()
    } else {
      const data = await res.json()
      setMemberError(data.error || 'Failed to add member')
    }
  }

  async function removeMember(memberId: number) {
    if (!membersTarget || !confirm('Remove this member?')) return
    const res = await fetch(`/api/teams/${membersTarget.team_id}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: memberId }),
    })
    if (res.ok) {
      fetch(`/api/teams/${membersTarget.team_id}/members`).then(r => r.json()).then(d => { if (Array.isArray(d)) setMembers(d) })
      loadTeams()
    }
  }

  const filtered = filterStatus ? teams.filter(t => t.availability_status === filterStatus) : teams

  async function createTeam(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, capacity: parseInt(form.capacity) }),
    })
    setLoading(false)
    if (res.ok) {
      loadTeams()
      setShowForm(false)
      setForm({ team_name: '', team_type: 'rescue', current_location: '', capacity: '5' })
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to create team')
    }
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    display: 'block',
    marginBottom: '8px',
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#070d1c' }}>
      <Navbar username={user.username} role={user.role} />

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', minWidth: 0 }}>
        {/* Header */}
        <div className="enter" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', letterSpacing: '-0.02em', margin: '0 0 4px' }}>Rescue Teams</h1>
            <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>Manage and monitor all active response teams</p>
          </div>
          {user.role === 'admin' && (
            <button
              onClick={() => setShowForm(!showForm)}
              style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 14px rgba(59,130,246,0.3)', transition: 'all 0.2s' }}>
              {showForm ? 'Cancel' : '+ New Team'}
            </button>
          )}
        </div>

        {/* Create team form */}
        {showForm && (
          <div className="enter-1" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '24px', maxWidth: '520px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 20px' }}>Create Rescue Team</h3>
            <form onSubmit={createTeam}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={labelStyle}>Team Name</label>
                  <input value={form.team_name} onChange={e => setForm(p => ({ ...p, team_name: e.target.value }))} required placeholder="e.g. Alpha Squad" />
                </div>
                <div>
                  <label style={labelStyle}>Type</label>
                  <select value={form.team_type} onChange={e => setForm(p => ({ ...p, team_type: e.target.value }))}>
                    <option value="rescue">Rescue</option>
                    <option value="medical">Medical</option>
                    <option value="fire">Fire</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Location</label>
                  <input value={form.current_location} onChange={e => setForm(p => ({ ...p, current_location: e.target.value }))} placeholder="e.g. Islamabad HQ" />
                </div>
                <div>
                  <label style={labelStyle}>Capacity</label>
                  <input type="number" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} min="1" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" disabled={loading}
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(59,130,246,0.3)', opacity: loading ? 0.6 : 1 }}>
                  {loading ? 'Creating...' : 'Create Team'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', padding: '9px 20px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter tabs */}
        <div className="enter-2" style={{ display: 'flex', gap: '4px', padding: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', marginBottom: '20px', width: 'fit-content' }}>
          {[['', 'All Teams'], ['available', 'Available'], ['assigned', 'Assigned'], ['busy', 'Busy'], ['completed', 'Completed']].map(([val, label]) => (
            <button key={val} onClick={() => setFilterStatus(val)}
              style={{
                padding: '7px 16px',
                borderRadius: '7px',
                fontSize: '13px',
                fontWeight: filterStatus === val ? '600' : '400',
                border: 'none',
                cursor: 'pointer',
                background: filterStatus === val ? 'rgba(59,130,246,0.18)' : 'transparent',
                color: filterStatus === val ? '#60a5fa' : '#64748b',
                transition: 'all 0.18s',
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Team cards grid */}
        <div className="enter-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filtered.map((t, i) => {
            const sb = statusBadge[t.availability_status] || statusBadge.completed
            const tb = typeBadge[t.team_type] || { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)' }
            const memberPct = t.capacity > 0 ? Math.round((t.current_members / t.capacity) * 100) : 0
            const isAvailable = t.availability_status === 'available'
            return (
              <div key={t.team_id} className={`enter-${Math.min(i + 3, 8)}`} style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px', transition: 'border-color 0.2s', display: 'flex', flexDirection: 'column' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}>
                {/* Team header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>{t.team_name}</h3>
                  <span style={{ backgroundColor: sb.bg, color: sb.color, border: `1px solid ${sb.border}`, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                    {t.availability_status}
                  </span>
                </div>

                {/* Type badge */}
                <span style={{ backgroundColor: tb.bg, color: tb.color, border: `1px solid ${tb.border}`, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', display: 'inline-block', marginBottom: '14px' }}>
                  {t.team_type}
                </span>

                {/* Members progress */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#475569', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Members</span>
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>{t.current_members} / {t.capacity}</span>
                  </div>
                  <div style={{ height: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '4px', width: `${memberPct}%`, background: memberPct > 80 ? '#ef4444' : memberPct > 50 ? '#f59e0b' : '#10b981', transition: 'width 0.4s' }} />
                  </div>
                </div>

                {/* Location */}
                {t.current_location && (
                  <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: '#334155' }}>&#9679;</span>
                    {t.current_location}
                  </p>
                )}

                {/* Buttons row */}
                <div style={{ marginTop: 'auto', display: 'flex', gap: '8px', flexDirection: 'column' }}>
                  {canAssign && isAvailable && (
                    <button
                      onClick={() => openAssignModal(t)}
                      style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '8px 0', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 8px rgba(16,185,129,0.25)', transition: 'opacity 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                      Assign to Report
                    </button>
                  )}
                  {user.role === 'admin' && (
                    <button
                      onClick={() => openMembersModal(t)}
                      style={{ width: '100%', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa', padding: '7px 0', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'opacity 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                      Manage Members ({t.current_members})
                    </button>
                  )}
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#334155', padding: '48px 0', fontSize: '14px' }}>
              No teams found
            </div>
          )}
        </div>
      </main>

      {/* Members Modal */}
      {membersTarget && (
        <div onClick={e => { if (e.target === e.currentTarget) setMembersTarget(null) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '520px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#f1f5f9', margin: '0 0 4px' }}>Team Members</h2>
                <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>{membersTarget.team_name} · {members.length} / {membersTarget.capacity}</p>
              </div>
              <button onClick={() => setMembersTarget(null)} style={{ background: 'none', border: 'none', color: '#475569', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>

            {/* Current members */}
            <div style={{ marginBottom: '20px' }}>
              {members.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#334155', textAlign: 'center', padding: '16px 0' }}>No members yet</p>
              ) : (
                members.map(m => (
                  <div key={m.member_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '8px' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 2px' }}>{m.username}</p>
                      <p style={{ fontSize: '11px', color: '#475569', margin: 0 }}>{m.member_role || m.user_role} {m.phone ? `· ${m.phone}` : ''}</p>
                    </div>
                    <button onClick={() => removeMember(m.member_id)}
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add member form */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '18px' }}>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>Add Member</p>
              <form onSubmit={addMember} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>User ID *</label>
                  <input type="number" value={memberForm.user_id} onChange={e => setMemberForm(p => ({ ...p, user_id: e.target.value }))} required placeholder="Enter user ID" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>Role in Team</label>
                  <input value={memberForm.member_role} onChange={e => setMemberForm(p => ({ ...p, member_role: e.target.value }))} placeholder="e.g. Team Lead, Medic" />
                </div>
                {memberError && (
                  <p style={{ fontSize: '12px', color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', padding: '8px 10px', margin: 0 }}>{memberError}</p>
                )}
                <button type="submit" disabled={memberSubmitting}
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', border: 'none', padding: '9px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', opacity: memberSubmitting ? 0.6 : 1 }}>
                  {memberSubmitting ? 'Adding...' : 'Add Member'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assignTarget && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setAssignTarget(null) }}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
          }}>
          <div style={{
            background: '#0c1829',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '14px',
            padding: '28px',
            width: '100%',
            maxWidth: '460px',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#f1f5f9', margin: '0 0 4px' }}>Assign Team</h2>
                <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>{assignTarget.team_name}</p>
              </div>
              <button onClick={() => setAssignTarget(null)}
                style={{ background: 'none', border: 'none', color: '#475569', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>
                ✕
              </button>
            </div>

            <form onSubmit={submitAssign}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Select Report *</label>
                {reports.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>No pending reports found.</p>
                ) : (
                  <select
                    required
                    value={assignForm.report_id}
                    onChange={e => setAssignForm(p => ({ ...p, report_id: e.target.value }))}
                    style={{ width: '100%' }}
                  >
                    <option value="">— choose a report —</option>
                    {reports.map(r => (
                      <option key={r.report_id} value={r.report_id}>
                        #{r.report_id} · {r.disaster_type} · {r.severity_level.toUpperCase()} · {r.location}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Severity preview */}
              {assignForm.report_id && (() => {
                const r = reports.find(x => x.report_id === parseInt(assignForm.report_id))
                if (!r) return null
                return (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', display: 'flex', gap: '12px', fontSize: '12px' }}>
                    <span style={{ color: severityColor[r.severity_level] || '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>{r.severity_level}</span>
                    <span style={{ color: '#64748b' }}>{r.disaster_type}</span>
                    <span style={{ color: '#475569', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.location}</span>
                  </div>
                )
              })()}

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Notes (optional)</label>
                <textarea
                  value={assignForm.notes}
                  onChange={e => setAssignForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="e.g. Team dispatched to north sector"
                  rows={3}
                  style={{ width: '100%', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              {assignError && (
                <p style={{ fontSize: '13px', color: '#f87171', marginBottom: '14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', padding: '8px 12px' }}>
                  {assignError}
                </p>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={assignLoading || reports.length === 0}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: assignLoading ? 'not-allowed' : 'pointer',
                    opacity: assignLoading ? 0.6 : 1,
                    boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                  }}>
                  {assignLoading ? 'Assigning...' : 'Confirm Assignment'}
                </button>
                <button type="button" onClick={() => setAssignTarget(null)}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
