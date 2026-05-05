import { NextRequest, NextResponse } from 'next/server'
import { getPool, sql } from '@/lib/db'
import { checkAuth } from '@/lib/rbac'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['admin', 'warehouse_manager'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { qty_dispatched } = await req.json()

  if (!qty_dispatched || qty_dispatched <= 0) {
    return NextResponse.json({ error: 'qty_dispatched must be greater than zero.' }, { status: 400 })
  }

  try {
    const pool = await getPool()

    // Pre-check (no lock): validate allocation exists and is in a dispatchable state
    // before entering the transaction, so we return clear user-facing errors early.
    const check = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .query(`SELECT status, qty_requested FROM ResourceAllocations WHERE allocation_id = @id`)

    if (!check.recordset[0]) {
      return NextResponse.json({ error: 'Allocation not found.' }, { status: 404 })
    }

    const { status, qty_requested } = check.recordset[0]

    if (status !== 'approved') {
      return NextResponse.json({ error: `Cannot dispatch: allocation is '${status}', must be 'approved' first.` }, { status: 400 })
    }

    if (qty_dispatched > qty_requested) {
      return NextResponse.json({ error: `Cannot dispatch ${qty_dispatched} — only ${qty_requested} was requested.` }, { status: 400 })
    }

    // Transaction A: UPDLOCK and UPDATE are in the same transaction block so the lock
    // is held from the SELECT until COMMIT. A concurrent dispatch cannot read
    // status='approved' on this row while this transaction is open.
    const result = await pool.request()
      .input('id', sql.Int, parseInt(id))
      .input('qty', sql.Decimal(12, 2), qty_dispatched)
      .input('approved_by', sql.Int, user.user_id)
      .query(`
        BEGIN TRY
          BEGIN TRANSACTION

            -- UPDLOCK: lock acquired here, held until COMMIT/ROLLBACK
            SELECT allocation_id FROM ResourceAllocations WITH (UPDLOCK)
            WHERE allocation_id = @id AND status = 'approved';

            -- trg_ResourceAllocation_Dispatch fires: deducts inventory.
            -- If stock is insufficient, trigger calls ROLLBACK + RAISERROR.
            UPDATE ResourceAllocations
            SET status = 'dispatched', qty_dispatched = @qty, approved_by = @approved_by
            WHERE allocation_id = @id AND status = 'approved';

            SELECT @@ROWCOUNT AS affected;

          COMMIT TRANSACTION
        END TRY
        BEGIN CATCH
          IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
          THROW;
        END CATCH
      `)

    if (result.recordset[0].affected === 0) {
      return NextResponse.json({ error: 'Dispatch failed — allocation may have already been dispatched.' }, { status: 409 })
    }

    return NextResponse.json({ message: 'Resources dispatched' })
  } catch (err: unknown) {
    console.error(err)
    const msg = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
