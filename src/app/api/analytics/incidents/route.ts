import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { checkAuth } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const user = checkAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const pool = await getPool()

    const byType = await pool.request().query(`
      SELECT disaster_type, COUNT(*) AS total,
             SUM(CASE WHEN severity_level = 'critical' THEN 1 ELSE 0 END) AS critical_count,
             SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved
      FROM EmergencyReports
      GROUP BY disaster_type
    `)

    const bySeverity = await pool.request().query(`
      SELECT severity_level, COUNT(*) AS total
      FROM EmergencyReports
      GROUP BY severity_level
    `)

    const dailyCounts = await pool.request().query(`
      SELECT CAST(reported_at AS DATE) AS report_date, COUNT(*) AS count
      FROM EmergencyReports
      WHERE reported_at >= DATEADD(DAY, -30, GETDATE())
      GROUP BY CAST(reported_at AS DATE)
      ORDER BY report_date
    `)

    return NextResponse.json({ byType: byType.recordset, bySeverity: bySeverity.recordset, daily: dailyCounts.recordset })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
