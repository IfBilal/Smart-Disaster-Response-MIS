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
    const byDonorType = await pool.request().query(
      `SELECT donor_type, COUNT(*) AS count, SUM(amount) AS total FROM Donations GROUP BY donor_type`
    )
    const byCategory = await pool.request().query(
      `SELECT category, COUNT(*) AS count, SUM(amount) AS total FROM Expenses GROUP BY category`
    )

    return NextResponse.json({
      summary: summary.recordset[0],
      byDonorType: byDonorType.recordset,
      byCategory: byCategory.recordset,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
