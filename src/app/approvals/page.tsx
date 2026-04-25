'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'

interface Approval {
  approval_id: number
  request_type: string
  reference_id: number
  status: string
  requested_at: string
  remarks: string
  requested_by_name: string
  requested_by_role: string
  reviewed_by_name: string
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [user, setUser] = useState({ username: '', role: '' })
  const [remarks, setRemarks] = useState<Record<number, string>>({})
  const [processing, setProcessing] = useState<number | null>(null)

  function load() {
    fetch('/api/approvals').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setApprovals(d)
    })
  }

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.username) setUser(d) })
    load()
  }, [])

  async function review(approvalId: number, decision: 'approved' | 'rejected') {
    if (!confirm(`${decision === 'approved' ? 'Approve' : 'Reject'} this request?`)) return
    setProcessing(approvalId)
    const res = await fetch(`/api/approvals/${approvalId}/review`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: decision, remarks: remarks[approvalId] || '' }),
    })
    setProcessing(null)
    if (res.ok) {
      load()
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to process request')
    }
  }

  const canReview = user.role === 'admin' || user.role === 'warehouse_manager' || user.role === 'finance_officer'
  const typeColor: Record<string, string> = {
    resource_allocation: 'bg-blue-100 text-blue-700',
    financial: 'bg-green-100 text-green-700',
    deployment: 'bg-purple-100 text-purple-700',
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar username={user.username} role={user.role} />

      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Approvals Queue</h2>

        {approvals.length === 0 ? (
          <div className="bg-white rounded shadow p-8 text-center text-gray-400">
            No pending approval requests
          </div>
        ) : (
          <div className="space-y-4">
            {approvals.map(a => (
              <div key={a.approval_id} className="bg-white rounded shadow p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-800">#{a.approval_id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${typeColor[a.request_type] || 'bg-gray-100 text-gray-600'}`}>
                        {a.request_type.replace('_', ' ')}
                      </span>
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">{a.status}</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Requested by: <strong>{a.requested_by_name}</strong> ({a.requested_by_role.replace('_', ' ')})
                    </p>
                    <p className="text-xs text-gray-400">{new Date(a.requested_at).toLocaleString()}</p>
                    {a.reference_id && <p className="text-xs text-gray-500 mt-1">Reference ID: #{a.reference_id}</p>}
                    {a.remarks && <p className="text-xs text-gray-500 mt-1 italic">{a.remarks}</p>}
                  </div>
                </div>

                {canReview && a.status === 'pending' && (
                  <div className="border-t pt-3 flex gap-3 items-center">
                    <input
                      type="text"
                      placeholder="Remarks (optional)"
                      value={remarks[a.approval_id] || ''}
                      onChange={e => setRemarks(prev => ({ ...prev, [a.approval_id]: e.target.value }))}
                      className="flex-1 border rounded px-3 py-1.5 text-sm"
                    />
                    <button
                      onClick={() => review(a.approval_id, 'approved')}
                      disabled={processing === a.approval_id}
                      className="bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => review(a.approval_id, 'rejected')}
                      disabled={processing === a.approval_id}
                      className="bg-red-600 text-white px-4 py-1.5 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
