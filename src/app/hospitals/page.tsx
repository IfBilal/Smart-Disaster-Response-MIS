'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'

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
  condition: string
  admission_time: string
  discharge_time: string
  report_id: number
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
        hospital_id: parseInt(admitForm.hospital_id),
        condition: admitForm.condition,
        admission_time: new Date().toISOString(),
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

  async function dischargePatient(patientId: number) {
    if (!confirm('Discharge this patient?')) return
    const res = await fetch(`/api/hospitals/patients/${patientId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discharge_time: new Date().toISOString() }),
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

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar username={user.username} role={user.role} />

      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Hospital & Patient Management</h2>

        <div className="flex gap-2 mb-6">
          {(['hospitals', 'patients', ...(canAdmit ? ['admit'] : [])] as const).map(t => (
            <button key={t} onClick={() => setTab(t as typeof tab)}
              className={`px-4 py-2 rounded text-sm font-medium ${tab === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
              {t === 'admit' ? 'Admit Patient' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'hospitals' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hospitals.map(h => (
              <div key={h.hospital_id} className="bg-white rounded shadow p-4">
                <h3 className="font-semibold text-gray-800">{h.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{h.location}</p>

                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Bed Availability</span>
                  <span className={h.available_beds === 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                    {h.available_beds} / {h.total_beds}
                  </span>
                </div>

                <div className="h-2 bg-gray-200 rounded mb-3">
                  <div
                    className={`h-2 rounded ${h.occupancy_pct > 80 ? 'bg-red-400' : h.occupancy_pct > 50 ? 'bg-yellow-400' : 'bg-green-400'}`}
                    style={{ width: `${Math.min(h.occupancy_pct, 100)}%` }}
                  />
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  <p>Occupied: {h.occupied_beds} beds ({h.occupancy_pct}%)</p>
                  {h.contact_number && <p>Contact: {h.contact_number}</p>}
                </div>
              </div>
            ))}
            {hospitals.length === 0 && (
              <div className="col-span-3 text-center text-gray-400 py-8">No hospitals found</div>
            )}
          </div>
        )}

        {tab === 'patients' && (
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600">Patient ID</th>
                  <th className="px-4 py-3 text-left text-gray-600">Report ID</th>
                  <th className="px-4 py-3 text-left text-gray-600">Hospital ID</th>
                  <th className="px-4 py-3 text-left text-gray-600">Condition</th>
                  <th className="px-4 py-3 text-left text-gray-600">Admitted</th>
                  <th className="px-4 py-3 text-left text-gray-600">Discharged</th>
                  {canAdmit && <th className="px-4 py-3 text-left text-gray-600">Action</th>}
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.patient_id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">#{p.patient_id}</td>
                    <td className="px-4 py-3">#{p.report_id}</td>
                    <td className="px-4 py-3">#{p.hospital_id}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${p.condition === 'critical' ? 'bg-red-100 text-red-700' : p.condition === 'stable' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {p.condition}
                      </span>
                    </td>
                    <td className="px-4 py-3">{new Date(p.admission_time).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{p.discharge_time ? new Date(p.discharge_time).toLocaleDateString() : '—'}</td>
                    {canAdmit && (
                      <td className="px-4 py-3">
                        {!p.discharge_time && (
                          <button onClick={() => dischargePatient(p.patient_id)}
                            className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded hover:bg-orange-200">
                            Discharge
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {patients.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">No patients found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'admit' && canAdmit && (
          <div className="bg-white rounded shadow p-6 max-w-md">
            <h3 className="font-semibold text-gray-700 mb-4">Admit Patient</h3>
            <form onSubmit={admitPatient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report ID *</label>
                <input type="number" value={admitForm.report_id}
                  onChange={e => setAdmitForm(p => ({ ...p, report_id: e.target.value }))} required
                  className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hospital *</label>
                <select value={admitForm.hospital_id}
                  onChange={e => setAdmitForm(p => ({ ...p, hospital_id: e.target.value }))} required
                  className="w-full border rounded px-3 py-2 text-sm">
                  <option value="">Select hospital</option>
                  {hospitals.filter(h => h.available_beds > 0).map(h => (
                    <option key={h.hospital_id} value={h.hospital_id}>
                      {h.name} ({h.available_beds} beds available)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition *</label>
                <select value={admitForm.condition}
                  onChange={e => setAdmitForm(p => ({ ...p, condition: e.target.value }))} required
                  className="w-full border rounded px-3 py-2 text-sm">
                  <option value="stable">Stable</option>
                  <option value="serious">Serious</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50">
                {submitting ? 'Admitting...' : 'Admit Patient'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
