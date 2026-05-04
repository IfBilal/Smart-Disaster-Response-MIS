import { NextRequest, NextResponse } from 'next/server'
import { getPool, sql } from '@/lib/db'
import { checkAuth } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const pool = await getPool()
    const result = await pool.request().query(`
      SELECT w.warehouse_id, w.name, w.location, w.total_capacity, w.created_at,
             u.username AS manager_name
      FROM Warehouses w
      LEFT JOIN Users u ON u.user_id = w.manager_id
      ORDER BY w.name
    `)
    return NextResponse.json(result.recordset)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, location, total_capacity, manager_id } = await req.json()

  if (!name || !location) {
    return NextResponse.json({ error: 'name and location are required' }, { status: 400 })
  }

  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('name',           sql.NVarChar, name)
      .input('location',       sql.NVarChar, location)
      .input('total_capacity', sql.Int,      total_capacity || 0)
      .input('manager_id',     sql.Int,      manager_id || null)
      .query(`
        INSERT INTO Warehouses (name, location, total_capacity, manager_id)
        VALUES (@name, @location, @total_capacity, @manager_id);
        SELECT SCOPE_IDENTITY() AS warehouse_id
      `)
    return NextResponse.json({ warehouse_id: result.recordset[0].warehouse_id }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
