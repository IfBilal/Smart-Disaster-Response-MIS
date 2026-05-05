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

    // Pre-check (no lock): catch obvious duplicate early with a clear error message.
    const dupCheck = await pool.request()
      .input('team_id', sql.Int, parseInt(team_id))
      .input('report_id', sql.Int, report_id)
      .query(`SELECT 1 AS found FROM TeamAssignments WHERE team_id = @team_id AND report_id = @report_id`)

    if (dupCheck.recordset.length > 0) {
      return NextResponse.json({ error: 'This team is already assigned to this report.' }, { status: 409 })
    }

    // Transaction B: UPDLOCK is on RescueTeams (the availability row), inside the
    // transaction so the lock is held from SELECT until COMMIT.
    // Two concurrent operators cannot both read availability_status='available'
    // for the same team — the second one blocks until the first commits.
    await pool.request()
      .input('team_id', sql.Int, parseInt(team_id))
      .input('report_id', sql.Int, report_id)
      .input('notes', sql.NVarChar, notes || null)
      .input('operator_id', sql.Int, user.user_id)
      .query(`
        BEGIN TRY
          BEGIN TRANSACTION

            -- UPDLOCK on RescueTeams: lock the availability row; held until COMMIT.
            -- Concurrent assignment of the same team is blocked until this commits.
            SELECT team_id, availability_status
            FROM RescueTeams WITH (UPDLOCK)
            WHERE team_id = @team_id AND availability_status = 'available';

            IF @@ROWCOUNT = 0
            BEGIN
              ROLLBACK TRANSACTION;
              RAISERROR('Team is not available for assignment.', 16, 1);
              RETURN;
            END

            -- trg_TeamAssignment_Insert fires: sets RescueTeams.availability_status = 'assigned'
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
