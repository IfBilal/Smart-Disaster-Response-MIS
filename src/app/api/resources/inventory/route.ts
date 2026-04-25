import { NextRequest, NextResponse } from 'next/server'
import { getPool, sql } from '@/lib/db'
import { checkAuth } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const low_stock = searchParams.get('low_stock')

  let extraWhere = low_stock === '1' ? 'WHERE is_low_stock = 1' : ''

  try {
    const pool = await getPool()
    const result = await pool.request().query(
      `SELECT * FROM vw_WarehouseInventorySummary ${extraWhere} ORDER BY is_low_stock DESC, warehouse_name`
    )
    return NextResponse.json(result.recordset)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
