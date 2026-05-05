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

    // Fetch the approval to validate it exists, is still pending, and check type
    // UPDLOCK: lock the row so two reviewers can't approve simultaneously
    const fetch = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query(`SELECT status, request_type, allocation_id FROM ApprovalRequests WITH (UPDLOCK) WHERE approval_id = @id`)

    if (!fetch.recordset[0]) {
      return NextResponse.json({ error: 'Approval request not found.' }, { status: 404 })
    }

    const { status: currentStatus, request_type } = fetch.recordset[0]

    if (currentStatus !== 'pending') {
      return NextResponse.json({ error: `This request has already been ${currentStatus}.` }, { status: 409 })
    }

    // Role must match request type — finance_officer cannot approve resource allocations,
    // warehouse_manager cannot approve financial requests
    if (user.role === 'finance_officer' && request_type !== 'financial') {
      return NextResponse.json({ error: 'Finance officers can only review financial approval requests.' }, { status: 403 })
    }
    if (user.role === 'warehouse_manager' && request_type !== 'resource_allocation') {
      return NextResponse.json({ error: 'Warehouse managers can only review resource allocation requests.' }, { status: 403 })
    }

    // Transaction D: approve/reject.
    // trg_ApprovalRequest_Execute fires on approve → sets linked ResourceAllocation to 'approved'.
    // trg_ApprovalRequest_Reject fires on reject  → sets linked ResourceAllocation to 'rejected'.
    await pool.request()
      .input('id', sql.Int, parseInt(id))
      .input('status', sql.NVarChar, status)
      .input('reviewed_by', sql.Int, user.user_id)
      .input('remarks', sql.NVarChar, remarks || null)
      .query(`
        UPDATE ApprovalRequests
        SET status      = @status,
            reviewed_by = @reviewed_by,
            reviewed_at = GETDATE(),
            remarks     = @remarks
        WHERE approval_id = @id AND status = 'pending';
      `)

    return NextResponse.json({ message: `Request ${status}` })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
