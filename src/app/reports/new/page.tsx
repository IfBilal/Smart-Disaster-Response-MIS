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

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    display: 'block',
    marginBottom: '8px',
  }

  const sectionHeadStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    margin: '0 0 14px',
    paddingBottom: '10px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070d1c', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="enter" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '48px 40px', maxWidth: '440px', width: '100%', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '24px' }}>
            ✓
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f1f5f9', margin: '0 0 8px' }}>Report Submitted</h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px', lineHeight: '1.6' }}>
            Your report has been received. Emergency services will respond shortly.
          </p>
          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '12px 20px', marginBottom: '28px', display: 'inline-block' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Report ID</span>
            <p style={{ fontSize: '20px', fontWeight: '700', color: '#34d399', margin: '2px 0 0' }}>#{success.report_id}</p>
          </div>
          <br />
          <button
            onClick={() => { setSuccess(null); setForm({ full_name: '', cnic: '', phone: '', address: '', disaster_type: 'flood', severity_level: 'medium', location: '', latitude: '', longitude: '', description: '' }) }}
            style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 14px rgba(59,130,246,0.3)' }}
          >
            Submit Another Report
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070d1c', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: '560px' }}>

        {/* Header */}
        <div className="enter" style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '20px', padding: '5px 14px', marginBottom: '16px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 8px #ef4444' }}></span>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Emergency Report</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#f1f5f9', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Report an Emergency
          </h1>
          <p style={{ color: '#475569', fontSize: '14px', margin: 0 }}>
            Fill in the details below. All fields marked * are required.
          </p>
        </div>

        {/* Form card */}
        <div className="enter-1" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '28px' }}>
          <form onSubmit={handleSubmit}>

            {/* Your Information */}
            <p style={sectionHeadStyle}>Your Information</p>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Full Name *</label>
              <input name="full_name" value={form.full_name} onChange={handleChange} required placeholder="Enter your full name" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>CNIC (optional)</label>
                <input name="cnic" value={form.cnic} onChange={handleChange} placeholder="XXXXX-XXXXXXX-X" />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+92 xxx xxxxxxx" />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Address</label>
              <input name="address" value={form.address} onChange={handleChange} placeholder="Your current address" />
            </div>

            {/* Incident Details */}
            <p style={sectionHeadStyle}>Incident Details</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Disaster Type *</label>
                <select name="disaster_type" value={form.disaster_type} onChange={handleChange} required>
                  <option value="flood">Flood</option>
                  <option value="earthquake">Earthquake</option>
                  <option value="fire">Fire</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Severity Level *</label>
                <select name="severity_level" value={form.severity_level} onChange={handleChange} required>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Location *</label>
              <input name="location" value={form.location} onChange={handleChange} required placeholder="Street, City, District" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Latitude (optional)</label>
                <input name="latitude" value={form.latitude} onChange={handleChange} type="number" step="any" placeholder="e.g. 33.7215" />
              </div>
              <div>
                <label style={labelStyle}>Longitude (optional)</label>
                <input name="longitude" value={form.longitude} onChange={handleChange} type="number" step="any" placeholder="e.g. 73.0433" />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4}
                placeholder="Describe the emergency situation in as much detail as possible..." />
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
                <p style={{ color: '#f87171', fontSize: '13px', margin: 0 }}>{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{
                width: '100%',
                background: loading ? 'rgba(239,68,68,0.1)' : 'linear-gradient(135deg, #ef4444, #b91c1c)',
                color: loading ? '#f87171' : '#fff',
                border: loading ? '1px solid rgba(239,68,68,0.3)' : 'none',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 18px rgba(239,68,68,0.35)',
                transition: 'all 0.2s',
                letterSpacing: '0.02em',
              }}>
              {loading ? 'Submitting...' : 'Submit Emergency Report'}
            </button>

          </form>
        </div>

        <p className="enter-2" style={{ textAlign: 'center', color: '#334155', fontSize: '12px', marginTop: '20px' }}>
          For life-threatening emergencies, call <strong style={{ color: '#f87171' }}>1122</strong> immediately.
        </p>
      </div>
    </div>
  )
}
