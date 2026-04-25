import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { checkAuth } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const table = searchParams.get('table')
  const action = searchParams.get('action')

  let where = 'WHERE 1=1'
  if (table) where += ` AND table_affected = '${table}'`
  if (action) where += ` AND action_type = '${action}'`

  try {
    const pool = await getPool()
    const result = await pool.request().query(
      `SELECT TOP 200 * FROM vw_AuditSummary ${where} ORDER BY action_timestamp DESC`
    )
    return NextResponse.json(result.recordset)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
