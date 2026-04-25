'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

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

  const txTypeColor: Record<string, string> = {
    donation: 'bg-green-100 text-green-700',
    expense: 'bg-red-100 text-red-700',
    procurement: 'bg-orange-100 text-orange-700',
    transfer: 'bg-blue-100 text-blue-700',
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar username={user.username} role={user.role} />

      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Finance Officer Dashboard</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <p className="text-sm text-green-600">Total Donations</p>
            <p className="text-xl font-bold text-green-700">PKR {summary?.total_donations?.toLocaleString() ?? '—'}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <p className="text-sm text-red-600">Total Expenses</p>
            <p className="text-xl font-bold text-red-700">PKR {summary?.total_expenses?.toLocaleString() ?? '—'}</p>
          </div>
          <div className={`border rounded p-4 ${(summary?.net_balance ?? 0) >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
            <p className="text-sm text-blue-600">Net Balance</p>
            <p className="text-xl font-bold text-blue-700">PKR {summary?.net_balance?.toLocaleString() ?? '—'}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <p className="text-sm text-yellow-600">Pending Transactions</p>
            <p className="text-xl font-bold text-yellow-700">{summary?.pending_transactions ?? '—'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Recent Transactions</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {transactions.map(t => (
                <div key={t.transaction_id} className="border rounded p-2 text-sm flex justify-between items-center">
                  <div>
                    <span className={`text-xs px-2 py-0.5 rounded ${txTypeColor[t.transaction_type] || 'bg-gray-100 text-gray-600'}`}>
                      {t.transaction_type}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{new Date(t.transaction_timestamp).toLocaleDateString()}</p>
                  </div>
                  <span className="font-medium">PKR {t.amount.toLocaleString()}</span>
                </div>
              ))}
              {transactions.length === 0 && <p className="text-sm text-gray-400">No transactions found</p>}
            </div>
          </div>

          <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link href="/financial" className="block bg-green-50 hover:bg-green-100 text-green-700 text-sm px-4 py-3 rounded border border-green-200">
                + Record Donation
              </Link>
              <Link href="/financial" className="block bg-red-50 hover:bg-red-100 text-red-700 text-sm px-4 py-3 rounded border border-red-200">
                + Record Expense
              </Link>
              <Link href="/approvals" className="block bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm px-4 py-3 rounded border border-blue-200">
                Review Approvals
              </Link>
              <Link href="/analytics" className="block bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm px-4 py-3 rounded border border-purple-200">
                View Analytics
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
