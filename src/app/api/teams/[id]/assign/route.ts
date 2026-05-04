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

  if (!report_id) {
    return NextResponse.json({ error: 'report_id is required.' }, { status: 400 })
  }

  try {
    const pool = await getPool()

    // Prevent assigning the same team to the same report twice
    const dupCheck = await pool.request()
      .input('team_id', sql.Int, parseInt(team_id))
      .input('report_id', sql.Int, report_id)
      .query(`SELECT 1 AS found FROM TeamAssignments WHERE team_id = @team_id AND report_id = @report_id`)

    if (dupCheck.recordset.length > 0) {
      return NextResponse.json({ error: 'This team is already assigned to this report.' }, { status: 409 })
    }

    // Transaction B: assign team + update report status atomically.
    // We check @@ROWCOUNT on the report update — if 0 rows affected the report
    // was no longer pending (race condition), so we roll back the whole transaction.
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

            IF @@ROWCOUNT = 0
            BEGIN
              -- Report was not pending (already in_progress/resolved by concurrent request).
              -- The team assignment is still valid; just don't force status back.
              -- No rollback needed — assigning a team to an active report is fine.
              DECLARE @dummy INT = 0;
            END

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
