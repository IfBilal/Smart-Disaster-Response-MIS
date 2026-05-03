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

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [user, setUser] = useState({ username: '', role: '' })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ team_name: '', team_type: 'rescue', current_location: '', capacity: '5' })
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.username) setUser(d) })
    fetch('/api/teams').then(r => r.json()).then(d => { if (Array.isArray(d)) setTeams(d) })
  }, [])

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
      fetch('/api/teams').then(r => r.json()).then(d => { if (Array.isArray(d)) setTeams(d) })
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
            return (
              <div key={t.team_id} className={`enter-${Math.min(i + 3, 8)}`} style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px', transition: 'border-color 0.2s' }}
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
                  <p style={{ fontSize: '12px', color: '#475569', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: '#334155' }}>&#9679;</span>
                    {t.current_location}
                  </p>
                )}
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
    </div>
  )
}
