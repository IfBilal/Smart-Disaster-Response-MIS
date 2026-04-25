'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'

interface InventoryItem {
  warehouse_id: number
  resource_id: number
  warehouse_name: string
  location: string
  resource_name: string
  resource_type: string
  unit_of_measure: string
  quantity_available: number
  threshold_level: number
  is_low_stock: number
  last_updated: string
}

interface Allocation {
  allocation_id: number
  disaster_type: string
  incident_location: string
  resource_name: string
  resource_type: string
  unit_of_measure: string
  warehouse_name: string
  qty_requested: number
  qty_dispatched: number
  qty_consumed: number
  qty_pending_dispatch: number
  status: string
  requested_at: string
  approved_by_name: string
}

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  dispatched: 'bg-green-100 text-green-700',
  consumed: 'bg-gray-100 text-gray-600',
  rejected: 'bg-red-100 text-red-700',
}

export default function ResourcesPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [user, setUser] = useState({ username: '', role: '' })
  const [tab, setTab] = useState<'inventory' | 'allocations' | 'request'>('inventory')
  const [showLowStock, setShowLowStock] = useState(false)
  const [requestForm, setRequestForm] = useState({
    report_id: '', resource_id: '', warehouse_id: '', qty_requested: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.username) setUser(d) })
    fetch('/api/resources/inventory').then(r => r.json()).then(d => { if (Array.isArray(d)) setInventory(d) })
    fetch('/api/resources/allocate').then(r => r.json()).then(d => { if (Array.isArray(d)) setAllocations(d) })
  }, [])

  const displayInventory = showLowStock ? inventory.filter(i => i.is_low_stock === 1) : inventory

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const res = await fetch('/api/resources/allocate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        report_id: parseInt(requestForm.report_id),
        resource_id: parseInt(requestForm.resource_id),
        warehouse_id: parseInt(requestForm.warehouse_id),
        qty_requested: parseFloat(requestForm.qty_requested),
      }),
    })
    setSubmitting(false)
    if (res.ok) {
      alert('Resource allocation request submitted for approval')
      setTab('allocations')
      fetch('/api/resources/allocate').then(r => r.json()).then(d => { if (Array.isArray(d)) setAllocations(d) })
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to submit request')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar username={user.username} role={user.role} />

      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Resource Management</h2>

        <div className="flex gap-2 mb-6">
          {(['inventory', 'allocations', 'request'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded text-sm font-medium ${tab === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
              {t === 'inventory' ? 'Inventory' : t === 'allocations' ? 'Allocations' : 'Request Resources'}
            </button>
          ))}
        </div>

        {tab === 'inventory' && (
          <div className="bg-white rounded shadow overflow-hidden">
            <div className="p-4 flex justify-between items-center border-b">
              <h3 className="font-semibold text-gray-700">Warehouse Inventory</h3>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={showLowStock} onChange={e => setShowLowStock(e.target.checked)} />
                Show low stock only
              </label>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600">Resource</th>
                  <th className="px-4 py-3 text-left text-gray-600">Type</th>
                  <th className="px-4 py-3 text-left text-gray-600">Warehouse</th>
                  <th className="px-4 py-3 text-left text-gray-600">Available</th>
                  <th className="px-4 py-3 text-left text-gray-600">Threshold</th>
                  <th className="px-4 py-3 text-left text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {displayInventory.map((item, i) => (
                  <tr key={i} className={`border-b hover:bg-gray-50 ${item.is_low_stock ? 'bg-yellow-50' : ''}`}>
                    <td className="px-4 py-3 font-medium">{item.resource_name}</td>
                    <td className="px-4 py-3 capitalize text-gray-500">{item.resource_type}</td>
                    <td className="px-4 py-3 text-gray-500">{item.warehouse_name}</td>
                    <td className="px-4 py-3">{item.quantity_available} {item.unit_of_measure}</td>
                    <td className="px-4 py-3 text-gray-500">{item.threshold_level}</td>
                    <td className="px-4 py-3">
                      {item.is_low_stock === 1
                        ? <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded">Low Stock</span>
                        : <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">OK</span>
                      }
                    </td>
                  </tr>
                ))}
                {displayInventory.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No inventory data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'allocations' && (
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600">ID</th>
                  <th className="px-4 py-3 text-left text-gray-600">Resource</th>
                  <th className="px-4 py-3 text-left text-gray-600">Incident</th>
                  <th className="px-4 py-3 text-left text-gray-600">Requested</th>
                  <th className="px-4 py-3 text-left text-gray-600">Dispatched</th>
                  <th className="px-4 py-3 text-left text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-gray-600">Approved By</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map(a => (
                  <tr key={a.allocation_id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">#{a.allocation_id}</td>
                    <td className="px-4 py-3 font-medium">{a.resource_name}</td>
                    <td className="px-4 py-3 text-gray-500">{a.incident_location}</td>
                    <td className="px-4 py-3">{a.qty_requested} {a.unit_of_measure}</td>
                    <td className="px-4 py-3">{a.qty_dispatched}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${statusColor[a.status] || ''}`}>{a.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{a.approved_by_name || '—'}</td>
                  </tr>
                ))}
                {allocations.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">No allocations found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'request' && (
          <div className="bg-white rounded shadow p-6 max-w-md">
            <h3 className="font-semibold text-gray-700 mb-4">Request Resource Allocation</h3>
            <form onSubmit={submitRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report ID *</label>
                <input type="number" value={requestForm.report_id}
                  onChange={e => setRequestForm(p => ({ ...p, report_id: e.target.value }))} required
                  className="w-full border rounded px-3 py-2 text-sm" placeholder="Enter emergency report ID" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resource ID *</label>
                <input type="number" value={requestForm.resource_id}
                  onChange={e => setRequestForm(p => ({ ...p, resource_id: e.target.value }))} required
                  className="w-full border rounded px-3 py-2 text-sm" placeholder="Enter resource ID" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse ID *</label>
                <input type="number" value={requestForm.warehouse_id}
                  onChange={e => setRequestForm(p => ({ ...p, warehouse_id: e.target.value }))} required
                  className="w-full border rounded px-3 py-2 text-sm" placeholder="Enter warehouse ID" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input type="number" step="0.01" value={requestForm.qty_requested}
                  onChange={e => setRequestForm(p => ({ ...p, qty_requested: e.target.value }))} required
                  className="w-full border rounded px-3 py-2 text-sm" placeholder="Enter quantity" />
              </div>
              <button type="submit" disabled={submitting}
                className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
            <p className="text-xs text-gray-400 mt-3">
              * Request will be sent to admin for approval before dispatch.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
