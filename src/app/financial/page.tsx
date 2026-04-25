'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'

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
        <h2 className="text-xl font-bold text-gray-800 mb-6">Financial Management</h2>

        <div className="flex gap-2 flex-wrap mb-6">
          {(['overview', 'donations', 'expenses', 'add-donation', 'add-expense'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded text-sm font-medium ${tab === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
              {t === 'add-donation' ? '+ Donation' : t === 'add-expense' ? '+ Expense' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <p className="text-sm text-green-600">Total Donations</p>
                <p className="text-xl font-bold text-green-700">PKR {summary?.total_donations?.toLocaleString() ?? '—'}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-sm text-red-600">Total Expenses</p>
                <p className="text-xl font-bold text-red-700">PKR {summary?.total_expenses?.toLocaleString() ?? '—'}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-sm text-blue-600">Net Balance</p>
                <p className="text-xl font-bold text-blue-700">PKR {summary?.net_balance?.toLocaleString() ?? '—'}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <p className="text-sm text-yellow-600">Pending</p>
                <p className="text-xl font-bold text-yellow-700">{summary?.pending_transactions ?? '—'}</p>
              </div>
            </div>

            <div className="bg-white rounded shadow overflow-hidden">
              <div className="p-4 border-b font-semibold text-gray-700">Recent Transactions</div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-600">ID</th>
                    <th className="px-4 py-3 text-left text-gray-600">Type</th>
                    <th className="px-4 py-3 text-left text-gray-600">Amount</th>
                    <th className="px-4 py-3 text-left text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 20).map(t => (
                    <tr key={t.transaction_id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">#{t.transaction_id}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded ${txTypeColor[t.transaction_type] || 'bg-gray-100'}`}>
                          {t.transaction_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">PKR {t.amount.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded ${t.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{new Date(t.transaction_timestamp).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No transactions</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'donations' && (
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600">ID</th>
                  <th className="px-4 py-3 text-left text-gray-600">Donor</th>
                  <th className="px-4 py-3 text-left text-gray-600">Type</th>
                  <th className="px-4 py-3 text-left text-gray-600">Amount</th>
                  <th className="px-4 py-3 text-left text-gray-600">Method</th>
                  <th className="px-4 py-3 text-left text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {donations.map(d => (
                  <tr key={d.donation_id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">#{d.donation_id}</td>
                    <td className="px-4 py-3 font-medium">{d.donor_name}</td>
                    <td className="px-4 py-3 capitalize">{d.donor_type}</td>
                    <td className="px-4 py-3">PKR {d.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">{d.payment_method}</td>
                    <td className="px-4 py-3">{new Date(d.donated_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {donations.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No donations found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'expenses' && (
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600">ID</th>
                  <th className="px-4 py-3 text-left text-gray-600">Category</th>
                  <th className="px-4 py-3 text-left text-gray-600">Amount</th>
                  <th className="px-4 py-3 text-left text-gray-600">Description</th>
                  <th className="px-4 py-3 text-left text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.expense_id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">#{e.expense_id}</td>
                    <td className="px-4 py-3 capitalize">{e.category}</td>
                    <td className="px-4 py-3">PKR {e.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500">{e.description || '—'}</td>
                    <td className="px-4 py-3">{e.expense_date}</td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No expenses found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'add-donation' && (
          <div className="bg-white rounded shadow p-6 max-w-md">
            <h3 className="font-semibold text-gray-700 mb-4">Record Donation</h3>
            <form onSubmit={addDonation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Donor Name *</label>
                <input value={donForm.donor_name} onChange={e => setDonForm(p => ({ ...p, donor_name: e.target.value }))} required
                  className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Donor Type *</label>
                <select value={donForm.donor_type} onChange={e => setDonForm(p => ({ ...p, donor_type: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm">
                  <option value="individual">Individual</option>
                  <option value="organization">Organization</option>
                  <option value="government">Government</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (PKR) *</label>
                <input type="number" step="0.01" value={donForm.amount} onChange={e => setDonForm(p => ({ ...p, amount: e.target.value }))} required
                  className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select value={donForm.payment_method} onChange={e => setDonForm(p => ({ ...p, payment_method: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm">
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="online">Online</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700 disabled:opacity-50">
                {submitting ? 'Saving...' : 'Record Donation'}
              </button>
            </form>
          </div>
        )}

        {tab === 'add-expense' && (
          <div className="bg-white rounded shadow p-6 max-w-md">
            <h3 className="font-semibold text-gray-700 mb-4">Record Expense</h3>
            <form onSubmit={addExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select value={expForm.category} onChange={e => setExpForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm">
                  <option value="procurement">Procurement</option>
                  <option value="logistics">Logistics</option>
                  <option value="medical">Medical</option>
                  <option value="admin">Admin</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (PKR) *</label>
                <input type="number" step="0.01" value={expForm.amount} onChange={e => setExpForm(p => ({ ...p, amount: e.target.value }))} required
                  className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input value={expForm.description} onChange={e => setExpForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input type="date" value={expForm.expense_date} onChange={e => setExpForm(p => ({ ...p, expense_date: e.target.value }))} required
                  className="w-full border rounded px-3 py-2 text-sm" />
              </div>
              <button type="submit" disabled={submitting}
                className="w-full bg-red-600 text-white py-2 rounded font-medium hover:bg-red-700 disabled:opacity-50">
                {submitting ? 'Saving...' : 'Record Expense'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
