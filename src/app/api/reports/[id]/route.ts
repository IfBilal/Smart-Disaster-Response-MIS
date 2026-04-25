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
      .input('id', sql.Int, parseInt(id))
      .query(`
        SELECT r.*, c.full_name, c.phone, c.cnic, u.username AS operator
        FROM EmergencyReports r
        JOIN Citizens c ON c.citizen_id = r.citizen_id
        LEFT JOIN Users u ON u.user_id = r.operator_id
        WHERE r.report_id = @id
      `)

    if (!result.recordset[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Get assignments
    const assignments = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query(`SELECT ta.*, rt.team_name, rt.team_type FROM TeamAssignments ta
              JOIN RescueTeams rt ON rt.team_id = ta.team_id
              WHERE ta.report_id = @id`)

    // Get allocations
    const allocations = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query(`SELECT ra.*, r.resource_name, w.name AS warehouse
              FROM ResourceAllocations ra
              JOIN Resources r ON r.resource_id = ra.resource_id
              JOIN Warehouses w ON w.warehouse_id = ra.warehouse_id
              WHERE ra.report_id = @id`)

    return NextResponse.json({
      ...result.recordset[0],
      assignments: assignments.recordset,
      allocations: allocations.recordset,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['admin', 'emergency_operator'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { status } = await req.json()

  try {
    const pool = await getPool()
    await pool.request()
      .input('status', sql.NVarChar, status)
      .input('id', sql.Int, parseInt(id))
      .input('operator_id', sql.Int, user.user_id)
      .query(`UPDATE EmergencyReports
              SET status = @status,
                  operator_id = @operator_id,
                  resolved_at = CASE WHEN @status IN ('resolved','closed') THEN GETDATE() ELSE resolved_at END
              WHERE report_id = @id`)

    return NextResponse.json({ message: 'Updated' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
