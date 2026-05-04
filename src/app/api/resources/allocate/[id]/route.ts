import { NextRequest, NextResponse } from 'next/server'
import { getPool, sql } from '@/lib/db'
import { checkAuth } from '@/lib/rbac'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['admin', 'warehouse_manager'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const { status, qty_dispatched, qty_consumed } = body

  const validStatuses = ['approved', 'dispatched', 'consumed', 'rejected']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  try {
    const pool = await getPool()

    const check = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query(`SELECT status, qty_requested FROM ResourceAllocations WHERE allocation_id = @id`)

    if (!check.recordset[0]) {
      return NextResponse.json({ error: 'Allocation not found.' }, { status: 404 })
    }

    const current = check.recordset[0]

    if (status === 'dispatched') {
      if (current.status !== 'approved') {
        return NextResponse.json({ error: `Must be approved before dispatch. Current: ${current.status}` }, { status: 400 })
      }
      const qty = qty_dispatched || current.qty_requested
      await pool.request()
        .input('id', sql.Int, parseInt(id))
        .input('qty', sql.Decimal(12, 2), qty)
        .query(`UPDATE ResourceAllocations SET status='dispatched', qty_dispatched=@qty WHERE allocation_id=@id`)
    } else if (status === 'consumed') {
      if (current.status !== 'dispatched') {
        return NextResponse.json({ error: `Must be dispatched before consumed. Current: ${current.status}` }, { status: 400 })
      }
      const qty = qty_consumed || current.qty_requested
      await pool.request()
        .input('id', sql.Int, parseInt(id))
        .input('qty', sql.Decimal(12, 2), qty)
        .query(`UPDATE ResourceAllocations SET status='consumed', qty_consumed=@qty WHERE allocation_id=@id`)
    } else if (status === 'rejected') {
      await pool.request()
        .input('id', sql.Int, parseInt(id))
        .query(`UPDATE ResourceAllocations SET status='rejected' WHERE allocation_id=@id AND status IN ('pending','approved')`)
    } else {
      await pool.request()
        .input('id', sql.Int, parseInt(id))
        .input('status', sql.NVarChar, status)
        .query(`UPDATE ResourceAllocations SET status=@status WHERE allocation_id=@id`)
    }

    return NextResponse.json({ message: `Allocation updated to ${status}` })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
