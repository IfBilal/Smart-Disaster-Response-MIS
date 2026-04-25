'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

interface InventoryItem {
  warehouse_name: string
  resource_name: string
  resource_type: string
  unit_of_measure: string
  quantity_available: number
  threshold_level: number
  is_low_stock: number
}

interface Allocation {
  allocation_id: number
  resource_name: string
  qty_requested: number
  qty_dispatched: number
  status: string
  incident_location: string
}

export default function WarehouseDashboard() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [pendingDispatch, setPendingDispatch] = useState<Allocation[]>([])
  const [user, setUser] = useState({ username: '', role: 'warehouse_manager' })

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.username) setUser(d) })

    fetch('/api/resources/inventory').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setInventory(d)
    })

    fetch('/api/resources/allocate').then(r => r.json()).then(d => {
      if (Array.isArray(d)) {
        setPendingDispatch(d.filter((a: Allocation) => a.status === 'approved').slice(0, 10))
      }
    })
  }, [])

  const lowStock = inventory.filter(i => i.is_low_stock === 1)

  async function dispatch(allocationId: number) {
    const qty = prompt('Enter quantity to dispatch:')
    if (!qty) return
    const res = await fetch(`/api/resources/allocate/${allocationId}/dispatch`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qty_dispatched: parseFloat(qty) }),
    })
    if (res.ok) {
      alert('Dispatched successfully')
      fetch('/api/resources/allocate').then(r => r.json()).then(d => {
        if (Array.isArray(d)) setPendingDispatch(d.filter((a: Allocation) => a.status === 'approved').slice(0, 10))
      })
    } else {
      const data = await res.json()
      alert(data.error || 'Dispatch failed')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar username={user.username} role={user.role} />

      <div className="max-w-6xl mx-auto p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Warehouse Manager Dashboard</h2>

        {lowStock.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-300 rounded p-3 mb-6 text-sm text-yellow-800">
            <strong>Low Stock Alert:</strong> {lowStock.length} item(s) below threshold level.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded shadow p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-700">Inventory Overview</h3>
              <Link href="/resources" className="text-blue-600 text-xs hover:underline">Manage →</Link>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {inventory.slice(0, 15).map((item, i) => (
                <div key={i} className={`border rounded p-2 text-sm ${item.is_low_stock ? 'border-yellow-300 bg-yellow-50' : ''}`}>
                  <div className="flex justify-between">
                    <span className="font-medium">{item.resource_name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${item.is_low_stock ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {item.quantity_available} {item.unit_of_measure}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{item.warehouse_name} • Threshold: {item.threshold_level}</p>
                </div>
              ))}
              {inventory.length === 0 && <p className="text-sm text-gray-400">No inventory data</p>}
            </div>
          </div>

          <div className="bg-white rounded shadow p-4">
            <h3 className="font-semibold text-gray-700 mb-3">Pending Dispatch ({pendingDispatch.length})</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {pendingDispatch.map(a => (
                <div key={a.allocation_id} className="border rounded p-3 text-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{a.resource_name}</p>
                      <p className="text-xs text-gray-500">Requested: {a.qty_requested} | Location: {a.incident_location}</p>
                    </div>
                    <button
                      onClick={() => dispatch(a.allocation_id)}
                      className="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Dispatch
                    </button>
                  </div>
                </div>
              ))}
              {pendingDispatch.length === 0 && <p className="text-sm text-gray-400">No pending dispatches</p>}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Quick Actions</h3>
          <div className="flex gap-3">
            <Link href="/resources" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
              View Full Inventory
            </Link>
            <Link href="/approvals" className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">
              Approvals Queue
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
