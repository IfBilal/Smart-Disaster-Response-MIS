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

  const tabLabels: Record<string, string> = {
    inventory: 'Inventory',
    allocations: 'Allocations',
    request: 'Request Resources',
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
          {(['inventory', 'allocations', 'request'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
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
                  {['ID', 'Resource', 'Incident', 'Requested', 'Dispatched', 'Status', 'Approved By'].map(h => (
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
                    <td style={{ padding: '12px 16px' }}>
                      <span style={statusBadge(a.status)}>{a.status}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '13px' }}>{a.approved_by_name || '—'}</td>
                  </tr>
                ))}
                {allocations.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px 16px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>
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
                  <label style={labelStyle}>Resource ID *</label>
                  <input type="number" value={requestForm.resource_id}
                    onChange={e => setRequestForm(p => ({ ...p, resource_id: e.target.value }))} required
                    style={inputStyle} placeholder="Enter resource ID" />
                </div>
                <div>
                  <label style={labelStyle}>Warehouse ID *</label>
                  <input type="number" value={requestForm.warehouse_id}
                    onChange={e => setRequestForm(p => ({ ...p, warehouse_id: e.target.value }))} required
                    style={inputStyle} placeholder="Enter warehouse ID" />
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
      </main>
    </div>
  )
}
