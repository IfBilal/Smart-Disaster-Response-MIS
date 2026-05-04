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
        SELECT r.*, c.full_name AS citizen_name, c.phone AS citizen_phone, c.cnic, u.username AS assigned_operator
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

    // Budget summary from view
    const budget = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query(`SELECT * FROM vw_BudgetPerEvent WHERE report_id = @id`)

    return NextResponse.json({
      ...result.recordset[0],
      assignments: assignments.recordset,
      allocations: allocations.recordset,
      budget: budget.recordset[0] || null,
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
  const body = await req.json()
  const { status, severity_level } = body

  const validStatuses   = ['pending', 'in_progress', 'resolved', 'closed']
  const validSeverities = ['low', 'medium', 'high', 'critical']

  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  if (severity_level && !validSeverities.includes(severity_level)) {
    return NextResponse.json({ error: 'Invalid severity_level' }, { status: 400 })
  }

  try {
    const pool = await getPool()

    if (status === 'in_progress') {
      const check = await pool.request()
        .input('id', sql.Int, parseInt(id))
        .query(`SELECT COUNT(*) AS cnt FROM TeamAssignments WHERE report_id = @id`)
      if (check.recordset[0].cnt === 0) {
        return NextResponse.json({ error: 'Cannot mark in_progress: no rescue team has been assigned to this report.' }, { status: 400 })
      }
    }

    // Build dynamic SET clause
    const setParts: string[] = ['operator_id = @operator_id']
    if (status) {
      setParts.push('status = @status')
      setParts.push("resolved_at = CASE WHEN @status IN ('resolved','closed') THEN GETDATE() ELSE resolved_at END")
    }
    if (severity_level) setParts.push('severity_level = @severity_level')

    const req2 = pool.request()
      .input('id', sql.Int, parseInt(id))
      .input('operator_id', sql.Int, user.user_id)
    if (status)         req2.input('status',         sql.NVarChar, status)
    if (severity_level) req2.input('severity_level', sql.NVarChar, severity_level)

    await req2.query(`UPDATE EmergencyReports SET ${setParts.join(', ')} WHERE report_id = @id`)

    // Notify all emergency_operators when severity escalated to critical or high
    if (severity_level && ['critical', 'high'].includes(severity_level)) {
      await pool.request()
        .input('id', sql.Int, parseInt(id))
        .input('severity_level', sql.NVarChar, severity_level)
        .query(`
          INSERT INTO Notifications (user_id, message, notification_type)
          SELECT u.user_id,
            'ESCALATION: Report #' + CAST(@id AS NVARCHAR) + ' severity raised to ' + UPPER(@severity_level),
            'alert'
          FROM Users u
          WHERE u.role IN ('admin', 'emergency_operator') AND u.is_active = 1
        `)
    }

    return NextResponse.json({ message: 'Updated' })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
