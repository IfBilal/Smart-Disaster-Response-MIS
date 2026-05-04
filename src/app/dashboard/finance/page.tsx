'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { fmtDate } from '@/lib/fmt'

interface FinancialSummary {
  total_donations: number
  total_expenses: number
  net_balance: number
  pending_transactions: number
}

interface Transaction {
  transaction_id: number
  transaction_type: string
  amount: number
  status: string
  transaction_timestamp: string
}

const txTypeBadge: Record<string, { bg: string; color: string; border: string }> = {
  donation:    { bg: 'rgba(16,185,129,0.12)',  color: '#34d399', border: 'rgba(16,185,129,0.3)'  },
  expense:     { bg: 'rgba(239,68,68,0.12)',   color: '#f87171', border: 'rgba(239,68,68,0.3)'   },
  procurement: { bg: 'rgba(249,115,22,0.12)',  color: '#fb923c', border: 'rgba(249,115,22,0.3)'  },
  transfer:    { bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa', border: 'rgba(59,130,246,0.3)'  },
}

const statusBadge: Record<string, { bg: string; color: string; border: string }> = {
  pending:   { bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24', border: 'rgba(245,158,11,0.3)'  },
  approved:  { bg: 'rgba(16,185,129,0.12)',  color: '#34d399', border: 'rgba(16,185,129,0.3)'  },
  rejected:  { bg: 'rgba(239,68,68,0.12)',   color: '#f87171', border: 'rgba(239,68,68,0.3)'   },
  completed: { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)' },
}

export default function FinanceDashboard() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [user, setUser] = useState({ username: '', role: 'finance_officer' })

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.username) setUser(d) })

    fetch('/api/financial/transactions').then(r => r.json()).then(d => {
      if (d.summary) setSummary(d.summary)
      if (Array.isArray(d.transactions)) setTransactions(d.transactions.slice(0, 10))
    })
  }, [])

  const netPositive = (summary?.net_balance ?? 0) >= 0

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#070d1c' }}>
      <Navbar username={user.username} role={user.role} />
      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', minWidth: 0 }}>

        {/* Header */}
        <div className="enter" style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
            Financial Operations
          </h1>
          <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>
            Donations · expenses · transaction ledger
          </p>
        </div>

        {/* Summary stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          <div
            className="enter-1"
            style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderTop: '2px solid #10b981', borderRadius: '12px', padding: '18px 20px', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.35)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
          >
            <p style={{ color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>TOTAL DONATIONS</p>
            <p style={{ fontSize: '20px', fontWeight: '700', color: '#34d399', margin: 0, letterSpacing: '-0.02em' }}>
              PKR {summary?.total_donations?.toLocaleString() ?? '—'}
            </p>
          </div>

          <div
            className="enter-2"
            style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderTop: '2px solid #ef4444', borderRadius: '12px', padding: '18px 20px', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.35)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
          >
            <p style={{ color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>TOTAL EXPENSES</p>
            <p style={{ fontSize: '20px', fontWeight: '700', color: '#f87171', margin: 0, letterSpacing: '-0.02em' }}>
              PKR {summary?.total_expenses?.toLocaleString() ?? '—'}
            </p>
          </div>

          <div
            className="enter-3"
            style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderTop: `2px solid ${netPositive ? '#3b82f6' : '#f97316'}`, borderRadius: '12px', padding: '18px 20px', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.35)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
          >
            <p style={{ color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>NET BALANCE</p>
            <p style={{ fontSize: '20px', fontWeight: '700', color: netPositive ? '#60a5fa' : '#fb923c', margin: 0, letterSpacing: '-0.02em' }}>
              PKR {summary?.net_balance?.toLocaleString() ?? '—'}
            </p>
          </div>

          <div
            className="enter-4"
            style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderTop: '2px solid #f59e0b', borderRadius: '12px', padding: '18px 20px', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.35)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
          >
            <p style={{ color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>PENDING TRANSACTIONS</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: summary?.pending_transactions ? '#fbbf24' : '#f1f5f9', margin: 0, letterSpacing: '-0.02em' }}>
              {summary?.pending_transactions ?? '—'}
            </p>
          </div>
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>

          {/* Transactions table */}
          <div className="enter-5" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9', margin: 0 }}>Recent Transactions</h2>
              <Link href="/financial" style={{ color: '#3b82f6', fontSize: '12px', textDecoration: 'none', fontWeight: '500' }}>View all →</Link>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ID</th>
                  <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date</th>
                  <th style={{ textAlign: 'right', padding: '10px 16px', fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => {
                  const typeBadge = txTypeBadge[t.transaction_type] || { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)' }
                  const stBadge = statusBadge[t.status] || statusBadge.pending
                  const isExpense = t.transaction_type === 'expense' || t.transaction_type === 'procurement'
                  return (
                    <tr
                      key={t.transaction_id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.025)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '13px' }}>#{t.transaction_id}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: typeBadge.bg, color: typeBadge.color, border: `1px solid ${typeBadge.border}`, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                          {t.transaction_type}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: stBadge.bg, color: stBadge.color, border: `1px solid ${stBadge.border}`, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px' }}>
                        {fmtDate(t.transaction_timestamp)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: isExpense ? '#f87171' : '#34d399' }}>
                          {isExpense ? '−' : '+'}PKR {t.amount.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {transactions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#475569' }}>
                <p style={{ fontSize: '13px', margin: 0 }}>No transactions found</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="enter-6" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 16px' }}>Quick Actions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link
                href="/financial"
                style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', padding: '14px 16px', textDecoration: 'none', transition: 'border-color 0.15s, background 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(16,185,129,0.4)'; (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.12)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(16,185,129,0.2)'; (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.08)' }}
              >
                <span style={{ fontSize: '18px' }}>+</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#34d399' }}>Record Donation</span>
              </Link>
              <Link
                href="/financial"
                style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '14px 16px', textDecoration: 'none', transition: 'border-color 0.15s, background 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.4)'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.12)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.2)'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)' }}
              >
                <span style={{ fontSize: '18px' }}>+</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#f87171' }}>Record Expense</span>
              </Link>
              <Link
                href="/approvals"
                style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', padding: '14px 16px', textDecoration: 'none', transition: 'border-color 0.15s, background 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59,130,246,0.4)'; (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.12)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59,130,246,0.2)'; (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.08)' }}
              >
                <span style={{ fontSize: '16px' }}>✓</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#60a5fa' }}>Review Approvals</span>
              </Link>
              <Link
                href="/analytics"
                style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '10px', padding: '14px 16px', textDecoration: 'none', transition: 'border-color 0.15s, background 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.4)'; (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.12)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.2)'; (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.08)' }}
              >
                <span style={{ fontSize: '16px' }}>↗</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#a78bfa' }}>View Analytics</span>
              </Link>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
