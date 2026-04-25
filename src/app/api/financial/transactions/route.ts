import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { checkAuth } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['admin', 'finance_officer'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const pool = await getPool()
    const summary = await pool.request().query(`SELECT * FROM vw_FinancialSummary`)
    const transactions = await pool.request().query(`
      SELECT TOP 50 ft.*, u.username AS performed_by_name,
             d.donor_name, e.category AS expense_category
      FROM FinanceTransactions ft
      JOIN Users u ON u.user_id = ft.performed_by
      LEFT JOIN Donations d ON d.donation_id = ft.donation_id
      LEFT JOIN Expenses  e ON e.expense_id  = ft.expense_id
      ORDER BY ft.transaction_timestamp DESC
    `)

    return NextResponse.json({
      summary: summary.recordset[0],
      transactions: transactions.recordset,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
