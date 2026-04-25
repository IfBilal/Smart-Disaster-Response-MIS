'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }

      const role = data.role
      if (role === 'admin') router.push('/dashboard/admin')
      else if (role === 'emergency_operator') router.push('/dashboard/operator')
      else if (role === 'field_officer') router.push('/dashboard/field-officer')
      else if (role === 'warehouse_manager') router.push('/dashboard/warehouse')
      else if (role === 'finance_officer') router.push('/dashboard/finance')
      else router.push('/dashboard/admin')
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1e3a5f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚨</div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#ffffff', margin: '0 0 6px' }}>
            Smart Disaster Response
          </h1>
          <p style={{ color: '#93c5fd', fontSize: '14px', margin: 0 }}>
            Emergency Management Information System
          </p>
        </div>

        {/* Card */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e3a5f', marginTop: 0, marginBottom: '24px' }}>
            Sign in to your account
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                style={{
                  width: '100%',
                  border: '1.5px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '14px',
                  color: '#111827',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = '#2563eb')}
                onBlur={e => (e.target.style.borderColor = '#d1d5db')}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  border: '1.5px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '14px',
                  color: '#111827',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={e => (e.target.style.borderColor = '#2563eb')}
                onBlur={e => (e.target.style.borderColor = '#d1d5db')}
              />
            </div>

            {error && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#dc2626' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: loading ? '#93c5fd' : '#1d4ed8',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.15s',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
              Not registered?{' '}
              <a href="/reports/new" style={{ color: '#1d4ed8', fontWeight: '500', textDecoration: 'none' }}>
                Submit an emergency report
              </a>
            </p>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#60a5fa', fontSize: '12px', marginTop: '20px' }}>
          For staff use only. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  )
}
