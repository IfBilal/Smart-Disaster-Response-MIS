import { NextRequest, NextResponse } from 'next/server'
import { getPool, sql } from '@/lib/db'
import { checkAuth } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const pool = await getPool()

    // Role-based filtering
    let whereClause = ''
    if (user.role === 'warehouse_manager') {
      whereClause = `AND ar.request_type = 'resource_allocation'`
    } else if (user.role === 'finance_officer') {
      whereClause = `AND ar.request_type = 'financial'`
    }

    const result = await pool.request().query(
      `SELECT * FROM vw_ApprovalQueue WHERE 1=1 ${whereClause} ORDER BY requested_at ASC`
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

  const { allocation_id, request_type, reference_id } = await req.json()

  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('allocation_id', sql.Int, allocation_id || null)
      .input('request_type', sql.NVarChar, request_type)
      .input('reference_id', sql.Int, reference_id || null)
      .input('requested_by', sql.Int, user.user_id)
      .query(`INSERT INTO ApprovalRequests (allocation_id, request_type, reference_id, requested_by)
              VALUES (@allocation_id, @request_type, @reference_id, @requested_by);
              SELECT SCOPE_IDENTITY() AS approval_id`)

    return NextResponse.json({ approval_id: result.recordset[0].approval_id }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
