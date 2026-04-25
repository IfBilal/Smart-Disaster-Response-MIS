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
      if (!res.ok) { setError(data.error || 'Login failed'); setLoading(false); return }
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
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#070d1c',
      backgroundImage: `
        radial-gradient(ellipse at 15% 85%, rgba(239,68,68,0.08) 0%, transparent 50%),
        radial-gradient(ellipse at 85% 15%, rgba(59,130,246,0.10) 0%, transparent 50%)
      `,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      position: 'relative',
    }}>
      {/* Grid overlay */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '390px' }} className="enter">
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '58px', height: '58px', borderRadius: '16px', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '26px', boxShadow: '0 8px 28px rgba(239,68,68,0.45)',
          }}>🚨</div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#f1f5f9', margin: '0 0 6px', letterSpacing: '-0.025em' }}>
            Smart Disaster Response
          </h1>
          <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>
            Emergency Management Information System
          </p>
        </div>

        {/* Login card */}
        <div style={{
          background: 'rgba(10, 20, 44, 0.92)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '16px', padding: '32px',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 24px 56px rgba(0,0,0,0.5)',
        }}>
          <p style={{ fontSize: '12px', fontWeight: '600', color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '24px' }}>
            Authorized Personnel Only
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required autoFocus
                placeholder="Enter your username"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••••"
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
                fontSize: '13px', color: '#fca5a5',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? 'rgba(59,130,246,0.35)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: '#fff', border: 'none', borderRadius: '10px',
                padding: '13px', fontSize: '14px', fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.01em',
                boxShadow: loading ? 'none' : '0 4px 18px rgba(59,130,246,0.38)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(59,130,246,0.55)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' } }}
              onMouseLeave={e => { if (!loading) { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 18px rgba(59,130,246,0.38)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' } }}
            >
              {loading ? 'Authenticating...' : 'Sign In to System'}
            </button>
          </form>

          <div style={{ marginTop: '20px', paddingTop: '18px', borderTop: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>
              Not an operator?{' '}
              <a href="/reports/new" style={{ color: '#60a5fa', fontWeight: '600', textDecoration: 'none' }}>
                Submit an emergency report →
              </a>
            </p>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#1e293b', fontSize: '11px', marginTop: '18px' }}>
          Unauthorized access to this system is prohibited and monitored.
        </p>
      </div>
    </div>
  )
}
