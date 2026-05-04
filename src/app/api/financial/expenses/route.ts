import { NextRequest, NextResponse } from 'next/server'
import { getPool, sql } from '@/lib/db'
import { checkAuth } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['admin', 'finance_officer', 'warehouse_manager'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const pool = await getPool()
    const result = await pool.request().query(
      `SELECT TOP 100 e.*, u.username AS recorded_by_name
       FROM Expenses e
       JOIN Users u ON u.user_id = e.recorded_by
       ORDER BY e.expense_date DESC`
    )
    return NextResponse.json(result.recordset)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['admin', 'finance_officer'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { category, amount, description, expense_date, allocation_id } = await req.json()

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Expense amount must be greater than zero.' }, { status: 400 })
  }
  if (!category || !category.trim()) {
    return NextResponse.json({ error: 'category is required.' }, { status: 400 })
  }
  if (!expense_date) {
    return NextResponse.json({ error: 'expense_date is required.' }, { status: 400 })
  }

  try {
    const pool = await getPool()
    const result = await pool.request()
      .input('recorded_by', sql.Int, user.user_id)
      .input('allocation_id', sql.Int, allocation_id || null)
      .input('category', sql.NVarChar, category)
      .input('amount', sql.Decimal(15, 2), amount)
      .input('description', sql.NVarChar, description || null)
      .input('expense_date', sql.Date, new Date(expense_date))
      .query(`
        BEGIN TRY
          BEGIN TRANSACTION
            INSERT INTO Expenses (recorded_by, allocation_id, category, amount, description, expense_date)
            VALUES (@recorded_by, @allocation_id, @category, @amount, @description, @expense_date);

            DECLARE @eid INT = SCOPE_IDENTITY();

            INSERT INTO FinanceTransactions (performed_by, expense_id, transaction_type, amount, status)
            VALUES (@recorded_by, @eid, 'expense', @amount, 'completed');

            SELECT @eid AS expense_id;
          COMMIT TRANSACTION
        END TRY
        BEGIN CATCH
          IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
          THROW;
        END CATCH
      `)

    return NextResponse.json({ expense_id: result.recordset[0].expense_id }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
