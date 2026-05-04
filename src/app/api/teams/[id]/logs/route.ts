import { NextRequest, NextResponse } from 'next/server'
import { getPool, sql } from '@/lib/db'
import { checkAuth } from '@/lib/rbac'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('team_id', sql.Int, parseInt(id))
      .query(`
        SELECT dl.team_id, dl.log_id, dl.status_update, dl.location_update,
               dl.logged_at, w.name AS warehouse_name
        FROM DispatchLogs dl
        LEFT JOIN Warehouses w ON w.warehouse_id = dl.warehouse_id
        WHERE dl.team_id = @team_id
        ORDER BY dl.log_id DESC
      `)
    return NextResponse.json(result.recordset)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
