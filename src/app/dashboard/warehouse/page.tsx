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
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#070d1c' }}>
      <Navbar username={user.username} role={user.role} />
      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', minWidth: 0 }}>

        {/* Header */}
        <div className="enter" style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
            Warehouse Operations
          </h1>
          <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>
            Inventory levels · dispatch queue
          </p>
        </div>

        {/* Low stock alert banner */}
        {lowStock.length > 0 && (
          <div className="enter-1" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderLeft: '3px solid #f59e0b', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '16px' }}>⚠</span>
            <p style={{ color: '#fbbf24', fontSize: '13px', margin: 0, fontWeight: '500' }}>
              <strong>Low Stock Alert:</strong> {lowStock.length} item{lowStock.length > 1 ? 's' : ''} below threshold level —{' '}
              {lowStock.slice(0, 3).map(i => i.resource_name).join(', ')}{lowStock.length > 3 ? ` +${lowStock.length - 3} more` : ''}
            </p>
          </div>
        )}

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
          <div
            className="enter-2"
            style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderTop: '2px solid #3b82f6', borderRadius: '12px', padding: '18px 20px', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.35)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
          >
            <p style={{ color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>TOTAL SKUs</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#f1f5f9', margin: 0, letterSpacing: '-0.02em' }}>{inventory.length}</p>
          </div>
          <div
            className="enter-3"
            style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderTop: '2px solid #f59e0b', borderRadius: '12px', padding: '18px 20px', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.35)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
          >
            <p style={{ color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>LOW STOCK ITEMS</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: lowStock.length > 0 ? '#fbbf24' : '#f1f5f9', margin: 0, letterSpacing: '-0.02em' }}>{lowStock.length}</p>
          </div>
          <div
            className="enter-4"
            style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderTop: '2px solid #10b981', borderRadius: '12px', padding: '18px 20px', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.35)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
          >
            <p style={{ color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>PENDING DISPATCHES</p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#f1f5f9', margin: 0, letterSpacing: '-0.02em' }}>{pendingDispatch.length}</p>
          </div>
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

          {/* Inventory Table */}
          <div className="enter-5" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9', margin: 0 }}>Inventory Overview</h2>
              <Link href="/resources" style={{ color: '#3b82f6', fontSize: '12px', textDecoration: 'none', fontWeight: '500' }}>Manage →</Link>
            </div>

            <div style={{ overflowY: 'auto', maxHeight: '420px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', position: 'sticky', top: 0, background: '#0c1829' }}>Resource</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', position: 'sticky', top: 0, background: '#0c1829' }}>Warehouse</th>
                    <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', position: 'sticky', top: 0, background: '#0c1829' }}>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.slice(0, 15).map((item, i) => {
                    const isLow = item.is_low_stock === 1
                    return (
                      <tr
                        key={i}
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          transition: 'background 0.15s',
                          background: isLow ? 'rgba(245,158,11,0.04)' : 'transparent',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = isLow ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.025)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = isLow ? 'rgba(245,158,11,0.04)' : 'transparent')}
                      >
                        <td style={{ padding: '11px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isLow && (
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b', flexShrink: 0, boxShadow: '0 0 4px #f59e0b' }} />
                            )}
                            <span style={{ color: isLow ? '#fbbf24' : '#cbd5e1', fontSize: '13px', fontWeight: isLow ? '600' : '400' }}>{item.resource_name}</span>
                          </div>
                          <p style={{ color: '#475569', fontSize: '11px', margin: '2px 0 0', paddingLeft: isLow ? '14px' : '0' }}>{item.resource_type}</p>
                        </td>
                        <td style={{ padding: '11px 12px', color: '#64748b', fontSize: '12px' }}>{item.warehouse_name}</td>
                        <td style={{ padding: '11px 12px', textAlign: 'right' }}>
                          <span style={{
                            background: isLow ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)',
                            color: isLow ? '#fbbf24' : '#34d399',
                            border: `1px solid ${isLow ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`,
                            padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600'
                          }}>
                            {item.quantity_available} {item.unit_of_measure}
                          </span>
                          <p style={{ color: '#475569', fontSize: '11px', margin: '3px 0 0' }}>min: {item.threshold_level}</p>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {inventory.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#475569' }}>
                  <p style={{ fontSize: '13px', margin: 0 }}>No inventory data</p>
                </div>
              )}
            </div>
          </div>

          {/* Pending Dispatch */}
          <div className="enter-6" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9', margin: 0 }}>Pending Dispatch</h2>
              <span style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>{pendingDispatch.length}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
              {pendingDispatch.map(a => (
                <div
                  key={a.allocation_id}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59,130,246,0.25)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.resource_name}</p>
                    <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 2px' }}>Requested: <span style={{ color: '#94a3b8' }}>{a.qty_requested}</span></p>
                    <p style={{ color: '#64748b', fontSize: '11px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.incident_location}</p>
                  </div>
                  <button
                    onClick={() => dispatch(a.allocation_id)}
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 14px rgba(59,130,246,0.3)', transition: 'all 0.2s', flexShrink: 0 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                  >
                    Dispatch
                  </button>
                </div>
              ))}
              {pendingDispatch.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#475569' }}>
                  <p style={{ fontSize: '32px', margin: '0 0 8px' }}>✓</p>
                  <p style={{ fontSize: '13px', margin: 0 }}>No pending dispatches</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="enter-7" style={{ background: '#0c1829', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9', margin: '0 0 14px' }}>Quick Actions</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/resources" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 14px rgba(59,130,246,0.3)', textDecoration: 'none', transition: 'all 0.2s' }}>
              View Full Inventory
            </Link>
            <Link href="/approvals" style={{ background: 'linear-gradient(135deg, #10b981, #047857)', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.3)', textDecoration: 'none', transition: 'all 0.2s' }}>
              Approvals Queue
            </Link>
          </div>
        </div>

      </main>
    </div>
  )
}
