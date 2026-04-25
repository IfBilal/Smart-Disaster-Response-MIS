import { NextRequest, NextResponse } from 'next/server'
import { getPool, sql } from '@/lib/db'
import { checkAuth } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const pool = await getPool()
    const result = await pool.request().query(
      `SELECT * FROM vw_ResourceAllocationStatus ORDER BY requested_at DESC`
    )
    return NextResponse.json(result.recordset)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['admin', 'field_officer', 'emergency_operator'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { report_id, resource_id, warehouse_id, qty_requested } = await req.json()

  try {
    const pool = await getPool()

    const allocationResult = await pool.request()
      .input('report_id', sql.Int, report_id)
      .input('resource_id', sql.Int, resource_id)
      .input('warehouse_id', sql.Int, warehouse_id)
      .input('qty', sql.Decimal(12, 2), qty_requested)
      .query(`INSERT INTO ResourceAllocations (report_id, resource_id, warehouse_id, qty_requested)
              VALUES (@report_id, @resource_id, @warehouse_id, @qty);
              SELECT SCOPE_IDENTITY() AS allocation_id`)

    const allocation_id = allocationResult.recordset[0].allocation_id

    // Create approval request automatically
    await pool.request()
      .input('allocation_id', sql.Int, allocation_id)
      .input('requested_by', sql.Int, user.user_id)
      .query(`INSERT INTO ApprovalRequests (allocation_id, request_type, requested_by)
              VALUES (@allocation_id, 'resource_allocation', @requested_by)`)

    return NextResponse.json({ allocation_id }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
