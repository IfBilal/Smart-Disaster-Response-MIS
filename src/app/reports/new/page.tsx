'use client'

import { useState } from 'react'

export default function NewReportPage() {
  const [form, setForm] = useState({
    full_name: '',
    cnic: '',
    phone: '',
    address: '',
    disaster_type: 'flood',
    severity_level: 'medium',
    location: '',
    latitude: '',
    longitude: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<{ report_id: number } | null>(null)
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Failed to submit report')
      return
    }
    setSuccess(data)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded shadow p-8 max-w-md w-full text-center">
          <div className="text-green-600 text-4xl mb-4">✓</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Report Submitted</h2>
          <p className="text-gray-600 mb-4">Your report has been received. Emergency services will respond shortly.</p>
          <p className="text-sm text-gray-500 mb-6">Report ID: <strong>#{success.report_id}</strong></p>
          <button
            onClick={() => { setSuccess(null); setForm({ full_name: '', cnic: '', phone: '', address: '', disaster_type: 'flood', severity_level: 'medium', location: '', latitude: '', longitude: '', description: '' }) }}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Submit Another Report
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded shadow p-6">
          <h1 className="text-xl font-bold text-red-700 mb-1">Emergency Report Form</h1>
          <p className="text-sm text-gray-500 mb-6">Fill in the details below to report a disaster or emergency situation.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">Your Information</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input name="full_name" value={form.full_name} onChange={handleChange} required
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CNIC (optional)</label>
                <input name="cnic" value={form.cnic} onChange={handleChange} placeholder="XXXXX-XXXXXXX-X"
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input name="address" value={form.address} onChange={handleChange}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <h3 className="text-sm font-semibold text-gray-700 border-b pb-1 pt-2">Incident Details</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Disaster Type *</label>
                <select name="disaster_type" value={form.disaster_type} onChange={handleChange} required
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="flood">Flood</option>
                  <option value="earthquake">Earthquake</option>
                  <option value="fire">Fire</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity Level *</label>
                <select name="severity_level" value={form.severity_level} onChange={handleChange} required
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
              <input name="location" value={form.location} onChange={handleChange} required
                placeholder="Street, City, District"
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude (optional)</label>
                <input name="latitude" value={form.latitude} onChange={handleChange} type="number" step="any"
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude (optional)</label>
                <input name="longitude" value={form.longitude} onChange={handleChange} type="number" step="any"
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the emergency situation..." />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 text-sm px-3 py-2 rounded">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-red-600 text-white py-2.5 rounded font-medium hover:bg-red-700 disabled:opacity-50">
              {loading ? 'Submitting...' : 'Submit Emergency Report'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
