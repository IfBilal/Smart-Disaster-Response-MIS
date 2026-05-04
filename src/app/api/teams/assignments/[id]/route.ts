import { NextRequest, NextResponse } from 'next/server'
import { getPool, sql } from '@/lib/db'
import { checkAuth } from '@/lib/rbac'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['admin', 'emergency_operator'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { status } = await req.json()

  const validStatuses = ['assigned', 'in_progress', 'completed', 'cancelled']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
  }

  try {
    const pool = await getPool()

    const result = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .input('status', sql.NVarChar, status)
      .query(`
        UPDATE TeamAssignments
        SET status = @status,
            completed_at = CASE WHEN @status = 'completed' THEN GETDATE() ELSE completed_at END
        WHERE assignment_id = @id;
        SELECT @@ROWCOUNT AS affected;
      `)

    if (result.recordset[0].affected === 0) {
      return NextResponse.json({ error: 'Assignment not found.' }, { status: 404 })
    }

    return NextResponse.json({ message: `Assignment updated to ${status}` })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
