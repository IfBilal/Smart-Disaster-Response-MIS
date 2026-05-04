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

const statusBadge = (status: string) => {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    pending:    { bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
    approved:   { bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
    dispatched: { bg: 'rgba(16,185,129,0.12)',  color: '#34d399', border: 'rgba(16,185,129,0.3)' },
    consumed:   { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)' },
    rejected:   { bg: 'rgba(239,68,68,0.12)',   color: '#f87171', border: 'rgba(239,68,68,0.3)' },
  }
  const s = map[status] || map.consumed
  return {
    backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`,
    padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' as const, display: 'inline-block',
  }
}

interface Resource { resource_id: number; resource_name: string; resource_type: string; unit_of_measure: string }
interface Warehouse { warehouse_id: number; name: string; location: string; total_capacity: number; manager_name: string }

export default function ResourcesPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [user, setUser] = useState({ username: '', role: '' })
  const [tab, setTab] = useState<'inventory' | 'allocations' | 'request' | 'manage'>('inventory')
  const [showLowStock, setShowLowStock] = useState(false)
  const [requestForm, setRequestForm] = useState({
    report_id: '', resource_id: '', warehouse_id: '', qty_requested: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [newResource, setNewResource] = useState({ resource_name: '', resource_type: 'food', unit_of_measure: 'kg', description: '' })
  const [newWarehouse, setNewWarehouse] = useState({ name: '', location: '', total_capacity: '' })
  const [stockForm, setStockForm] = useState({ warehouse_id: '', resource_id: '', quantity_available: '', threshold_level: '' })
  const [manageSubmitting, setManageSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.username) setUser(d) })
    fetch('/api/resources/inventory').then(r => r.json()).then(d => { if (Array.isArray(d)) setInventory(d) })
    fetch('/api/resources/allocate').then(r => r.json()).then(d => { if (Array.isArray(d)) setAllocations(d) })
    fetch('/api/resources/list').then(r => r.json()).then(d => { if (Array.isArray(d)) setResources(d) })
    fetch('/api/warehouses').then(r => r.json()).then(d => { if (Array.isArray(d)) setWarehouses(d) })
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

  async function createResource(e: React.FormEvent) {
    e.preventDefault()
    setManageSubmitting(true)
    const res = await fetch('/api/resources/list', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newResource),
    })
    setManageSubmitting(false)
    if (res.ok) {
      fetch('/api/resources/list').then(r => r.json()).then(d => { if (Array.isArray(d)) setResources(d) })
      setNewResource({ resource_name: '', resource_type: 'food', unit_of_measure: 'kg', description: '' })
    } else {
      const d = await res.json(); alert(d.error || 'Failed')
    }
  }

  async function createWarehouse(e: React.FormEvent) {
    e.preventDefault()
    setManageSubmitting(true)
    const res = await fetch('/api/warehouses', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newWarehouse, total_capacity: parseInt(newWarehouse.total_capacity) || 0 }),
    })
    setManageSubmitting(false)
    if (res.ok) {
      fetch('/api/warehouses').then(r => r.json()).then(d => { if (Array.isArray(d)) setWarehouses(d) })
      setNewWarehouse({ name: '', location: '', total_capacity: '' })
    } else {
      const d = await res.json(); alert(d.error || 'Failed')
    }
  }

  async function updateStock(e: React.FormEvent) {
    e.preventDefault()
    setManageSubmitting(true)
    const res = await fetch('/api/warehouses/inventory', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        warehouse_id: parseInt(stockForm.warehouse_id),
        resource_id: parseInt(stockForm.resource_id),
        quantity_available: parseFloat(stockForm.quantity_available),
        threshold_level: parseFloat(stockForm.threshold_level) || 0,
      }),
    })
    setManageSubmitting(false)
    if (res.ok) {
      fetch('/api/resources/inventory').then(r => r.json()).then(d => { if (Array.isArray(d)) setInventory(d) })
      setStockForm({ warehouse_id: '', resource_id: '', quantity_available: '', threshold_level: '' })
      alert('Inventory updated')
    } else {
      const d = await res.json(); alert(d.error || 'Failed')
    }
  }

  const canManage = user.role === 'admin' || user.role === 'warehouse_manager'
  const [allocUpdating, setAllocUpdating] = useState<number | null>(null)

  async function updateAllocation(allocationId: number, status: string, qty?: number) {
    setAllocUpdating(allocationId)
    const body: Record<string, unknown> = { status }
    if (status === 'dispatched' && qty) body.qty_dispatched = qty
    if (status === 'consumed' && qty) body.qty_consumed = qty
    const res = await fetch(`/api/resources/allocate/${allocationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setAllocUpdating(null)
    if (res.ok) {
      fetch('/api/resources/allocate').then(r => r.json()).then(d => { if (Array.isArray(d)) setAllocations(d) })
      fetch('/api/resources/inventory').then(r => r.json()).then(d => { if (Array.isArray(d)) setInventory(d) })
    } else {
      const d = await res.json(); alert(d.error || 'Failed')
    }
  }

  const tabLabels: Record<string, string> = {
    inventory: 'Inventory',
    allocations: 'Allocations',
    request: 'Request Resources',
    manage: 'Manage',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: '600', color: '#64748b',
    textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#070d1c' }}>
      <Navbar username={user.username} role={user.role} />

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', minWidth: 0 }}>
        <div className="enter" style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
            Resource Management
          </h1>
          <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>
            Warehouse inventory, allocations, and resource dispatch requests
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', padding: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', marginBottom: '24px', width: 'fit-content' }}>
          {(['inventory', 'allocations', 'request', ...(canManage ? ['manage'] : [])] as const).map(t => (
            <button key={t} onClick={() => setTab(t as typeof tab)} style={{
              padding: '7px 16px', borderRadius: '7px', fontSize: '13px',
              fontWeight: tab === t ? '600' : '400', border: 'none', cursor: 'pointer',
              background: tab === t ? 'rgba(59,130,246,0.18)' : 'transparent',
              color: tab === t ? '#60a5fa' : '#64748b', transition: 'all 0.18s',
            }}>
              {tabLabels[t]}
            </button>
          ))}
        </div>

        {/* Inventory Tab */}
        {tab === 'inventory' && (
          <div className="enter-1" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: '600' }}>Warehouse Inventory</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#64748b' }}>
                <input
                  type="checkbox"
                  checked={showLowStock}
                  onChange={e => setShowLowStock(e.target.checked)}
                  style={{ accentColor: '#f59e0b', width: '14px', height: '14px' }}
                />
                <span style={{ color: showLowStock ? '#fbbf24' : '#64748b' }}>Low stock only</span>
              </label>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Resource', 'Type', 'Warehouse', 'Available', 'Threshold', 'Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayInventory.map((item, i) => (
                  <tr key={i}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      transition: 'background 0.15s',
                      ...(item.is_low_stock === 1
                        ? { backgroundColor: 'rgba(245,158,11,0.06)', borderLeft: '3px solid #f59e0b' }
                        : {}),
                    }}
                    onMouseEnter={e => { if (item.is_low_stock !== 1) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.025)' }}
                    onMouseLeave={e => { if (item.is_low_stock !== 1) e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <td style={{ padding: '12px 16px', color: '#f1f5f9', fontSize: '13px', fontWeight: '500' }}>{item.resource_name}</td>
                    <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', textTransform: 'capitalize' }}>{item.resource_type}</td>
                    <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px' }}>{item.warehouse_name}</td>
                    <td style={{ padding: '12px 16px', color: '#cbd5e1', fontSize: '13px' }}>{item.quantity_available} {item.unit_of_measure}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '13px' }}>{item.threshold_level}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {item.is_low_stock === 1 ? (
                        <span style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', display: 'inline-block' }}>
                          Low Stock
                        </span>
                      ) : (
                        <span style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', display: 'inline-block' }}>
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {displayInventory.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>
                      No inventory data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Allocations Tab */}
        {tab === 'allocations' && (
          <div className="enter-1" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: '600' }}>Resource Allocations</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['ID', 'Resource', 'Incident', 'Requested', 'Dispatched', 'Consumed', 'Status', 'Approved By', ...(canManage ? ['Actions'] : [])].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allocations.map(a => (
                  <tr key={a.allocation_id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.025)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '12px 16px', color: '#475569', fontSize: '13px' }}>#{a.allocation_id}</td>
                    <td style={{ padding: '12px 16px', color: '#f1f5f9', fontSize: '13px', fontWeight: '500' }}>{a.resource_name}</td>
                    <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px' }}>{a.incident_location}</td>
                    <td style={{ padding: '12px 16px', color: '#cbd5e1', fontSize: '13px' }}>{a.qty_requested} {a.unit_of_measure}</td>
                    <td style={{ padding: '12px 16px', color: '#cbd5e1', fontSize: '13px' }}>{a.qty_dispatched}</td>
                    <td style={{ padding: '12px 16px', color: '#cbd5e1', fontSize: '13px' }}>{a.qty_consumed}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={statusBadge(a.status)}>{a.status}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '13px' }}>{a.approved_by_name || '—'}</td>
                    {canManage && (
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {a.status === 'approved' && (
                            <button
                              disabled={allocUpdating === a.allocation_id}
                              onClick={() => updateAllocation(a.allocation_id, 'dispatched', a.qty_requested)}
                              style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.1)', color: '#34d399', cursor: 'pointer', fontWeight: '600' }}>
                              {allocUpdating === a.allocation_id ? '...' : 'Dispatch'}
                            </button>
                          )}
                          {a.status === 'dispatched' && (
                            <button
                              disabled={allocUpdating === a.allocation_id}
                              onClick={() => updateAllocation(a.allocation_id, 'consumed', a.qty_dispatched)}
                              style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(100,116,139,0.4)', background: 'rgba(100,116,139,0.1)', color: '#94a3b8', cursor: 'pointer', fontWeight: '600' }}>
                              {allocUpdating === a.allocation_id ? '...' : 'Mark Consumed'}
                            </button>
                          )}
                          {(a.status === 'pending' || a.status === 'approved') && (
                            <button
                              disabled={allocUpdating === a.allocation_id}
                              onClick={() => updateAllocation(a.allocation_id, 'rejected')}
                              style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.07)', color: '#f87171', cursor: 'pointer', fontWeight: '600' }}>
                              {allocUpdating === a.allocation_id ? '...' : 'Reject'}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {allocations.length === 0 && (
                  <tr>
                    <td colSpan={canManage ? 9 : 8} style={{ padding: '40px 16px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>
                      No allocations found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Request Tab */}
        {tab === 'request' && (
          <div className="enter-1">
            <div style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '24px', maxWidth: '520px' }}>
              <h3 style={{ color: '#f1f5f9', fontSize: '15px', fontWeight: '600', margin: '0 0 20px' }}>Request Resource Allocation</h3>
              <form onSubmit={submitRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Report ID *</label>
                  <input type="number" value={requestForm.report_id}
                    onChange={e => setRequestForm(p => ({ ...p, report_id: e.target.value }))} required
                    style={inputStyle} placeholder="Enter emergency report ID" />
                </div>
                <div>
                  <label style={labelStyle}>Resource *</label>
                  <select value={requestForm.resource_id}
                    onChange={e => setRequestForm(p => ({ ...p, resource_id: e.target.value }))} required style={inputStyle}>
                    <option value="">Select resource</option>
                    {resources.map(r => (
                      <option key={r.resource_id} value={r.resource_id}>
                        {r.resource_name} ({r.resource_type} · {r.unit_of_measure})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Warehouse *</label>
                  <select value={requestForm.warehouse_id}
                    onChange={e => setRequestForm(p => ({ ...p, warehouse_id: e.target.value }))} required style={inputStyle}>
                    <option value="">Select warehouse</option>
                    {warehouses.map(w => (
                      <option key={w.warehouse_id} value={w.warehouse_id}>
                        {w.name} — {w.location}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Quantity *</label>
                  <input type="number" step="0.01" value={requestForm.qty_requested}
                    onChange={e => setRequestForm(p => ({ ...p, qty_requested: e.target.value }))} required
                    style={inputStyle} placeholder="Enter quantity" />
                </div>
                <button type="submit" disabled={submitting} style={{
                  background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: '#fff', border: 'none',
                  padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                  cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
                  transition: 'all 0.2s', opacity: submitting ? 0.6 : 1, width: '100%',
                }}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
              <p style={{ fontSize: '12px', color: '#475569', marginTop: '12px' }}>
                * Request will be sent to admin for approval before dispatch.
              </p>
            </div>
          </div>
        )}

        {/* Manage Tab */}
        {tab === 'manage' && canManage && (
          <div className="enter-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

            {/* Add Resource */}
            <div style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 18px' }}>Add Resource Type</h3>
              <form onSubmit={createResource} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Resource Name *</label>
                  <input value={newResource.resource_name} onChange={e => setNewResource(p => ({ ...p, resource_name: e.target.value }))} required placeholder="e.g. Rice" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Type *</label>
                    <select value={newResource.resource_type} onChange={e => setNewResource(p => ({ ...p, resource_type: e.target.value }))}>
                      {['food','water','medicine','shelter','equipment'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Unit *</label>
                    <select value={newResource.unit_of_measure} onChange={e => setNewResource(p => ({ ...p, unit_of_measure: e.target.value }))}>
                      {['kg','litre','unit','box'].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Description</label>
                  <input value={newResource.description} onChange={e => setNewResource(p => ({ ...p, description: e.target.value }))} placeholder="Optional" />
                </div>
                <button type="submit" disabled={manageSubmitting}
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', border: 'none', padding: '9px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', opacity: manageSubmitting ? 0.6 : 1 }}>
                  Add Resource
                </button>
              </form>
            </div>

            {/* Add Warehouse (admin only) */}
            {user.role === 'admin' && (
              <div style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 18px' }}>Add Warehouse</h3>
                <form onSubmit={createWarehouse} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={labelStyle}>Name *</label>
                    <input value={newWarehouse.name} onChange={e => setNewWarehouse(p => ({ ...p, name: e.target.value }))} required placeholder="e.g. North Warehouse" />
                  </div>
                  <div>
                    <label style={labelStyle}>Location *</label>
                    <input value={newWarehouse.location} onChange={e => setNewWarehouse(p => ({ ...p, location: e.target.value }))} required placeholder="e.g. Rawalpindi" />
                  </div>
                  <div>
                    <label style={labelStyle}>Total Capacity</label>
                    <input type="number" value={newWarehouse.total_capacity} onChange={e => setNewWarehouse(p => ({ ...p, total_capacity: e.target.value }))} placeholder="0" min="0" />
                  </div>
                  <button type="submit" disabled={manageSubmitting}
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', border: 'none', padding: '9px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', opacity: manageSubmitting ? 0.6 : 1 }}>
                    Create Warehouse
                  </button>
                </form>
              </div>
            )}

            {/* Update Stock */}
            <div style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '24px', gridColumn: user.role === 'admin' ? '1/-1' : undefined }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 18px' }}>Set Inventory Level</h3>
              <form onSubmit={updateStock} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Warehouse *</label>
                  <select value={stockForm.warehouse_id} onChange={e => setStockForm(p => ({ ...p, warehouse_id: e.target.value }))} required>
                    <option value="">Select warehouse</option>
                    {warehouses.map(w => <option key={w.warehouse_id} value={w.warehouse_id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Resource *</label>
                  <select value={stockForm.resource_id} onChange={e => setStockForm(p => ({ ...p, resource_id: e.target.value }))} required>
                    <option value="">Select resource</option>
                    {resources.map(r => <option key={r.resource_id} value={r.resource_id}>{r.resource_name} ({r.unit_of_measure})</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Quantity Available *</label>
                  <input type="number" step="0.01" min="0" value={stockForm.quantity_available} onChange={e => setStockForm(p => ({ ...p, quantity_available: e.target.value }))} required placeholder="0" />
                </div>
                <div>
                  <label style={labelStyle}>Low-Stock Threshold</label>
                  <input type="number" step="0.01" min="0" value={stockForm.threshold_level} onChange={e => setStockForm(p => ({ ...p, threshold_level: e.target.value }))} placeholder="0" />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <button type="submit" disabled={manageSubmitting}
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '9px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', opacity: manageSubmitting ? 0.6 : 1 }}>
                    {manageSubmitting ? 'Saving...' : 'Update Stock'}
                  </button>
                </div>
              </form>
            </div>

          </div>
        )}
      </main>
    </div>
  )
}
