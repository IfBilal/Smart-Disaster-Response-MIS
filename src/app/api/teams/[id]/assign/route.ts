import { NextRequest, NextResponse } from 'next/server'
import { getPool, sql } from '@/lib/db'
import { checkAuth } from '@/lib/rbac'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['admin', 'emergency_operator'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: team_id } = await params
  const { report_id, notes } = await req.json()

  try {
    const pool = await getPool()

    // Transaction B: assign team + update report status atomically
    await pool.request()
      .input('team_id', sql.Int, parseInt(team_id))
      .input('report_id', sql.Int, report_id)
      .input('notes', sql.NVarChar, notes || null)
      .input('operator_id', sql.Int, user.user_id)
      .query(`
        BEGIN TRY
          BEGIN TRANSACTION

            INSERT INTO TeamAssignments (team_id, report_id, status, notes)
            VALUES (@team_id, @report_id, 'assigned', @notes);

            UPDATE EmergencyReports
            SET status = 'in_progress', operator_id = @operator_id
            WHERE report_id = @report_id AND status = 'pending';

          COMMIT TRANSACTION
        END TRY
        BEGIN CATCH
          IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
          THROW;
        END CATCH
      `)

    return NextResponse.json({ message: 'Team assigned successfully' }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
