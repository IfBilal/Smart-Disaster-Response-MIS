import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { checkAuth } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const pool = await getPool()
    const result = await pool.request().query(`
      SELECT r.resource_name, r.resource_type,
             SUM(ra.qty_requested)  AS total_requested,
             SUM(ra.qty_dispatched) AS total_dispatched,
             SUM(ra.qty_consumed)   AS total_consumed
      FROM ResourceAllocations ra
      JOIN Resources r ON r.resource_id = ra.resource_id
      WHERE ra.status IN ('dispatched', 'consumed')
      GROUP BY r.resource_name, r.resource_type
      ORDER BY total_dispatched DESC
    `)
    return NextResponse.json(result.recordset)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
