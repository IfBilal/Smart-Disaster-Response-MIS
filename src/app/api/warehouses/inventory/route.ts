import { NextRequest, NextResponse } from 'next/server'
import { getPool, sql } from '@/lib/db'
import { checkAuth } from '@/lib/rbac'

// PUT — add stock or update threshold for a warehouse/resource pair
export async function PUT(req: NextRequest) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['admin', 'warehouse_manager'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { warehouse_id, resource_id, quantity_available, threshold_level } = await req.json()

  if (!warehouse_id || !resource_id) {
    return NextResponse.json({ error: 'warehouse_id and resource_id are required' }, { status: 400 })
  }
  if (quantity_available < 0) {
    return NextResponse.json({ error: 'quantity_available cannot be negative' }, { status: 400 })
  }

  try {
    const pool = await getPool()

    // MERGE — insert if not exists, update if exists
    await pool.request()
      .input('warehouse_id',       sql.Int,          warehouse_id)
      .input('resource_id',        sql.Int,          resource_id)
      .input('quantity_available', sql.Decimal(12,2), quantity_available ?? 0)
      .input('threshold_level',    sql.Decimal(12,2), threshold_level ?? 0)
      .query(`
        MERGE WarehouseInventory AS target
        USING (SELECT @warehouse_id AS warehouse_id, @resource_id AS resource_id) AS source
        ON target.warehouse_id = source.warehouse_id AND target.resource_id = source.resource_id
        WHEN MATCHED THEN
          UPDATE SET quantity_available = @quantity_available,
                     threshold_level    = @threshold_level,
                     last_updated       = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (warehouse_id, resource_id, quantity_available, threshold_level, last_updated)
          VALUES (@warehouse_id, @resource_id, @quantity_available, @threshold_level, GETDATE());
      `)

    return NextResponse.json({ message: 'Inventory updated' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
