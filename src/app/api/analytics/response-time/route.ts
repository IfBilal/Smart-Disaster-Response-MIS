import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { checkAuth } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const pool = await getPool()
    const result = await pool.request().query(`
      SELECT disaster_type,
             COUNT(*) AS resolved_count,
             AVG(DATEDIFF(MINUTE, reported_at, resolved_at)) AS avg_response_minutes,
             MIN(DATEDIFF(MINUTE, reported_at, resolved_at)) AS min_minutes,
             MAX(DATEDIFF(MINUTE, reported_at, resolved_at)) AS max_minutes
      FROM EmergencyReports
      WHERE status = 'resolved' AND resolved_at IS NOT NULL
      GROUP BY disaster_type
    `)
    return NextResponse.json(result.recordset)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
