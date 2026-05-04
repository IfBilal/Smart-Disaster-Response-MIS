import { NextRequest, NextResponse } from 'next/server'
import { getPool, sql } from '@/lib/db'
import { checkAuth } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const pool = await getPool()
    const result = await pool.request().query(`
      SELECT resource_id, resource_name, resource_type, unit_of_measure
      FROM Resources ORDER BY resource_name
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
  if (!['admin', 'warehouse_manager'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { resource_name, resource_type, unit_of_measure, description } = await req.json()

  if (!resource_name || !resource_type || !unit_of_measure) {
    return NextResponse.json({ error: 'resource_name, resource_type, and unit_of_measure are required' }, { status: 400 })
  }

  const validTypes = ['food', 'water', 'medicine', 'shelter', 'equipment']
  const validUnits = ['kg', 'litre', 'unit', 'box']
  if (!validTypes.includes(resource_type)) return NextResponse.json({ error: `resource_type must be one of: ${validTypes.join(', ')}` }, { status: 400 })
  if (!validUnits.includes(unit_of_measure)) return NextResponse.json({ error: `unit_of_measure must be one of: ${validUnits.join(', ')}` }, { status: 400 })

  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('name',        sql.NVarChar, resource_name)
      .input('type',        sql.NVarChar, resource_type)
      .input('unit',        sql.NVarChar, unit_of_measure)
      .input('description', sql.NVarChar, description || null)
      .query(`
        INSERT INTO Resources (resource_name, resource_type, unit_of_measure, description)
        VALUES (@name, @type, @unit, @description);
        SELECT SCOPE_IDENTITY() AS resource_id
      `)
    return NextResponse.json({ resource_id: result.recordset[0].resource_id }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
