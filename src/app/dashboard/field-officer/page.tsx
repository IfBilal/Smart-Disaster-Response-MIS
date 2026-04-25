'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

interface Hospital {
  hospital_id: number
  name: string
  location: string
  available_beds: number
  total_beds: number
  occupancy_pct: number
}

interface Report {
  report_id: number
  disaster_type: string
  severity_level: string
  location: string
  status: string
}

export default function FieldOfficerDashboard() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [user, setUser] = useState({ username: '', role: 'field_officer' })

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.username) setUser(d) })

    fetch('/api/hospitals').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setHospitals(d)
    })

    fetch('/api/reports?status=in_progress').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setReports(d.slice(0, 8))
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar username={user.username} role={user.role} />

      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Field Officer Dashboard</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Link href="/reports" className="bg-blue-50 border border-blue-200 rounded p-4 text-center hover:bg-blue-100">
            <p className="text-2xl font-bold text-blue-700">{reports.length}</p>
            <p className="text-sm text-blue-600">Active Incidents</p>
          </Link>
          <Link href="/hospitals" className="bg-green-50 border border-green-200 rounded p-4 text-center hover:bg-green-100">
            <p className="text-2xl font-bold text-green-700">{hospitals.reduce((s, h) => s + h.available_beds, 0)}</p>
            <p className="text-sm text-green-600">Available Beds</p>
          </Link>
          <Link href="/resources" className="bg-yellow-50 border border-yellow-200 rounded p-4 text-center hover:bg-yellow-100">
            <p className="text-2xl font-bold text-yellow-700">→</p>
            <p className="text-sm text-yellow-600">Request Resources</p>
          </Link>
          <Link href="/approvals" className="bg-purple-50 border border-purple-200 rounded p-4 text-center hover:bg-purple-100">
            <p className="text-2xl font-bold text-purple-700">→</p>
            <p className="text-sm text-purple-600">My Requests</p>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Active Incidents</h3>
            <div className="space-y-2">
              {reports.map(r => (
                <div key={r.report_id} className="border rounded p-3 text-sm flex justify-between">
                  <div>
                    <Link href={`/reports/${r.report_id}`} className="font-medium text-blue-600 hover:underline">
                      #{r.report_id} — {r.disaster_type}
                    </Link>
                    <p className="text-gray-500 text-xs">{r.location}</p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded h-fit">{r.severity_level}</span>
                </div>
              ))}
              {reports.length === 0 && <p className="text-sm text-gray-400">No active incidents</p>}
            </div>
          </div>

          <div className="bg-white rounded shadow p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-700">Hospital Capacity</h3>
              <Link href="/hospitals" className="text-blue-600 text-xs hover:underline">View all</Link>
            </div>
            <div className="space-y-2">
              {hospitals.slice(0, 5).map(h => (
                <div key={h.hospital_id} className="border rounded p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">{h.name}</span>
                    <span className={`text-xs px-2 py-1 rounded ${h.available_beds > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {h.available_beds}/{h.total_beds} beds
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs">{h.location}</p>
                  <div className="mt-1 h-1.5 bg-gray-200 rounded">
                    <div
                      className={`h-1.5 rounded ${h.occupancy_pct > 80 ? 'bg-red-400' : h.occupancy_pct > 50 ? 'bg-yellow-400' : 'bg-green-400'}`}
                      style={{ width: `${h.occupancy_pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Quick Actions</h3>
          <div className="flex gap-3">
            <Link href="/hospitals" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
              Admit Patient
            </Link>
            <Link href="/resources" className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">
              Request Resources
            </Link>
            <Link href="/reports" className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">
              View All Reports
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
