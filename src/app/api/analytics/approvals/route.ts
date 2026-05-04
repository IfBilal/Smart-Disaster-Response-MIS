import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { checkAuth } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const pool = await getPool()

    const [byStatus, byType, avgTime] = await Promise.all([
      pool.request().query(`
        SELECT status, COUNT(*) AS count
        FROM ApprovalRequests
        GROUP BY status
      `),
      pool.request().query(`
        SELECT request_type,
               COUNT(*) AS total,
               SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved,
               SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
               SUM(CASE WHEN status = 'pending'  THEN 1 ELSE 0 END) AS pending
        FROM ApprovalRequests
        GROUP BY request_type
      `),
      pool.request().query(`
        SELECT request_type,
               AVG(DATEDIFF(MINUTE, requested_at, reviewed_at)) AS avg_review_minutes,
               COUNT(*) AS reviewed_count
        FROM ApprovalRequests
        WHERE reviewed_at IS NOT NULL
        GROUP BY request_type
      `),
    ])

    return NextResponse.json({
      byStatus: byStatus.recordset,
      byType: byType.recordset,
      avgReviewTime: avgTime.recordset,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
