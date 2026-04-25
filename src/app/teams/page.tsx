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

const statusColor: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  assigned: 'bg-blue-100 text-blue-700',
  busy: 'bg-orange-100 text-orange-700',
  completed: 'bg-gray-100 text-gray-600',
}

const typeColor: Record<string, string> = {
  medical: 'bg-red-50 text-red-600',
  fire: 'bg-orange-50 text-orange-600',
  rescue: 'bg-blue-50 text-blue-600',
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
      const data = await res.json()
      setTeams(prev => [...prev, { ...data, current_members: 0 }])
      setShowForm(false)
      setForm({ team_name: '', team_type: 'rescue', current_location: '', capacity: '5' })
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to create team')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar username={user.username} role={user.role} />

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Rescue Teams</h2>
          {user.role === 'admin' && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              + New Team
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-white rounded shadow p-4 mb-6">
            <h3 className="font-semibold text-gray-700 mb-3">Create Rescue Team</h3>
            <form onSubmit={createTeam} className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                <input value={form.team_name} onChange={e => setForm(p => ({ ...p, team_name: e.target.value }))} required
                  className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={form.team_type} onChange={e => setForm(p => ({ ...p, team_type: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm">
                  <option value="rescue">Rescue</option>
                  <option value="medical">Medical</option>
                  <option value="fire">Fire</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input value={form.current_location} onChange={e => setForm(p => ({ ...p, current_location: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input type="number" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm" min="1" />
              </div>
              <div className="col-span-2 flex gap-2">
                <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
                  {loading ? 'Creating...' : 'Create Team'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 px-4 py-2 rounded text-sm border hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex gap-2 mb-4">
          {['', 'available', 'assigned', 'busy'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`text-sm px-3 py-1 rounded border ${filterStatus === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => (
            <div key={t.team_id} className="bg-white rounded shadow p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-800">{t.team_name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded ${statusColor[t.availability_status] || ''}`}>
                  {t.availability_status}
                </span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ${typeColor[t.team_type] || 'bg-gray-50 text-gray-600'}`}>
                {t.team_type}
              </span>
              <div className="mt-3 text-sm text-gray-500 space-y-1">
                <p>Members: {t.current_members} / {t.capacity}</p>
                {t.current_location && <p>Location: {t.current_location}</p>}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center text-gray-400 py-8">No teams found</div>
          )}
        </div>
      </div>
    </div>
  )
}
