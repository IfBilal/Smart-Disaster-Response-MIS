'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { fmtDate } from '@/lib/fmt'

interface Hospital {
  hospital_id: number
  name: string
  location: string
  total_beds: number
  available_beds: number
  occupied_beds: number
  occupancy_pct: number
  contact_number: string
}

interface Patient {
  patient_id: number
  hospital_id: number
  hospital_name: string
  condition: string
  admission_time: string
  discharge_time: string
  report_id: number
  incident_location: string
}

const conditionBadge: Record<string, { bg: string; color: string; border: string }> = {
  critical: { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', border: 'rgba(239,68,68,0.3)'  },
  serious:  { bg: 'rgba(249,115,22,0.12)', color: '#fb923c', border: 'rgba(249,115,22,0.3)' },
  stable:   { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.3)' },
}

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [user, setUser] = useState({ username: '', role: '' })
  const [tab, setTab] = useState<'hospitals' | 'patients' | 'admit'>('hospitals')
  const [admitForm, setAdmitForm] = useState({
    report_id: '', hospital_id: '', condition: 'stable',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.username) setUser(d) })
    fetch('/api/hospitals').then(r => r.json()).then(d => { if (Array.isArray(d)) setHospitals(d) })
    fetch('/api/hospitals/patients').then(r => r.json()).then(d => { if (Array.isArray(d)) setPatients(d) })
  }, [])

  async function admitPatient(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const res = await fetch('/api/hospitals/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        report_id: parseInt(admitForm.report_id),
        hospital_id: admitForm.hospital_id ? parseInt(admitForm.hospital_id) : null,
        condition: admitForm.condition,
      }),
    })
    setSubmitting(false)
    if (res.ok) {
      alert('Patient admitted successfully')
      fetch('/api/hospitals').then(r => r.json()).then(d => { if (Array.isArray(d)) setHospitals(d) })
      fetch('/api/hospitals/patients').then(r => r.json()).then(d => { if (Array.isArray(d)) setPatients(d) })
      setTab('patients')
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to admit patient')
    }
  }

  async function dischargePatient(patientId: number, condition: string) {
    if (!confirm('Discharge this patient?')) return
    const res = await fetch(`/api/hospitals/patients/${patientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discharge: true, condition }),
    })
    if (res.ok) {
      fetch('/api/hospitals').then(r => r.json()).then(d => { if (Array.isArray(d)) setHospitals(d) })
      fetch('/api/hospitals/patients').then(r => r.json()).then(d => { if (Array.isArray(d)) setPatients(d) })
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to discharge patient')
    }
  }

  const canAdmit = user.role === 'admin' || user.role === 'field_officer'

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
        <div className="enter" style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', letterSpacing: '-0.02em', margin: '0 0 4px' }}>Hospital & Patient Management</h1>
          <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>Track bed availability and patient admissions across all hospitals</p>
        </div>

        {/* Tabs */}
        <div className="enter-1" style={{ display: 'flex', gap: '4px', padding: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', marginBottom: '24px', width: 'fit-content' }}>
          {(['hospitals', 'patients', ...(canAdmit ? ['admit'] : [])] as const).map(t => (
            <button key={t} onClick={() => setTab(t as typeof tab)}
              style={{
                padding: '7px 16px',
                borderRadius: '7px',
                fontSize: '13px',
                fontWeight: tab === t ? '600' : '400',
                border: 'none',
                cursor: 'pointer',
                background: tab === t ? 'rgba(59,130,246,0.18)' : 'transparent',
                color: tab === t ? '#60a5fa' : '#64748b',
                transition: 'all 0.18s',
              }}>
              {t === 'admit' ? 'Admit Patient' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Hospitals tab */}
        {tab === 'hospitals' && (
          <div className="enter-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {hospitals.map(h => {
              const pct = Math.min(h.occupancy_pct, 100)
              const barColor = pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#10b981'
              const availColor = h.available_beds === 0 ? '#f87171' : '#34d399'
              return (
                <div key={h.hospital_id} style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#f1f5f9', margin: '0 0 4px' }}>{h.name}</h3>
                  <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 16px' }}>{h.location}</p>

                  {/* Bed availability numbers */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bed Availability</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: availColor }}>
                      {h.available_beds} <span style={{ color: '#334155', fontWeight: '400' }}>/ {h.total_beds}</span>
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: '5px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: '12px' }}>
                    <div style={{ height: '100%', borderRadius: '4px', width: `${pct}%`, background: barColor, transition: 'width 0.4s' }} />
                  </div>

                  {/* Stats row */}
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div>
                      <p style={{ fontSize: '10px', color: '#334155', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Occupied</p>
                      <p style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600', margin: 0 }}>{h.occupied_beds} <span style={{ fontSize: '11px', color: '#475569', fontWeight: '400' }}>({h.occupancy_pct}%)</span></p>
                    </div>
                    {h.contact_number && (
                      <div>
                        <p style={{ fontSize: '10px', color: '#334155', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact</p>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{h.contact_number}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {hospitals.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#334155', padding: '48px 0', fontSize: '14px' }}>
                No hospitals found
              </div>
            )}
          </div>
        )}

        {/* Patients tab */}
        {tab === 'patients' && (
          <div className="enter-2" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Patient ID', 'Report', 'Hospital', 'Condition', 'Admitted', 'Discharged', ...(canAdmit ? ['Action'] : [])].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patients.map(p => {
                  const cb = conditionBadge[p.condition] || conditionBadge.stable
                  return (
                    <tr key={p.patient_id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.025)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <td style={{ padding: '12px 16px', color: '#475569', fontSize: '13px', fontWeight: '500' }}>#{p.patient_id}</td>
                      <td style={{ padding: '12px 16px', color: '#60a5fa', fontSize: '13px' }}>#{p.report_id} <span style={{ color: '#475569', fontSize: '11px' }}>{p.incident_location}</span></td>
                      <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px' }}>{p.hospital_name}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ backgroundColor: cb.bg, color: cb.color, border: `1px solid ${cb.border}`, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                          {p.condition}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#cbd5e1', fontSize: '13px' }}>{fmtDate(p.admission_time)}</td>
                      <td style={{ padding: '12px 16px', color: p.discharge_time ? '#34d399' : '#334155', fontSize: '13px' }}>
                        {fmtDate(p.discharge_time)}
                      </td>
                      {canAdmit && (
                        <td style={{ padding: '12px 16px' }}>
                          {!p.discharge_time && (
                            <button onClick={() => dischargePatient(p.patient_id, p.condition)}
                              style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', color: '#fb923c', padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                              Discharge
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
                {patients.length === 0 && (
                  <tr>
                    <td colSpan={canAdmit ? 7 : 6} style={{ padding: '48px', textAlign: 'center', color: '#334155', fontSize: '13px' }}>
                      No patients found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Admit patient tab */}
        {tab === 'admit' && canAdmit && (
          <div className="enter-2" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '24px', maxWidth: '520px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 20px' }}>Admit Patient</h3>
            <form onSubmit={admitPatient}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Report ID *</label>
                <input type="number" value={admitForm.report_id}
                  onChange={e => setAdmitForm(p => ({ ...p, report_id: e.target.value }))} required
                  placeholder="Enter report ID" />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Hospital</label>
                <select value={admitForm.hospital_id}
                  onChange={e => setAdmitForm(p => ({ ...p, hospital_id: e.target.value }))}>
                  <option value="">Auto-assign (best available)</option>
                  {hospitals.filter(h => h.available_beds > 0).map(h => (
                    <option key={h.hospital_id} value={h.hospital_id}>
                      {h.name} ({h.available_beds} beds available)
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '11px', color: '#475569', margin: '6px 0 0' }}>
                  Leave blank to auto-assign to the hospital with most available beds.
                  {!admitForm.hospital_id && hospitals.length > 0 && (
                    <span style={{ color: '#34d399', fontWeight: '600' }}>
                      {' '}→ Will assign to: {[...hospitals].sort((a, b) => b.available_beds - a.available_beds)[0]?.name}
                    </span>
                  )}
                </p>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Condition *</label>
                <select value={admitForm.condition}
                  onChange={e => setAdmitForm(p => ({ ...p, condition: e.target.value }))} required>
                  <option value="stable">Stable</option>
                  <option value="serious">Serious</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <button type="submit" disabled={submitting}
                style={{ background: submitting ? 'rgba(59,130,246,0.08)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: submitting ? '#60a5fa' : '#fff', border: submitting ? '1px solid rgba(59,130,246,0.3)' : 'none', padding: '10px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: submitting ? 'none' : '0 4px 14px rgba(59,130,246,0.3)', width: '100%', transition: 'all 0.2s' }}>
                {submitting ? 'Admitting...' : 'Admit Patient'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
