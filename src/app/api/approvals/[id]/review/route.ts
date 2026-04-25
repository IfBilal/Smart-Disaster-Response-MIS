import { NextRequest, NextResponse } from 'next/server'
import { getPool, sql } from '@/lib/db'
import { checkAuth } from '@/lib/rbac'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['admin', 'warehouse_manager', 'finance_officer'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { status, remarks } = await req.json()

  if (!['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  try {
    const pool = await getPool()

    // Transaction D: approve/reject — trigger auto-updates linked allocation
    await pool.request()
      .input('id', sql.Int, parseInt(id))
      .input('status', sql.NVarChar, status)
      .input('reviewed_by', sql.Int, user.user_id)
      .input('remarks', sql.NVarChar, remarks || null)
      .query(`
        BEGIN TRY
          BEGIN TRANSACTION
            UPDATE ApprovalRequests
            SET status      = @status,
                reviewed_by = @reviewed_by,
                reviewed_at = GETDATE(),
                remarks     = @remarks
            WHERE approval_id = @id AND status = 'pending';
          COMMIT TRANSACTION
        END TRY
        BEGIN CATCH
          IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
          THROW;
        END CATCH
      `)

    return NextResponse.json({ message: `Request ${status}` })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
