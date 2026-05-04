'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import { fmtDate } from '@/lib/fmt'

interface Summary {
  total_donations: number
  total_expenses: number
  net_balance: number
  pending_transactions: number
}

interface Donation {
  donation_id: number
  donor_name: string
  donor_type: string
  amount: number
  payment_method: string
  donated_at: string
}

interface Expense {
  expense_id: number
  category: string
  amount: number
  description: string
  expense_date: string
}

interface Transaction {
  transaction_id: number
  transaction_type: string
  amount: number
  status: string
  transaction_timestamp: string
}

export default function FinancialPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [donations, setDonations] = useState<Donation[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [user, setUser] = useState({ username: '', role: '' })
  const [tab, setTab] = useState<'overview' | 'donations' | 'expenses' | 'add-donation' | 'add-expense'>('overview')

  const [donForm, setDonForm] = useState({ donor_name: '', donor_type: 'individual', amount: '', payment_method: 'cash' })
  const [expForm, setExpForm] = useState({ category: 'procurement', amount: '', description: '', expense_date: '' })
  const [submitting, setSubmitting] = useState(false)

  function loadAll() {
    fetch('/api/financial/transactions').then(r => r.json()).then(d => {
      if (d.summary) setSummary(d.summary)
      if (Array.isArray(d.transactions)) setTransactions(d.transactions)
    })
    fetch('/api/financial/donations').then(r => r.json()).then(d => { if (Array.isArray(d)) setDonations(d) })
    fetch('/api/financial/expenses').then(r => r.json()).then(d => { if (Array.isArray(d)) setExpenses(d) })
  }

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.username) setUser(d) })
    loadAll()
  }, [])

  async function addDonation(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const res = await fetch('/api/financial/donations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...donForm, amount: parseFloat(donForm.amount) }),
    })
    setSubmitting(false)
    if (res.ok) {
      alert('Donation recorded successfully')
      loadAll()
      setTab('donations')
      setDonForm({ donor_name: '', donor_type: 'individual', amount: '', payment_method: 'cash' })
    } else {
      const data = await res.json()
      alert(data.error || 'Failed')
    }
  }

  async function addExpense(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const res = await fetch('/api/financial/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...expForm, amount: parseFloat(expForm.amount) }),
    })
    setSubmitting(false)
    if (res.ok) {
      alert('Expense recorded successfully')
      loadAll()
      setTab('expenses')
      setExpForm({ category: 'procurement', amount: '', description: '', expense_date: '' })
    } else {
      const data = await res.json()
      alert(data.error || 'Failed')
    }
  }

  const txTypeBadge = (type: string) => {
    const map: Record<string, { bg: string; color: string; border: string }> = {
      donation:    { bg: 'rgba(16,185,129,0.12)',  color: '#34d399', border: 'rgba(16,185,129,0.3)' },
      expense:     { bg: 'rgba(239,68,68,0.12)',   color: '#f87171', border: 'rgba(239,68,68,0.3)' },
      procurement: { bg: 'rgba(249,115,22,0.12)',  color: '#fb923c', border: 'rgba(249,115,22,0.3)' },
      transfer:    { bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
    }
    const s = map[type] || { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)' }
    return {
      backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`,
      padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' as const, display: 'inline-block',
    }
  }

  const tabLabels: Record<string, string> = {
    overview: 'Overview', donations: 'Donations', expenses: 'Expenses',
    'add-donation': '+ Donation', 'add-expense': '+ Expense',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: '600', color: '#64748b',
    textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px',
  }

  const thStyle: React.CSSProperties = {
    textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: '600',
    color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em',
  }

  const tdStyle: React.CSSProperties = { padding: '12px 16px', color: '#cbd5e1', fontSize: '13px' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#070d1c' }}>
      <Navbar username={user.username} role={user.role} />

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', minWidth: 0 }}>
        <div className="enter" style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
            Financial Management
          </h1>
          <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>
            Donations, expenses, and transaction overview
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', padding: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', marginBottom: '24px', width: 'fit-content', flexWrap: 'wrap' }}>
          {(['overview', 'donations', 'expenses', 'add-donation', 'add-expense'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '7px 16px', borderRadius: '7px', fontSize: '13px',
              fontWeight: tab === t ? '600' : '400', border: 'none', cursor: 'pointer',
              background: tab === t ? 'rgba(59,130,246,0.18)' : 'transparent',
              color: tab === t ? '#60a5fa' : '#64748b', transition: 'all 0.18s', textTransform: 'capitalize',
            }}>
              {tabLabels[t]}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <>
            <div className="enter-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderTop: '2px solid #10b981', borderRadius: '12px', padding: '18px 20px' }}>
                <p style={{ color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Total Donations</p>
                <p style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>PKR {summary?.total_donations?.toLocaleString() ?? '—'}</p>
              </div>
              <div style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderTop: '2px solid #ef4444', borderRadius: '12px', padding: '18px 20px' }}>
                <p style={{ color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Total Expenses</p>
                <p style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>PKR {summary?.total_expenses?.toLocaleString() ?? '—'}</p>
              </div>
              <div style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderTop: '2px solid #3b82f6', borderRadius: '12px', padding: '18px 20px' }}>
                <p style={{ color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Net Balance</p>
                <p style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>PKR {summary?.net_balance?.toLocaleString() ?? '—'}</p>
              </div>
              <div style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderTop: '2px solid #f59e0b', borderRadius: '12px', padding: '18px 20px' }}>
                <p style={{ color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Pending</p>
                <p style={{ fontSize: '26px', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>{summary?.pending_transactions ?? '—'}</p>
              </div>
            </div>

            <div className="enter-2" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: '600' }}>Recent Transactions</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['ID', 'Type', 'Amount', 'Status', 'Date'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 20).map(t => (
                    <tr key={t.transaction_id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.025)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={tdStyle}>#{t.transaction_id}</td>
                      <td style={{ ...tdStyle }}>
                        <span style={txTypeBadge(t.transaction_type)}>{t.transaction_type}</span>
                      </td>
                      <td style={{ ...tdStyle, color: '#f1f5f9', fontWeight: '500' }}>PKR {t.amount.toLocaleString()}</td>
                      <td style={tdStyle}>
                        <span style={t.status === 'completed'
                          ? { backgroundColor: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', display: 'inline-block' }
                          : { backgroundColor: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', display: 'inline-block' }
                        }>{t.status}</span>
                      </td>
                      <td style={{ ...tdStyle, color: '#64748b' }}>{fmtDate(t.transaction_timestamp)}</td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: '40px 16px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>No transactions</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Donations Tab */}
        {tab === 'donations' && (
          <div className="enter-1" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: '600' }}>Donations</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['ID', 'Donor', 'Type', 'Amount', 'Method', 'Date'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {donations.map(d => (
                  <tr key={d.donation_id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.025)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={tdStyle}>#{d.donation_id}</td>
                    <td style={{ ...tdStyle, color: '#f1f5f9', fontWeight: '500' }}>{d.donor_name}</td>
                    <td style={{ ...tdStyle, textTransform: 'capitalize' }}>{d.donor_type}</td>
                    <td style={{ ...tdStyle, color: '#34d399' }}>PKR {d.amount.toLocaleString()}</td>
                    <td style={tdStyle}>{d.payment_method}</td>
                    <td style={{ ...tdStyle, color: '#64748b' }}>{fmtDate(d.donated_at)}</td>
                  </tr>
                ))}
                {donations.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>No donations found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Expenses Tab */}
        {tab === 'expenses' && (
          <div className="enter-1" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: '600' }}>Expenses</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['ID', 'Category', 'Amount', 'Description', 'Date'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.expense_id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                    onMouseEnter={ev => (ev.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.025)')}
                    onMouseLeave={ev => (ev.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={tdStyle}>#{e.expense_id}</td>
                    <td style={{ ...tdStyle, textTransform: 'capitalize' }}>{e.category}</td>
                    <td style={{ ...tdStyle, color: '#f87171' }}>PKR {e.amount.toLocaleString()}</td>
                    <td style={{ ...tdStyle, color: '#64748b' }}>{e.description || '—'}</td>
                    <td style={{ ...tdStyle, color: '#64748b' }}>{e.expense_date}</td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: '40px 16px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>No expenses found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Donation Tab */}
        {tab === 'add-donation' && (
          <div className="enter-1">
            <div style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '24px', maxWidth: '520px' }}>
              <h3 style={{ color: '#f1f5f9', fontSize: '15px', fontWeight: '600', margin: '0 0 20px' }}>Record Donation</h3>
              <form onSubmit={addDonation} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Donor Name *</label>
                  <input value={donForm.donor_name} onChange={e => setDonForm(p => ({ ...p, donor_name: e.target.value }))} required
                    style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={labelStyle}>Donor Type *</label>
                  <select value={donForm.donor_type} onChange={e => setDonForm(p => ({ ...p, donor_type: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box' }}>
                    <option value="individual">Individual</option>
                    <option value="organization">Organization</option>
                    <option value="government">Government</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Amount (PKR) *</label>
                  <input type="number" step="0.01" value={donForm.amount} onChange={e => setDonForm(p => ({ ...p, amount: e.target.value }))} required
                    style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={labelStyle}>Payment Method</label>
                  <select value={donForm.payment_method} onChange={e => setDonForm(p => ({ ...p, payment_method: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box' }}>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="online">Online</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
                <button type="submit" disabled={submitting} style={{
                  background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none',
                  padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                  cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                  transition: 'all 0.2s', opacity: submitting ? 0.6 : 1, width: '100%',
                }}>
                  {submitting ? 'Saving...' : 'Record Donation'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Add Expense Tab */}
        {tab === 'add-expense' && (
          <div className="enter-1">
            <div style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '24px', maxWidth: '520px' }}>
              <h3 style={{ color: '#f1f5f9', fontSize: '15px', fontWeight: '600', margin: '0 0 20px' }}>Record Expense</h3>
              <form onSubmit={addExpense} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Category *</label>
                  <select value={expForm.category} onChange={e => setExpForm(p => ({ ...p, category: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box' }}>
                    <option value="procurement">Procurement</option>
                    <option value="logistics">Logistics</option>
                    <option value="medical">Medical</option>
                    <option value="admin">Admin</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Amount (PKR) *</label>
                  <input type="number" step="0.01" value={expForm.amount} onChange={e => setExpForm(p => ({ ...p, amount: e.target.value }))} required
                    style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={labelStyle}>Description</label>
                  <input value={expForm.description} onChange={e => setExpForm(p => ({ ...p, description: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={labelStyle}>Date *</label>
                  <input type="date" value={expForm.expense_date} onChange={e => setExpForm(p => ({ ...p, expense_date: e.target.value }))} required
                    style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
                <button type="submit" disabled={submitting} style={{
                  background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171',
                  padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                  cursor: submitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                  opacity: submitting ? 0.6 : 1, width: '100%',
                }}>
                  {submitting ? 'Saving...' : 'Record Expense'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
