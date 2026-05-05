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

    // Pre-check (no lock): validate the request exists, is pending, and role matches type.
    // This gives clear user-facing error messages before entering the transaction.
    const fetch = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query(`SELECT status, request_type, allocation_id FROM ApprovalRequests WHERE approval_id = @id`)

    if (!fetch.recordset[0]) {
      return NextResponse.json({ error: 'Approval request not found.' }, { status: 404 })
    }

    const { status: currentStatus, request_type } = fetch.recordset[0]

    if (currentStatus !== 'pending') {
      return NextResponse.json({ error: `This request has already been ${currentStatus}.` }, { status: 409 })
    }

    // Role must match request type
    if (user.role === 'finance_officer' && request_type !== 'financial') {
      return NextResponse.json({ error: 'Finance officers can only review financial approval requests.' }, { status: 403 })
    }
    if (user.role === 'warehouse_manager' && request_type !== 'resource_allocation') {
      return NextResponse.json({ error: 'Warehouse managers can only review resource allocation requests.' }, { status: 403 })
    }

    // Transaction D (approve) / Transaction E2 (reject):
    // UPDLOCK and UPDATE are in the same transaction block — the lock is held from
    // the SELECT until COMMIT so two concurrent reviewers cannot both read
    // status='pending' and both proceed.
    // trg_ApprovalRequest_Execute fires on 'approved' → sets linked ResourceAllocation to 'approved'.
    // trg_ApprovalRequest_Reject fires on 'rejected'  → sets linked ResourceAllocation to 'rejected'.
    await pool.request()
      .input('id', sql.Int, parseInt(id))
      .input('status', sql.NVarChar, status)
      .input('reviewed_by', sql.Int, user.user_id)
      .input('remarks', sql.NVarChar, remarks || null)
      .query(`
        BEGIN TRY
          BEGIN TRANSACTION

            -- UPDLOCK: lock the approval row; held until COMMIT.
            -- A concurrent reviewer is blocked until this transaction commits.
            SELECT approval_id FROM ApprovalRequests WITH (UPDLOCK)
            WHERE approval_id = @id AND status = 'pending';

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
