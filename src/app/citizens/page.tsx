'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { fmtDate } from '@/lib/fmt'

interface Citizen {
  citizen_id: number
  full_name: string
  cnic: string
  phone: string
  address: string
  registered_at: string
  report_count: number
}

export default function CitizensPage() {
  const [citizens, setCitizens] = useState<Citizen[]>([])
  const [user, setUser] = useState({ username: '', role: '' })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  function load(q = '') {
    setLoading(true)
    fetch(`/api/citizens${q ? `?search=${encodeURIComponent(q)}` : ''}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setCitizens(d); setLoading(false) })
  }

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.username) setUser(d) })
    load()
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#070d1c' }}>
      <Navbar username={user.username} role={user.role} />

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', minWidth: 0 }}>
        <div className="enter" style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
            Citizens Registry
          </h1>
          <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>
            {citizens.length} registered citizens
          </p>
        </div>

        {/* Search */}
        <div className="enter-1" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load(search)}
            placeholder="Search by name, CNIC, or phone..."
            style={{ flex: 1, maxWidth: '400px' }}
          />
          <button onClick={() => load(search)}
            style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            Search
          </button>
          {search && (
            <button onClick={() => { setSearch(''); load('') }}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', padding: '9px 16px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
              Clear
            </button>
          )}
        </div>

        <div className="enter-2" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['ID', 'Name', 'CNIC', 'Phone', 'Address', 'Reports', 'Registered'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#334155', fontSize: '13px' }}>Loading...</td></tr>
              ) : citizens.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#334155', fontSize: '13px' }}>No citizens found</td></tr>
              ) : citizens.map(c => (
                <tr key={c.citizen_id}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.025)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  <td style={{ padding: '12px 16px', color: '#475569', fontSize: '13px' }}>#{c.citizen_id}</td>
                  <td style={{ padding: '12px 16px', color: '#f1f5f9', fontSize: '13px', fontWeight: '500' }}>{c.full_name}</td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '12px', fontFamily: 'monospace' }}>{c.cnic || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px' }}>{c.phone || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: c.report_count > 0 ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)', color: c.report_count > 0 ? '#60a5fa' : '#334155', border: `1px solid ${c.report_count > 0 ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.06)'}`, padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                      {c.report_count}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px' }}>{fmtDate(c.registered_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
