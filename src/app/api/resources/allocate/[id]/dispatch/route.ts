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
  const { qty_dispatched } = await req.json()

  try {
    const pool = await getPool()

    // Transaction A: dispatch resources — trigger deducts from inventory
    await pool.request()
      .input('id', sql.Int, parseInt(id))
      .input('qty', sql.Decimal(12, 2), qty_dispatched)
      .input('approved_by', sql.Int, user.user_id)
      .query(`
        UPDATE ResourceAllocations
        SET status = 'dispatched', qty_dispatched = @qty, approved_by = @approved_by
        WHERE allocation_id = @id AND status = 'approved';
      `)

    return NextResponse.json({ message: 'Resources dispatched' })
  } catch (err: unknown) {
    console.error(err)
    const msg = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
